/* eslint-disable no-console */
import fs from 'fs'
import template from 'lodash/template'
import { Nuxt, Builder } from 'nuxt'
import config from '@/nuxt.config'
import { IOServer } from '@/server/io'

const oneSecond = 1000
const oneMinute = 60 * oneSecond

export async function compilePlugin({ src, tmpFile, options }) {
  const content = fs.readFileSync(src, 'utf-8')
  try {
    const compiled = template(content)
    const pluginJs = compiled({ options })
    fs.writeFileSync(tmpFile, pluginJs)
    const { default: Plugin, pOptions } = await import(tmpFile).catch((err) => {
      throw new Error('Err importing plugin: ' + err)
    })
    return { Plugin, pOptions }
  } catch (e) {
    throw new Error('Could not compile plugin :(' + e)
  }
}

export function removeCompiledPlugin(tmpFile) {
  fs.unlinkSync(tmpFile)
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

export async function ioServerInit(t) {
  console.time('ioServerInit')
  const ioServer = IOServer({
    proto: 'http',
    host: 'localhost',
    port: 4000
  })
  await ioServer.start()
  t.context.ioServer = ioServer
  console.timeEnd('ioServerInit')
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
