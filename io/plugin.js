/*
 * Copyright 2019 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import io from 'socket.io-client'
import consola from 'consola'

function PluginOptions() {
  let _pluginOptions
  const svc = {}
  if (process.env.TEST) {
    svc.get = () => _pluginOptions
    svc.set = (opts) => (_pluginOptions = opts)
  } else {
    svc.get = () => (<%= JSON.stringify(options) %>)
  }
  return Object.freeze(svc)
}

const _pOptions = PluginOptions()

function propExists({ ctx, path }) {
  const exists = path.split('.').reduce((obj, prop) => {
    if (obj && obj[prop]) {
      return obj[prop]
    } else {
      return false
    }
  }, ctx)
  return !!exists
}

function parseNspEntry(entry) {
  // TBD: if entry is string vs object
  let pre, body, post
  let subItems = []
  const items = entry.trim().split(/\s*\]\s*/)
  if (items.length > 1) {
    pre = items[0]
    subItems = items[1].split(/\s*\[\s*/)
  } else {
    subItems = items[0].split(/\s*\[\s*/)
  }
  ;[body, post] = subItems
  return [pre, body, post]
}

function parseVuexEntry(entry, emitBack) {
  let evt, mapTo, pre, body, post
  if (typeof entry === 'string') {
    let subItems = []
    const items = entry.trim().split(/\s*\]\s*/)
    if (items.length > 1) {
      pre = items[0]
      subItems = items[1].split(/\s*\[\s*/)
    } else {
      subItems = items[0].split(/\s*\[\s*/)
    }
    ;[body, post] = subItems
    if (body.includes('-->')) {
      ;[evt, mapTo] = body.split(/\s*-->\s*/)
    } else if (body.includes('<--')) {
      ;[evt, mapTo] = body.split(/\s*<--\s*/)
    } else {
      evt = mapTo = body
    }
  } else if (emitBack) {
    ;[[mapTo, evt]] = Object.entries(entry)
  } else {
    ;[[evt, mapTo]] = Object.entries(entry)
  }
  return { pre, post, evt, mapTo }
}

function registerNamespace({ ctx, namespaceCfg, socket }) {
  const { emitters = [], listeners = [], emitBacks = [] } = namespaceCfg
  if (listeners.constructor.name === 'Array') {
    listeners.forEach((entry) => {
      const [pre, listenerGroup, post] = parseNspEntry(entry)
      const [listener, mapTo] = listenerGroup.split(/\s*-->\s*/)
      const mapToProp = mapTo || listener
      socket.on(listener, async (resp) => {
        if (pre !== undefined) {
          if (ctx[pre]) await ctx[pre]()
          else console.warn(`method ${pre} not defined`)
        }

        if (ctx[mapToProp] !== undefined) {
          ctx[mapToProp] = resp
        } else {
          console.warn(`${mapToProp} not defined on instance`)
        }

        if (post !== undefined) {
          if (ctx[post] !== undefined) ctx[post](resp)
          else console.warn(`method ${post} not defined`)
        }
      })
    })
  } else {
    console.warn('[nuxt-socket-io]: listeners needs to be an array in namespace config')
  }

  if (emitters.constructor.name === 'Array') {
    emitters.forEach((entry) => {
      const [pre, emitter, post] = parseNspEntry(entry)
      const [comps, mapTo] = emitter.split(/\s*-->\s*/)
      const [emitEvt, msgLabel] = comps.split(/\s*\+\s*/)

      ctx[emitEvt] = async function() {
        let msg
        if (msgLabel !== undefined) {
          if (ctx[msgLabel] !== undefined) {
            if (typeof ctx[msgLabel] === 'object') {
              msg = ctx[msgLabel].constructor.name === 'Array' ? [] : {}
              Object.assign(msg, ctx[msgLabel])
            } else {
              msg = ctx[msgLabel]
            }
          } else {
            console.warn(`prop or data item "${msgLabel}" not defined`)
          }
        }
        if (pre !== undefined) {
          if (ctx[pre]) await ctx[pre]()
          else console.warn(`method ${pre} not defined`)
        }
        return new Promise((resolve, reject) => {
          socket.emit(emitEvt, msg, (resp) => {
            if (mapTo !== undefined) {
              if (ctx[mapTo] !== undefined) ctx[mapTo] = resp
              else console.warn(`${mapTo} not defined on instance`)
            }
            if (post !== undefined) {
              if (ctx[post] !== undefined) ctx[post](resp)
              else console.warn(`method ${post} not defined`)
            }
            resolve(resp)
          })
        })
      }
    })
  } else {
    console.warn('[nuxt-socket-io]: emitters needs to be an array in namespace config')
  }

  if (emitBacks.constructor.name === 'Array') {
    emitBacks.forEach((entry) => {
      const [pre, emitBackGroup, post] = parseNspEntry(entry)
      let [mapTo, emitBack] = emitBackGroup.trim().split(/\s*<--\s*/)
      if (emitBack === undefined) {
        emitBack = mapTo
      }

      if (propExists({ ctx, path: emitBack })) {
        ctx.$watch(emitBack, async function(data) {
          if (pre !== undefined) {
            if (ctx[pre]) await ctx[pre]()
            else console.warn(`method ${pre} not defined`)
          }
          return new Promise((resolve) => {
            socket.emit(mapTo, { data }, (resp) => {
              if (post !== undefined) {
                if (ctx[post] !== undefined){
                  ctx[post](resp)
                } else {
                  console.warn(`method ${post} not defined`)
                }
                resolve()
              }
            })
            if (post === undefined) resolve()
          })
        })
      } else {
        console.warn(`Specified emitback ${emitBack} is not defined in component`)
      }
    })
  } else {
    console.warn('[nuxt-socket-io]: emitBacks needs to be an array in namespace config')
  }
}

function registerVuexOpts({ ctx, vuexOpts, useSocket, socket, store }) {
  const storeFns = {
    mutations: 'commit',
    actions: 'dispatch'
  }
  Object.entries(storeFns).forEach(([group, fn]) => {
    const groupOpts = vuexOpts[group] || []
    if (groupOpts.constructor.name === 'Array') {
      groupOpts.forEach((entry) => {
        const { pre, post, evt, mapTo } = parseVuexEntry(entry)
        socket.on(evt, async (data) => {
          if (pre !== undefined) {
            if (ctx[pre]) await ctx[pre]()
            else console.warn(`method ${pre} not defined`)
          } 
          store[fn](mapTo, data)
          if (post !== undefined) {
            if (ctx[post]) ctx[post]()
            else console.warn(`method ${post} not defined`)
          } 
        })
      })
    } else {
      console.warn(`[nuxt-socket-io]: vuexOption ${group} needs to be an array`)
    }
  })

  const { emitBacks = [] } = vuexOpts
  if (emitBacks.constructor.name === 'Array') {
    emitBacks.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseVuexEntry(entry, true)

      if (useSocket.registeredWatchers.includes(mapTo)) {
        return
      }

      const stateProps = mapTo.split('/')
      store.watch(
        (state) => {
          const out = Object.assign({}, state)
          const missingProps = []
          const watchProp = stateProps.reduce((outProp, prop) => {
            if (!outProp || !outProp[prop]) {
              missingProps.push(prop)
              return
            }
            outProp = outProp[prop]
            return outProp
          }, out)
          if (missingProps.length > 0) {
            const errEmitBack = missingProps.join('/')
            throw new Error(
              [
                `[nuxt-socket-io]: Trying to register emitback ${errEmitBack} failed`,
                `because it is not defined in Vuex.`,
                'Is state set up correctly in your stores folder?'
              ].join('\n')
            )
          }

          if (
            typeof watchProp === 'object' &&
            Object.prototype.hasOwnProperty.call(watchProp, '__ob__')
          ) {
            const errMsg = `${mapTo} is a vuex module. You probably want to watch its properties`
            throw new Error(errMsg)
          }
          useSocket.registeredWatchers.push(mapTo)
          return watchProp
        },
        async (data) => {
          if (pre !== undefined) {
            if (ctx[pre]) await ctx[pre]()
            else console.warn(`method ${pre} not defined`)
          } 
          
          socket.emit(evt, { data }, (resp) => {
            if (post !== undefined) {
              if (ctx[post]) ctx[post](resp)
              else console.warn(`method ${post} not defined`)
            } 
          })
        }
      )
    })
  } else {
    console.warn(`[nuxt-socket-io]: emitBacks in vuexOpts config needs to be an array`)
  }
}

