/*
 * Copyright 2019 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import io from 'socket.io-client'
import consola from 'consola'
import Debug from 'debug'

const debug = Debug('nuxt-socket-io')

function PluginOptions() {
  let _pluginOptions
  if (process.env.TEST === undefined) {
    _pluginOptions = <%= JSON.stringify(options) %>
  }

  return Object.freeze({
    get: () => _pluginOptions,
    set: (opts) => (_pluginOptions = opts)
  })
}

const _pOptions = PluginOptions()

let warn

function camelCase(str) {
  return str
    .replace(/[_\-\s](.)/g, function($1) {
      return $1.toUpperCase()
    })
    .replace(/[-_\s]/g, '')
    .replace(/^(.)/, function($1) {
      return $1.toLowerCase()
    })
    .replace(/[^\w\s]/gi, '')
}

function propExists(obj, path) {
  const exists = path.split('.').reduce((out, prop) => {
    if (out !== undefined && out[prop] !== undefined) {
      return out[prop]
    } else {
      return
    }
  }, obj)
  
  return exists !== undefined
}

function parseEntry(entry, entryType) {
  let evt, mapTo, pre, body, post, emitEvt, msgLabel
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
      evt = body
    }

    if (entryType === 'emitter') {
      ;[emitEvt, msgLabel] = evt.split(/\s*\+\s*/)
    } else if (mapTo === undefined) {
      mapTo = evt
    }
  } else if (entryType === 'emitBack') {
    ;[[mapTo, evt]] = Object.entries(entry)
  } else {
    ;[[evt, mapTo]] = Object.entries(entry)
  }
  return { pre, post, evt, mapTo, emitEvt, msgLabel }
}

function assignMsg(ctx, prop) {
  let msg
  if (prop !== undefined) {
    if (ctx[prop] !== undefined) {
      if (typeof ctx[prop] === 'object') {
        msg = ctx[prop].constructor.name === 'Array' ? [] : {}
        Object.assign(msg, ctx[prop])
      } else {
        msg = ctx[prop]
      }
    } else {
      warn(`prop or data item "${prop}" not defined`)
    }
    debug(`assigned ${prop} to ${msg}`)
  }
  return msg
}

function assignResp(ctx, prop, resp) {
  if (prop !== undefined) {
    if (ctx[prop] !== undefined) {
      if (typeof ctx[prop] !== 'function') {
        ctx[prop] = resp
        debug(`assigned ${resp} to ${prop}`)
      }
    } else {
      warn(`${prop} not defined on instance`)
    }
  }
}

async function runHook(ctx, prop, data) {
  if (prop !== undefined) {
    if (ctx[prop]) return await ctx[prop](data)
    else warn(`method ${prop} not defined`)
  }
}

function propByPath(obj, path) {
  return path.split(/[/.]/).reduce((out, prop) => {
    if (out !== undefined && out[prop] !== undefined) {
      return out[prop]
    }
  }, obj)
}

const apiCache = (() => {
  /*
  apis {
    [socketName]: { // 'home', 'dflt', 'server1'
      [namespace]: { // 'dynamic'
        // server's api (at dynamic nsp)
      }, 
      [namespace]: { // '/'
        // server's api (at root nsp)
      }
    }
  }
  */
  const apis = {}
  return Object.freeze({
    get({ apiCacheProp, name, namespace }) {
      if (apiCacheProp === undefined) {
        return {}
      }

      Object.assign(apis, JSON.parse(localStorage.getItem(apiCacheProp)) || {})
      if (apis[name] === undefined || apis[name][namespace] === undefined) {
        return {}
      }

      return apis[name][namespace]
    },
    set({ apiCacheProp, name, namespace, api }) {
      if (apiCacheProp === undefined) {
        return
      }

      if (apis[name] === undefined) {
        apis[name] = {}  
      }

      if (apis[name][namespace] === undefined) {
        apis[name][namespace] = {}  
      }

      apis[name][namespace] = api
      localStorage.setItem(apiCacheProp, JSON.stringify(apis))
    }
  })
})()

