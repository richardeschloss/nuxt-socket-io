import config from '#root/nuxt.config.js'

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

export function wrapModule (Module) {
  const ctx = {
    nuxt: {
      version: '2.x',
      hooks: {},
      hook (evt, cb) {
        ctx.nuxt.hooks[evt] = cb
      }
    },
    options: {
      plugins: [],
      publicRuntimeConfig: {}
    },
    /**
     * @param {any} plugin
     */
    addPlugin (plugin) {
      ctx.options.plugins.push(plugin)
    },
    Module
  }
  return ctx
}
