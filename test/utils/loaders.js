import { URL, pathToFileURL } from 'url'
// import * as compiler from 'vue-template-compiler'
import { parse, compileTemplate } from '@vue/compiler-sfc' // /dist/compiler-sfc.js' // '@vue/component-compiler-utils'

const baseURL = pathToFileURL(`${process.cwd()}/`).href
const regex = /(\.ts|\.css|\.vue)$/

function transformVue (source, url) {
  const filename = '/' + url.split(baseURL)[1]
  const parsed = parse(source, {
    // source,
    // @ts-ignore
    // compiler,
    filename
    // sourceMap: true
  })

  const compiledTemplate = compileTemplate({
    id: filename,
    filename,
    source: parsed.descriptor.template.content
    // @ts-ignore
    // compiler
  })

  return compiledTemplate.code +
    (parsed.script
      ? parsed.script.content
        .replace('export default {\n', 'export default {\n  render,\n')
      : 'export default {\n  render,\n _compiled: true\n }')
}

/**
 * @param {string} specifier
 * @param {{ parentURL?: string; url: any; }} context
 * @param {(arg0: any, arg1: any, arg2: any) => any} defaultResolve
 */
export function resolve (specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context
  if (regex.test(specifier)) {
    return {
      shortCircuit: true,
      url: new URL(specifier, parentURL).href
    }
  }

  // Let Node.js handle all other specifiers.
  return defaultResolve(specifier, context, defaultResolve)
}

export async function load (url, context, defaultLoad) {
  if (url.endsWith('vue.runtime.esm.js')) {
    const { source } = await defaultLoad(url, { format: 'module' })
    return {
      shortCircuit: true,
      format: 'module',
      source: source.toString()
    }
  } else if (url.endsWith('.vue')) {
    const { source } = await defaultLoad(url, { format: 'module' })
    return {
      shortCircuit: true,
      format: 'module',
      source: transformVue(source.toString(), url)
    }
  } else if (url.endsWith('.ts')) {
    const { source } = await defaultLoad(url, { format: 'module' })
    return {
      shortCircuit: true,
      format: 'module',
      source: source.toString()
    }
  } else if (url.endsWith('.css')) {
    return {
      shortCircuit: true,
      format: 'module',
      source: 'export default {}'
    }
  }

  // Let Node.js handle all other URLs.
  return defaultLoad(url, context, defaultLoad)
}