function getAPI({ ctx, socket, version = 'latest', emitErrorsProp, emitTimeout }) {
  const emitEvt = 'getAPI'
  const timerObj = {}
  return new Promise((resolve, reject) => {
    socket.emit(emitEvt, { version }, (api) => {
      clearTimeout(timerObj.timer)
      resolve(api)
    })
    if (emitTimeout) {
      register
        .emitTimeout({
          ctx,
          emitEvt,
          emitErrorsProp,
          emitTimeout,
          timerObj
        })
        .then(resolve)
        .catch(reject)
      debug('Emit timeout registered for evt', { emitEvt, emitTimeout })
    }  
  })
}

const register = {
  serverApiEvents({ ctx, socket, namespace, api, ioDataProp, apiIgnoreEvts }) {
    const { evts } = api
    Object.entries(evts).forEach(([evt, entry]) => {
      const { methods = [], data: dataT, ack } = entry
      if (apiIgnoreEvts.includes(evt)) {
        debug(`Event ${evt} is in ignore list ("apiIgnoreEvts"), not registering.`)
        return
      }

      if (socket.hasListeners(evt)) {
        warn(`evt ${evt} already has a listener registered`)
      }

      methods.forEach((method) => {
        if (ctx[ioDataProp][method] === undefined) {
          ctx.$set(ctx[ioDataProp], method, {})
        }

        ctx.$set(ctx[ioDataProp][method], evt, dataT.constructor.name === 'Array' ? [] : {})
      })
      
      socket.on(evt, (msg, cb) => {
        const { method, data } = msg
        if (method !== undefined) {
          if (ctx[ioDataProp][method] === undefined) {
            ctx.$set(ctx[ioDataProp], method, {})
          }

          ctx.$set(ctx[ioDataProp][method], evt, data)
        } else {
          ctx.$set(ctx[ioDataProp], evt, data)
        }
        
        if (cb) {
          if (ack !== undefined) {
            cb({ ack: 'ok' })
          } else {
            cb()
          }
        }
      })
      debug(`Registered listener for ${evt} on ${namespace}`)
    })
  },
  serverApiMethods({
    ctx, 
    socket,
    api, 
    ioApiProp,
    ioDataProp,
    name,
    namespace,
    emitErrorsProp, 
    emitTimeout
  }) {
    Object.entries(api.methods).forEach(([fn, schema]) => {
      const { msg: msgT, resp: respT } = schema
      if (ctx[ioDataProp][fn] === undefined) {
        ctx.$set(ctx[ioDataProp], fn, {})
        if (msgT !== undefined) {
          ctx.$set(ctx[ioDataProp][fn], 'msg', { ...msgT })
        }

        if (respT !== undefined) {
          ctx.$set(ctx[ioDataProp][fn], 'resp', respT.constructor.name === 'Array' ? [] : {})
        }
      }
      
      ctx[ioApiProp][fn] = (args) => {
        return new Promise((resolve, reject) => {
          const timerObj = {}
          const emitEvt = fn
          const msg = args !== undefined ? args : ctx.ioData[fn].msg
          debug(`${ioApiProp}:${name}/${namespace}: Emitting ${emitEvt} with ${msg}`)
          socket.emit(emitEvt, msg, (resp) => {
            clearTimeout(timerObj.timer)
            debug(`[ioApi]:${namespace} rxd data`, { emitEvt, resp })
            const { emitError, ...errorDetails } = resp || {}
            if (emitError !== undefined) {
              const err = {
                message: emitError,
                emitEvt,
                errorDetails,
                timestamp: Date.now()
              }
              debug('Emit error occurred', err)
              if (typeof ctx[emitErrorsProp] === 'object') {
                register.emitErrors({
                  ctx,
                  err,
                  emitEvt,
                  emitErrorsProp
                })
                resolve()
              } else {
                reject(err)
              }
            } else {
              ctx[ioDataProp][fn].resp = resp
              resolve(resp)
            }
          })

          if (respT === undefined) {
            debug(`resp not defined on schema for ${fn}. Resolving.`)
            resolve()
          }

          if (emitTimeout) {
            register
              .emitTimeout({
                ctx,
                emitEvt,
                emitErrorsProp,
                emitTimeout,
                timerObj
              })
              .then(resolve)
              .catch(reject)
            debug('Emit timeout registered for evt', { emitEvt, emitTimeout })
          }  
        })
      }
    })
  },
  async serverAPI({ // TBD: 'api'
    ctx, 
    socket, 
    useSocket, 
    namespace, 
    apiCacheProp,
    apiVersion,
    apiIgnoreEvts,
    ioApiProp,
    ioDataProp,
    emitErrorsProp, 
    emitTimeout,
    clientAPI // TBD
  }) {
    debug('register api for', useSocket, namespace)
    const { name } = useSocket
    const api = apiCache.get({ apiCacheProp, name, namespace })

    if (apiVersion === 'latest' 
     || api.version === undefined 
     || parseFloat(apiVersion) > parseFloat(api.version)) {
      Object.assign(api, await getAPI({ ctx, socket, version: apiVersion, emitErrorsProp, emitTimeout }))
      apiCache.set({ apiCacheProp, name, namespace, api })
      debug(`api for ${name}${namespace} cached to localStorage: ${apiCacheProp}`)
      // TBD: in docs, devs might need to let users know info is cached (privacy policy, etc)
      // "we use cache to provide improved user experience..."
    } 
    
    if (ctx[ioApiProp] === undefined) {
      warn(`[nuxt-socket-io]: ${ioApiProp} needs to be defined in the current context (vue will complain)`)
    }
    ctx.$set(ctx, ioApiProp, api)

    if (api.methods !== undefined) {
      register.serverApiMethods({
        ctx, 
        socket,
        api, 
        name: useSocket.name,
        namespace,
        ioApiProp,
        ioDataProp,
        emitErrorsProp, 
        emitTimeout
      })
      debug(
        `Attached methods for ${useSocket.name}/${namespace} to ${ioApiProp}`, 
        Object.keys(api.methods)
      )
    }

    if (api.evts !== undefined) {
      console.log('register evts', api.evts)
      register.serverApiEvents({ ctx, socket, namespace, api, ioDataProp, apiIgnoreEvts })
    }

    ctx[ioApiProp].ready = true
    console.log('ioApi', ctx[ioApiProp])    
  },
  emitErrors({ ctx, err, emitEvt, emitErrorsProp }) {
    if (ctx[emitErrorsProp][emitEvt] === undefined) {
      ctx[emitErrorsProp][emitEvt] = []
    }
    ctx[emitErrorsProp][emitEvt].push(err)
  },
  emitTimeout({ ctx, emitEvt, emitErrorsProp, emitTimeout, timerObj }) {
    return new Promise((resolve, reject) => {
      timerObj.timer = setTimeout(() => {
        const err = {
          message: 'emitTimeout',
          emitEvt,
          emitTimeout,
          hint: [
            `1) Is ${emitEvt} supported on the backend?`,
            `2) Is emitTimeout ${emitTimeout} ms too small?`
          ].join('\r\n'),
          timestamp: Date.now()
        }
        debug('emitEvt timed out', err)
        if (typeof ctx[emitErrorsProp] === 'object') {
          register.emitErrors({ ctx, err, emitEvt, emitErrorsProp })
          resolve()
        } else {
          reject(err)
        }
      }, emitTimeout)
    })
  },
  emitBacks({ ctx, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry, 'emitBack')
      if (propExists(ctx, mapTo)) {
        debug('registered local emitBack', { mapTo })
        ctx.$watch(mapTo, async function(data, oldData) {
          debug('local data changed', evt, data)
          const preResult = await runHook(ctx, pre, { data, oldData })
          if (preResult === false) {
            return Promise.resolve()
          }
          debug('Emitting back:', { evt, mapTo, data })
          return new Promise((resolve) => {
            socket.emit(evt, { data }, (resp) => {
              runHook(ctx, post, resp)
              resolve(resp)
            })
            if (post === undefined) resolve()
          })
        })
      } else {
        warn(`Specified emitback ${mapTo} is not defined in component`)
      }
    })
  },
  emitBacksVuex({ ctx, store, useSocket, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry, 'emitBack')

      if (useSocket.registeredWatchers.includes(mapTo)) {
        return
      }

      store.watch(
        (state) => {
          const watchProp = propByPath(state, mapTo)
          if (watchProp === undefined) {
            throw new Error(
              [
                `[nuxt-socket-io]: Trying to register emitback ${mapTo} failed`,
                `because it is not defined in Vuex.`,
                'Is state set up correctly in your stores folder?'
              ].join('\n')
            )
          }
          useSocket.registeredWatchers.push(mapTo)
          debug('emitBack registered', { mapTo })
          return watchProp
        },
        async (data, oldData) => {
          debug('vuex emitBack data changed', { emitBack: evt, data })
          const preResult = await runHook(ctx, pre, { data, oldData })
          if (preResult === false) {
            return Promise.resolve()
          }
          debug('Emitting back:', { evt, mapTo, data })
          socket.emit(evt, { data }, (resp) => {
            runHook(ctx, post, resp)
          })
        }
      )
    })
  },
  emitters({ ctx, socket, entries, emitTimeout, emitErrorsProp }) {
    entries.forEach((entry) => {
      const { pre, post, mapTo, emitEvt, msgLabel } = parseEntry(entry, 'emitter')
      ctx[emitEvt] = async function(args) {
        const msg = args !== undefined
          ? args
          : assignMsg(ctx, msgLabel)
        debug('Emit evt', { emitEvt, msg })
        const preResult = await runHook(ctx, pre, msg)
        if (preResult === false) {
          return Promise.resolve()
        }
        return new Promise((resolve, reject) => {
          const timerObj = {}
          socket.emit(emitEvt, msg, (resp) => {
            debug('Emitter response rxd', { emitEvt, resp })
            clearTimeout(timerObj.timer)
            const { emitError, ...errorDetails } = resp || {}
            if (emitError !== undefined) {
              const err = {
                message: emitError,
                emitEvt,
                errorDetails,
                timestamp: Date.now()
              }
              debug('Emit error occurred', err)
              if (typeof ctx[emitErrorsProp] === 'object') {
                register.emitErrors({
                  ctx,
                  err,
                  emitEvt,
                  emitErrorsProp
                })
                resolve()
              } else {
                reject(err)
              }
            } else {
              assignResp(ctx, mapTo, resp)
              runHook(ctx, post, resp)
              resolve(resp)
            }
          })
          if (emitTimeout) {
            register
              .emitTimeout({
                ctx,
                emitEvt,
                emitErrorsProp,
                emitTimeout,
                timerObj
              })
              .then(resolve)
              .catch(reject)
            debug('Emit timeout registered for evt', { emitEvt, emitTimeout })
          }
        })
      }
      debug('Emitter created', { emitter: emitEvt })
    })
  },
  listeners({ ctx, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      debug('Registered local listener', evt)
      socket.on(evt, async (resp) => {
        debug('Local listener received data', { evt, resp })
        await runHook(ctx, pre)
        assignResp(ctx, mapTo, resp)
        runHook(ctx, post, resp)
      })
    })
  },
  listenersVuex({ ctx, socket, entries, storeFn, useSocket }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      async function vuexListenerEvt(resp) {
        debug('Vuex listener received data', { evt, resp })
        await runHook(ctx, pre)
        storeFn(mapTo, resp)
        runHook(ctx, post, resp)
      }
      
      if (useSocket.registeredVuexListeners.includes(evt)) return

      socket.on(evt, vuexListenerEvt)
      debug('Registered vuex listener', evt)
      useSocket.registeredVuexListeners.push(evt)
    })
  },
  namespace({ ctx, namespaceCfg, socket, emitTimeout, emitErrorsProp }) {
    const { emitters = [], listeners = [], emitBacks = [] } = namespaceCfg
    const sets = { emitters, listeners, emitBacks }
    Object.entries(sets).forEach(([setName, entries]) => {
      if (entries.constructor.name === 'Array') {
        register[setName]({ ctx, socket, entries, emitTimeout, emitErrorsProp })
      } else {
        warn(
          `[nuxt-socket-io]: ${setName} needs to be an array in namespace config`
        )
      }
    })
  },
  vuexModule({ store }) {
    store.registerModule(
      '$nuxtSocket',
      {
        namespaced: true,
        state: {
          ioApis: {},
          sockets: {},
          emitTimeouts: {}
        },
        mutations: {
          SET_API(state, { label, api }) {
            state.ioApis[label] = api
          },

          SET_SOCKET(state, { label, socket }) {
            state.sockets[label] = socket
          },

          SET_EMIT_TIMEOUT(state, { label, emitTimeout }) {
            state.emitTimeouts[label] = emitTimeout
          }
        },
        actions: {
          emit({ state }, { label, socket, evt, msg, emitTimeout }) {
            debug('$nuxtSocket vuex action "emit" dispatched', label, evt)
            return new Promise((resolve, reject) => {
              const _socket = socket || state.sockets[label]
              const _emitTimeout = emitTimeout !== undefined 
                ? emitTimeout
                : state.emitTimeouts[label]
              
              if (_socket === undefined) {
                reject(new Error(
                  'socket instance required. Please provide a valid socket label or socket instance'
                ))
              }
              debug(`Emitting ${evt} with msg: ${msg}`)
              let timer
              _socket.emit(evt, msg, (resp) => {
                clearTimeout(timer)
                resolve(resp)
              })
              if (_emitTimeout) {
                timer = setTimeout(() => {
                  const errHints = [
                    `1) Is ${evt} supported on the backend?`,
                    `2) Is emitTimeout ${evt} ms too small?`
                  ].join('\r\n')

                  reject(new Error(
                    `emitTimeout occurred emitting ${evt}\r\n` +
                    `hint: ${errHints}\r\n` + 
                    `timestamp: ${(new Date).toLocaleString()}`
                  ))
                }, _emitTimeout)
              }
            })
          }
        }
      },
      { preserveState: false }
    )
  },
  vuexOpts({ ctx, vuexOpts, useSocket, socket, store }) {
    const { mutations = [], actions = [], emitBacks = [] } = vuexOpts
    const sets = { mutations, actions, emitBacks }
    const storeFns = {
      mutations: 'commit',
      actions: 'dispatch'
    }
    Object.entries(sets).forEach(([setName, entries]) => {
      if (entries.constructor.name === 'Array') {
        const fnName = storeFns[setName]
        if (fnName) {
          register.listenersVuex({
            ctx,
            socket,
            entries,
            storeFn: store[fnName],
            useSocket
          })
        } else {
          register.emitBacksVuex({ ctx, store, useSocket, socket, entries })
        }
      } else {
        warn(
          `[nuxt-socket-io]: vuexOption ${setName} needs to be an array`
        )
      }
    })
  },
  socketStatus({ ctx, socket, connectUrl, statusProp }) {
    const socketStatus = { connectUrl }
    const clientEvts = [
      'connect_error',
      'connect_timeout',
      'reconnect',
      'reconnect_attempt',
      'reconnecting',
      'reconnect_error',
      'reconnect_failed',
      'ping',
      'pong'
    ]
    clientEvts.forEach((evt) => {
      const prop = camelCase(evt)
      socketStatus[prop] = ''
      socket.on(evt, (resp) => {
        Object.assign(ctx[statusProp], { [prop]: resp })
      })
    })
    Object.assign(ctx, { [statusProp]: socketStatus })
  },
  teardown({ ctx, socket, useSocket }) {
    if (ctx.onComponentDestroy === undefined) {
      ctx.onComponentDestroy = ctx.$destroy
    }

    ctx.$on('closeSockets', function() {
      socket.removeAllListeners()
      socket.close()
    })

    if (!ctx.registeredTeardown) {
      debug('teardown enabled for socket', { name: useSocket.name })
      ctx.$destroy = function() {
        debug('component destroyed, closing socket(s)', { name: useSocket.name, url: useSocket.url })
        useSocket.registeredVuexListeners = []
        ctx.$emit('closeSockets')
        ctx.onComponentDestroy()
      }
      ctx.registeredTeardown = true
    }

    socket.on('disconnect', () => {
      debug('server disconnected', { name: useSocket.name, url: useSocket.url })
      socket.close()
    })
  }
}

