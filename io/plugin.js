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

function parseEntry(entry, emitBack) {
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
    } else if (body.includes('+')) {
      evt = body
    } else {
      evt = mapTo = body
    }
    ;[emitEvt, msgLabel] = evt.split(/\s*\+\s*/)
  } else if (emitBack) {
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
      console.warn(`prop or data item "${prop}" not defined`)
    }
  }
  return msg
}

function assignResp(ctx, prop, resp) {
  if (prop !== undefined) {
    if (ctx[prop] !== undefined) {
      ctx[prop] = resp
    } else {
      console.warn(`${prop} not defined on instance`)
    }
  }
}

async function runHook(ctx, prop, data) {
  if (prop !== undefined) {
    if (ctx[prop]) await ctx[prop](data)
    else console.warn(`method ${prop} not defined`)
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
  emitBacks({ ctx, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      if (propExists(ctx, mapTo)) {
        ctx.$watch(mapTo, async function(data, oldData) {
          await runHook(ctx, pre, { data, oldData })
          return new Promise((resolve) => {
            socket.emit(evt, { data }, (resp) => {
              runHook(ctx, post, resp)
              if (post !== undefined) resolve(resp)
            })
            if (post === undefined) resolve()
          })
        })
      } else {
        console.warn(`Specified emitback ${mapTo} is not defined in component`)
      }
    })
  },
  emitBacksVuex({ ctx, store, useSocket, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry, true)

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
          } else if (
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
      const { pre, post, mapTo, emitEvt, msgLabel } = parseEntry(entry)
      ctx[emitEvt] = async function(args) {
        const msg = args || assignMsg(ctx, msgLabel)
        await runHook(ctx, pre)
        return new Promise((resolve, reject) => {
          socket.emit(emitEvt, msg, (resp) => {
            const { err } = resp
            if (err !== undefined) {
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
            setTimeout(() => {
              const err = 'emitTimeout'
              if (typeof ctx[emitErrorsProp] === 'object') {
                register.emitErrors({
                  ctx,
                  err,
                  emitEvt,
                  emitErrorsProp
                })
                resolve()
              } else {
                reject({ err, emitEvt, hint: `is ${emitEvt} supported on the backend?` })
              }
            }, emitTimeout)
          }
        })
      }
    })
  },
  listeners({ ctx, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      socket.on(evt, async (resp) => {
        await runHook(ctx, pre)
        assignResp(ctx, mapTo, resp)
        runHook(ctx, post, resp)
      })
    })
  },
  listenersVuex({ ctx, socket, entries, storeFn }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      socket.on(evt, async (resp) => {
        await runHook(ctx, pre)
        storeFn(mapTo, resp)
        runHook(ctx, post, resp)
      })
    })
  },
  namespace({ ctx, namespaceCfg, socket, emitTimeout, emitErrorsProp }) {
    const { emitters = [], listeners = [], emitBacks = [] } = namespaceCfg
    const sets = { emitters, listeners, emitBacks }
    Object.entries(sets).forEach(([setName, entries]) => {
      if (entries.constructor.name === 'Array') {
        register[setName]({ ctx, socket, entries, emitTimeout, emitErrorsProp })
      } else {
        console.warn(
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
            storeFn: store[fnName]
          })
        } else {
          register.emitBacksVuex({ ctx, store, useSocket, socket, entries })
        }
      } else {
        console.warn(
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
      register.namespace({
        ctx: this,
        namespaceCfg,
        socket,
        emitTimeout,
        emitErrorsProp
      })
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
  }

  if (
    this.socketStatus !== undefined &&
    typeof this.socketStatus === 'object'
  ) {
    register.socketStatus({ ctx: this, socket, connectUrl, statusProp })
  }

  if (teardown) {
    if (this.onComponentDestroy === undefined) {
      this.onComponentDestroy = this.$destroy
    }

    this.$on('closeSockets', function() {
      socket.removeAllListeners()
      socket.close()
    })

    if (!this.registeredTeardown) {
      this.$destroy = function () {
        this.$emit('closeSockets')
        this.onComponentDestroy()
      }
      this.registeredTeardown = true
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
