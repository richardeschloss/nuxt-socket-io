/* eslint-disable no-console */
import fs from 'fs'
import template from 'lodash/template'
import { Nuxt, Builder } from 'nuxt'
import serialize from 'serialize-javascript'
import config from '@/nuxt.config'
import { register } from '@/io/module'

const oneSecond = 1000
const oneMinute = 60 * oneSecond

export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function compilePlugin({ src, tmpFile, options, overwrite = false }) {
  if (!overwrite && fs.existsSync(tmpFile)) {
    console.info(`compiled plugin ${tmpFile} already exists`)
    return
  } else {
    console.log(`saving compiled plugin to: ${tmpFile}`)
  }
  const content = fs.readFileSync(src, 'utf-8')
  try {
    const compiled = template(content, { interpolate: /<%=([\s\S]+?)%>/g })
    const pluginJs = compiled({ options, serialize })
    fs.writeFileSync(tmpFile, pluginJs)
  } catch (err) {
    throw new Error('Could not compile plugin :(' + err)
  }
}

export async function importPlugin({
  tmpFile,
  setOptions = false,
  options = {}
}) {
  const imported = await import(tmpFile).catch((err) => {
    throw new Error('Err importing plugin: ' + err)
  })
  const { default: Plugin, pOptions } = imported
  if (setOptions) {
    pOptions.set(options)
  }

  return {
    Plugin,
    pOptions
  }
}

export async function compileAndImportPlugin({
  src,
  tmpFile,
  options,
  setOptions,
  overwrite
}) {
  console.time('compilePlugin')
  compilePlugin({ src, tmpFile, options, overwrite })
  console.timeEnd('compilePlugin')

  console.time('importPlugin')
  const imported = await importPlugin({ tmpFile, options, setOptions })
  console.timeEnd('importPlugin')
  return imported
}

export function injectPlugin(context = {}, Plugin) {
  return new Promise((resolve) => {
    Plugin(context, (label, nuxtSocket) => {
      context[`$${label}`] = nuxtSocket
      resolve(nuxtSocket)
    })
  })
}

export function getModuleOptions(moduleName, optsContainer) {
  const opts = {}
  const containers = ['buildModules', 'modules', optsContainer]
  containers.some((container) => {
    if (container === optsContainer) {
      Object.assign(opts, { [optsContainer]: config[container] })
      return true
    }
    const arr = config[container]
    const mod = arr.find((item) => {
      if (typeof item === 'string') {
        return item === moduleName
      } else if (item.length) {
        return item[0] === moduleName
      }
    })
    if (mod) {
      if (mod.length) {
        Object.assign(opts, mod[1])
      }
      return true
    }
  })
  return opts
}

export function ioServerInit(ports = [3000]) {
  const p = ports.map((port) => register.server({ port }))
  return Promise.all(p)
}

export async function nuxtInit(t) {
  t.timeout(3 * oneMinute)
  console.time('nuxtInit')
  console.log('Building Nuxt with config', config)
  const nuxt = new Nuxt(config)
  await new Builder(nuxt).build()
  await nuxt.server.listen(3000, 'localhost')
  t.context.nuxt = nuxt
  console.timeEnd('nuxtInit')
}

export function nuxtClose(t) {
  const { nuxt } = t.context
  nuxt.close()
}

export function waitForEvt(ctx, evt) {
  return new Promise((resolve) => {
    ctx.$on(evt, resolve)
  })
}

export function watchP(ctx, prop) {
  return new Promise((resolve) => {
    ctx.$watch(prop, resolve)
  })
}