function nuxtSocket(ioOpts) {
  const {
    name,
    channel = '',
    statusProp = 'socketStatus',
    teardown = true,
    emitTimeout,
    emitErrorsProp = 'emitErrors',
    apiVersion,
    ioApiProp = 'ioApi',
    ioDataProp = 'ioData',
    apiCacheProp, 
    apiIgnoreEvts = [],
    persist,
    // vuexOpts: vuexOptsOverride, // TBD
    clientAPI = {},
    ...connectOpts
  } = ioOpts
  const pluginOptions = _pOptions.get()
  const { sockets, warnings = true } = pluginOptions
  const { $store: store } = this

  warn = warnings && process.env.NODE_ENV !== 'production'
    ? console.warn
    : () => {}

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

  if (!useSocket.name) {
    useSocket.name = 'dflt'
  }

  if (!useSocket.url) {
    throw new Error('URL must be defined for nuxtSocket')
  }

  if (!useSocket.registeredWatchers) {
    useSocket.registeredWatchers = []
  }

  if (!useSocket.registeredVuexListeners) {
    useSocket.registeredVuexListeners = []
  }

  let { url: connectUrl } = useSocket
  connectUrl += channel

  const { vuex: vuexOpts, namespaces } = useSocket

  let socket

  if (persist) {
    if (!store.state.$nuxtSocket) {
      debug('vuex store $nuxtSocket does not exist....registering it')
      register.vuexModule({ store })
    }

    const label = `${useSocket.name}${channel}`
    if (store.state.$nuxtSocket.sockets[label]) {
      debug(`resuing persisted socket ${label}`)
      socket = store.state.$nuxtSocket.sockets[label]
    } else {
      debug(`socket ${label} does not exist, creating and connecting to it..`)
      socket = io(connectUrl, connectOpts)
      consola.info('[nuxt-socket-io]: connect', useSocket.name, connectUrl)
      store.commit('$nuxtSocket/SET_SOCKET', { label, socket })
      store.commit('$nuxtSocket/SET_EMIT_TIMEOUT', { label, emitTimeout })
    }
  } else {
    socket = io(connectUrl, connectOpts)
    consola.info('[nuxt-socket-io]: connect', useSocket.name, connectUrl)
  }

  if (namespaces) {
    const namespaceCfg = namespaces[channel]
    if (namespaceCfg) {
      register.namespace({
        ctx: this,
        namespace: channel,
        namespaceCfg,
        socket,
        useSocket,
        emitTimeout,
        emitErrorsProp,
        apiVersion,
        clientAPI
      })
      debug('namespaces configured for socket', { name: useSocket.name, channel, namespaceCfg })
    }
  }

  if (apiVersion) {
    register.serverAPI({ 
      apiVersion,
      apiIgnoreEvts,
      ioApiProp,
      ioDataProp,
      apiCacheProp,
      ctx: this, 
      socket, 
      namespace: channel, 
      useSocket, 
      emitTimeout, 
      emitErrorsProp, 
      clientAPI 
    })
  }

  if (vuexOpts) {
    register.vuexOpts({
      ctx: this,
      vuexOpts,
      useSocket,
      socket,
      store
    })
    debug('vuexOpts configured for socket', { name: useSocket.name, vuexOpts })
  }

  if (
    this.socketStatus !== undefined &&
    typeof this.socketStatus === 'object'
  ) {
    register.socketStatus({ ctx: this, socket, connectUrl, statusProp })
    debug('socketStatus registered for socket', { name: useSocket.name, url: connectUrl })
  }

  if (teardown) {
    register.teardown({
      ctx: this,
      socket,
      useSocket
    })
  }
  _pOptions.set({ sockets })
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