function nuxtSocket(ioOpts) {
  const { name, channel = '', teardown = true, ...connectOpts } = ioOpts
  const pluginOptions = _pOptions.get()
  const { sockets } = pluginOptions
  const { $store: store } = this

  if (
    !sockets ||
    sockets.constructor.name !== 'Array' ||
    sockets.length === 0
  ) {
    throw new Error(
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  }

  let useSocket = null

  if (!name) {
    useSocket = sockets.find((s) => s.default === true)
  } else {
    useSocket = sockets.find((s) => s.name === name)
  }

  if (!useSocket) {
    useSocket = sockets[0]
  }

  if (!useSocket.url) {
    throw new Error('URL must be defined for nuxtSocket')
  }

  if (!useSocket.registeredWatchers) {
    useSocket.registeredWatchers = []
  }

  let { url: connectUrl } = useSocket
  connectUrl += channel

  const { vuex: vuexOpts, namespaces } = useSocket

  const socket = io(connectUrl, connectOpts)
  consola.info('connect', useSocket.name, connectUrl)

  if (namespaces) {
    const namespaceCfg = namespaces[channel]
    if (namespaceCfg) {
      registerNamespace({
        ctx: this,
        namespaceCfg,
        socket
      })
    }
  }

  if (vuexOpts) {
    registerVuexOpts({
      ctx: this,
      vuexOpts,
      useSocket,
      socket,
      store
    })
  }

  if (teardown) {
    this.onComponentDestroy = this.$destroy
    this.$destroy = function() {
      this.onComponentDestroy()
      socket.removeAllListeners()
      socket.close()
    }

    socket.on('disconnect', () => {
      socket.close()
    })
  }
  return socket
}

export default function(context, inject) {
  inject('nuxtSocket', nuxtSocket)
}

export let pOptions
if (process.env.TEST) {
  pOptions = {}
  Object.assign(pOptions, _pOptions)
}
