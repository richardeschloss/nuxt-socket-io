import path from 'path'
import { nuxtCtx, useNuxt } from '@nuxt/kit'
import config from '#root/nuxt.config.js'

const srcDir = path.resolve('.')

export { useNuxt }

export function getModuleOptions (moduleName, optsContainer) {
  const opts = {}
  const containers = ['buildModules', 'modules', optsContainer]
  containers.some((container) => {
    if (container === optsContainer) {
      Object.assign(opts, { [optsContainer]: config[container] })
      return true
    }
    const arr = config[container]
    const mod = arr.find(
      /**
     * @param {string | any[]} item
     */
      (item) => {
        if (typeof item === 'string') {
          return item === moduleName
        } else if (item.length) {
          return item[0] === moduleName
        }
        return false
      })
    if (mod) {
      if (mod.length) {
        Object.assign(opts, mod[1])
      }
      return true
    }
    return false
  })
  return opts
}

export function initNuxt () {
  nuxtCtx.unset()
  const nuxt = {
    __nuxt2_shims_key__: true,
    version: '2.x',
    hooks: {
      addHooks: () => {}
    },
    hook (evt, cb) {
      nuxtCtx.use().hooks[evt] = cb
    },
    options: {
      css: [],
      srcDir,
      plugins: [],
      modules: [],
      serverMiddleware: [],
      build: {
        transpile: [],
        templates: []
      },
      publicRuntimeConfig: {}
    }
  }
  // @ts-ignore
  nuxtCtx.set(nuxt)
}
