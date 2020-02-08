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
    if (out && out[prop]) {
      return out[prop]
    } else {
      return false
    }
  }, obj)
  return !!exists
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
    if (ctx[prop]) await ctx[prop](data)
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

const register = {
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
          debug('local data changed. Emitting back:', { evt, mapTo, data })
          await runHook(ctx, pre, { data, oldData })
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
        async (data) => {
          debug('emitBack data changed. Emitting back', { evt, data, mapTo })
          await runHook(ctx, pre)
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
        const msg = args || assignMsg(ctx, msgLabel)
        debug('Emit evt', { emitEvt, msg })
        await runHook(ctx, pre)
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

  const socket = io(connectUrl, connectOpts)
  consola.info('[nuxt-socket-io]: connect', useSocket.name, connectUrl)

  if (namespaces) {
    const namespaceCfg = namespaces[channel]
    if (namespaceCfg) {
      register.namespace({
        ctx: this,
        namespaceCfg,
        socket,
        emitTimeout,
        emitErrorsProp
      })
      debug('namespaces configured for socket', { name: useSocket.name, channel, namespaceCfg })
    }
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
