/* eslint-disable no-console */
/*
 * Copyright 2022 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import io from 'socket.io-client'
import Debug from 'debug'
import emitter from 'tiny-emitter/instance.js'
// @ts-ignore
import { watch } from 'vue'
import { defineNuxtPlugin, useState } from '#app'

/*
 TODO:
 1) will enable when '@nuxtjs/composition-api' reaches stable version:
 2) will bump from devDep to dep when stable
*/

const debug = Debug('nuxt-socket-io')
const isRefImpl = any => any && any.constructor.name === 'RefImpl'

const delay = (ms, timerObj) => new Promise((resolve, reject) => {
  timerObj.timer = setTimeout(() => resolve(true), ms)
  timerObj.abort = () => {
    clearTimeout(timerObj.timer)
    reject(new Error('AbortError'))
  }
})

const _sockets = {}

export const mutations = {
  SET_API (state, { label, api }) {
    state.ioApis[label] = api
  },

  SET_CLIENT_API (state, { label = 'clientAPI', ...api }) {
    state.clientApis[label] = api
  },

  SET_EMIT_ERRORS (state, { label, emitEvt, err }) {
    if (state.emitErrors[label] === undefined) {
      state.emitErrors[label] = {}
    }

    if (state.emitErrors[label][emitEvt] === undefined) {
      state.emitErrors[label][emitEvt] = []
    }

    state.emitErrors[label][emitEvt].push(err)
  },

  SET_EMIT_TIMEOUT (state, { label, emitTimeout }) {
    if (!state.emitTimeouts[label]) {
      state.emitTimeouts[label] = {}
    }
    state.emitTimeouts[label] = emitTimeout
  }
}

export const ioState = () => useState('$io', () => ({}))

export const useNuxtSocket = () => useState('$nuxtSocket', () => ({
  clientApis: {},
  ioApis: {},
  emitErrors: {},
  emitTimeouts: {}
}))

export async function emit ({ // TBD: test...
  label = '',
  socket = _sockets[label],
  evt,
  msg,
  emitTimeout = useNuxtSocket().value.emitTimeouts[label],
  noAck = false
}) {
  const state = useNuxtSocket().value
  debug('$nuxtSocket.emit', label, evt)
  if (socket === undefined) {
    throw new Error(
      'socket instance required. Please provide a valid socket label or socket instance'
    )
  }

  register.emitP(socket)

  debug(`Emitting ${evt} with msg`, msg)
  const timerObj = {}
  const p = [socket.emitP(evt, msg)]
  if (noAck) {
    return
  }

  if (emitTimeout) {
    p.push(
      register.emitTimeout({
        emitTimeout,
        timerObj
      }).catch((err) => {
        if (label !== undefined && label !== '') {
          mutations.SET_EMIT_ERRORS(state, { label, emitEvt: evt, err })
          debug(
            `[nuxt-socket-io]: ${label} Emit error occurred and logged to vuex `,
            err
          )
        } else {
          throw new Error(err.message)
        }
      })
    )
  }
  const resp = await Promise.race(p)
  debug('Emitter response rxd', { evt, resp })
  if (timerObj.abort) {
    timerObj.abort()
  }
  const { emitError, ...errorDetails } = resp || {}
  if (emitError !== undefined) {
    const err = {
      message: emitError,
      emitEvt: evt,
      errorDetails,
      timestamp: Date.now()
    }
    debug('Emit error occurred', err)
    if (label !== undefined && label !== '') {
      debug(
        `[nuxt-socket-io]: ${label} Emit error ${err.message} occurred and logged to vuex `,
        err
      )
      mutations.SET_EMIT_ERRORS(state, { label, emitEvt: evt, err })
    } else {
      throw new Error(err.message)
    }
  } else {
    return resp
  }
}

let warn, infoMsgs

function camelCase (str) {
  return str
    .replace(/[_\-\s](.)/g, function ($1) {
      return $1.toUpperCase()
    })
    .replace(/[-_\s]/g, '')
    .replace(/^(.)/, function ($1) {
      return $1.toLowerCase()
    })
    .replace(/[^\w\s]/gi, '')
}

function propExists (obj, path) {
  // eslint-disable-next-line array-callback-return
  const exists = path.split('.').reduce((out, prop) => {
    if (out !== undefined && out[prop] !== undefined) {
      return out[prop]
    }
  }, obj)

  return exists !== undefined
}

function parseEntry (entry, entryType) {
  let evt, mapTo, pre, emitEvt, msgLabel, post
  if (typeof entry === 'string') {
    let subItems = []
    let body
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
  }
  return { pre, post, evt, mapTo, emitEvt, msgLabel }
}

function assignMsg (ctx, prop) {
  let msg
  if (prop !== undefined) {
    if (ctx[prop] !== undefined) {
      if (typeof ctx[prop] === 'object') {
        msg = Array.isArray(ctx[prop]) ? [] : {}
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

function assignResp (ctx, prop, resp) {
  if (prop !== undefined) {
    if (ctx[prop] !== undefined) {
      if (typeof ctx[prop] !== 'function') {
        // In vue3, it's possible to create
        // reactive refs on the fly with ref()
        // so check for that here.
        // (this would elimnate the need for v2's
        // this.$set because we just set the value prop
        // to trigger the UI changes)
        if (isRefImpl(ctx[prop])) {
          ctx[prop].value = resp
        } else {
          ctx[prop] = resp
        }
        debug(`assigned ${resp} to ${prop}`)
      }
    } else {
      warn(`${prop} not defined on instance`)
    }
  }
}

async function runHook (ctx, prop, data) {
  if (prop !== undefined) {
    if (ctx[prop]) { return await ctx[prop](data) } else { warn(`method ${prop} not defined`) }
  }
}

/**
 * Validate the provided sockets are an array
 * of at least 1 item
 * @param {Array<*>} sockets
 */
function validateSockets (sockets) {
  return (sockets &&
    Array.isArray(sockets) &&
    sockets.length > 0)
}

export const register = {
  clientApiEvents ({ ctx, socket, api }) {
    const { evts } = api
    Object.entries(evts).forEach(([emitEvt, schema]) => {
      const { data: dataT } = schema
      const fn = emitEvt + 'Emit'
      if (ctx[emitEvt] !== undefined) {
        if (dataT !== undefined) {
          Object.entries(dataT).forEach(([key, val]) => {
            ctx.$set(ctx[emitEvt], key, val)
          })
          debug('Initialized data for', emitEvt, dataT)
        }
      }

      if (ctx[fn] !== undefined) {
        return
      }

      ctx[fn] = async (fnArgs) => {
        const { label: apiLabel, ack, ...args } = fnArgs || {}
        const label = apiLabel || api.label
        const msg = Object.keys(args).length > 0 ? args : { ...ctx[emitEvt] }
        msg.method = fn
        if (ack) {
          const ackd = await emit({
            label,
            socket,
            evt: emitEvt,
            msg
          })
          return ackd
        } else {
          emit({
            label,
            socket,
            evt: emitEvt,
            msg,
            noAck: true
          })
        }
      }
      debug('Registered clientAPI method', fn)
    })
  },
  clientApiMethods ({ ctx, socket, api }) {
    const { methods } = api
    const evts = Object.assign({}, methods, { getAPI: {} })
    Object.entries(evts).forEach(([evt, schema]) => {
      if (socket.hasListeners(evt)) {
        warn(`evt ${evt} already has a listener registered`)
      }

      socket.on(evt, async (msg, cb) => {
        if (evt === 'getAPI') {
          if (cb) { cb(api) }
        } else if (ctx[evt] !== undefined) {
          msg.method = evt
          const resp = await ctx[evt](msg)
          if (cb) { cb(resp) }
        } else if (cb) {
          // eslint-disable-next-line node/no-callback-literal
          cb({
            emitErr: 'notImplemented',
            msg: `Client has not yet implemented method (${evt})`
          })
        }
      })

      debug(`registered client api method ${evt}`)
      if (evt !== 'getAPI' && ctx[evt] === undefined) {
        warn(
          `client api method ${evt} has not been defined. ` +
            'Either update the client api or define the method so it can be used by callers'
        )
      }
    })
  },
  clientAPI ({ ctx, socket, clientAPI }) {
    const state = useNuxtSocket().value
    if (clientAPI.methods) {
      register.clientApiMethods({ ctx, socket, api: clientAPI })
    }

    if (clientAPI.evts) {
      register.clientApiEvents({ ctx, socket, api: clientAPI })
    }

    mutations.SET_CLIENT_API(state, clientAPI)
    debug('clientAPI registered', clientAPI)
  },
  serverApiEvents ({ ctx, socket, api, label, ioDataProp, apiIgnoreEvts }) {
    const { evts } = api
    Object.entries(evts).forEach(([evt, entry]) => {
      const { methods = [], data: dataT } = entry
      if (apiIgnoreEvts.includes(evt)) {
        debug(
          `Event ${evt} is in ignore list ("apiIgnoreEvts"), not registering.`
        )
        return
      }

      if (socket.hasListeners(evt)) {
        warn(`evt ${evt} already has a listener registered`)
      }

      if (methods.length === 0) {
        let initVal = dataT
        if (typeof initVal === 'object') {
          initVal = Array.isArray(dataT) ? [] : {}
        }
        ctx.$set(ctx[ioDataProp], evt, initVal)
      } else {
        methods.forEach((method) => {
          if (ctx[ioDataProp][method] === undefined) {
            ctx.$set(ctx[ioDataProp], method, {})
          }

          ctx.$set(
            ctx[ioDataProp][method],
            evt,
            Array.isArray(dataT) ? [] : {}
          )
        })
      }

      socket.on(evt, (msg, cb) => {
        debug(`serverAPI event ${evt} rxd with msg`, msg)
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
          // eslint-disable-next-line node/no-callback-literal
          cb({ ack: 'ok' })
        }
      })
      debug(`Registered listener for ${evt} on ${label}`)
    })
  },
  serverApiMethods ({ ctx, socket, api, label, ioApiProp, ioDataProp }) {
    Object.entries(api.methods).forEach(([fn, schema]) => {
      const { msg: msgT, resp: respT } = schema
      if (ctx[ioDataProp][fn] === undefined) {
        ctx.$set(ctx[ioDataProp], fn, {})
        if (msgT !== undefined) {
          ctx.$set(ctx[ioDataProp][fn], 'msg', { ...msgT })
        }

        if (respT !== undefined) {
          ctx.$set(
            ctx[ioDataProp][fn],
            'resp',
            Array.isArray(respT) ? [] : {}
          )
        }
      }

      ctx[ioApiProp][fn] = async (args) => {
        const emitEvt = fn
        const msg = args !== undefined ? args : { ...ctx[ioDataProp][fn].msg }
        debug(`${ioApiProp}:${label}: Emitting ${emitEvt} with ${msg}`)
        const resp = await emit({
          label,
          socket,
          evt: emitEvt,
          msg
        })

        ctx[ioDataProp][fn].resp = resp
        return resp
      }
    })
  },
  async serverAPI ({
    ctx,
    socket,
    label,
    apiIgnoreEvts,
    ioApiProp,
    ioDataProp,
    serverAPI,
    clientAPI = {}
  }) {
    const state = useNuxtSocket().value
    if (ctx[ioApiProp] === undefined) {
      console.error(
        `[nuxt-socket-io]: ${ioApiProp} needs to be defined in the current context for ` +
          'serverAPI registration (vue requirement)'
      )
      return
    }

    const apiLabel = serverAPI.label || label
    debug('register api for', apiLabel)
    const api = state.ioApis[apiLabel] || {}
    const fetchedApi = await emit({
      label: apiLabel,
      socket,
      evt: serverAPI.evt || 'getAPI',
      msg: serverAPI.data || {}
    })

    const isPeer =
      clientAPI.label === fetchedApi.label &&
      parseFloat(clientAPI.version) === parseFloat(fetchedApi.version)
    if (isPeer) {
      Object.assign(api, clientAPI)
      mutations.SET_API(state, { label: apiLabel, api })
      debug(`api for ${apiLabel} registered`, api)
    } else if (parseFloat(api.version) !== parseFloat(fetchedApi.version)) {
      Object.assign(api, fetchedApi)
      mutations.SET_API(state, { label: apiLabel, api })
      debug(`api for ${apiLabel} registered`, api)
    }

    ctx.$set(ctx, ioApiProp, api)

    if (api.methods !== undefined) {
      register.serverApiMethods({
        ctx,
        socket,
        api,
        label,
        ioApiProp,
        ioDataProp
      })
      debug(
        `Attached methods for ${label} to ${ioApiProp}`,
        Object.keys(api.methods)
      )
    }

    if (api.evts !== undefined) {
      register.serverApiEvents({
        ctx,
        socket,
        api,
        label,
        ioDataProp,
        apiIgnoreEvts
      })
      debug(`registered evts for ${label} to ${ioApiProp}`)
    }

    ctx.$set(ctx[ioApiProp], 'ready', true)
    debug('ioApi', ctx[ioApiProp])
  },
  emitErrors ({ ctx, err, emitEvt, emitErrorsProp }) {
    if (ctx[emitErrorsProp][emitEvt] === undefined) {
      ctx[emitErrorsProp][emitEvt] = []
    }
    ctx[emitErrorsProp][emitEvt].push(err)
  },
  /**
   * @param {*} info
   * @param {number} info.emitTimeout
   * @param {*} info.timerObj
   * @param {*} [info.ctx]
   * @param {string} [info.emitEvt]
   * @param {string} [info.emitErrorsProp]
   */
  async emitTimeout ({ ctx, emitEvt, emitErrorsProp, emitTimeout, timerObj }) {
    const timedOut = await delay(emitTimeout, timerObj).catch(() => {})
    if (!timedOut) {
      return
    }
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
    if (ctx !== undefined && typeof ctx[emitErrorsProp] === 'object') {
      register.emitErrors({ ctx, err, emitEvt, emitErrorsProp })
    } else {
      throw err
    }
  },
  emitBacks ({ ctx, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry, 'emitBack')
      if (propExists(ctx, mapTo)) {
        debug('registered local emitBack', { mapTo })
        ctx.$watch(mapTo, async function (data, oldData) {
          debug('local data changed', evt, data)
          const preResult = await runHook(ctx, pre, { data, oldData })
          if (preResult === false) {
            return
          }
          debug('Emitting back:', { evt, mapTo, data })
          const p = socket.emitP(evt, { data })
          if (post === undefined) {
            return
          }
          const resp = await p
          runHook(ctx, post, resp)
          return resp
        })
      } else {
        warn(`Specified emitback ${mapTo} is not defined in component`)
      }
    })
  },
  emitters ({ ctx, socket, entries, emitTimeout, emitErrorsProp }) {
    entries.forEach((entry) => {
      const { pre, post, mapTo, emitEvt, msgLabel } = parseEntry(
        entry,
        'emitter'
      )
      ctx[emitEvt] = async function (msg = assignMsg(ctx, msgLabel)) {
        debug('Emit evt', { emitEvt, msg })
        const preResult = await runHook(ctx, pre, msg)
        if (preResult === false) {
          return
        }
        const p = [socket.emitP(emitEvt, msg)]
        const timerObj = {}
        if (emitTimeout) {
          p.push(register
            .emitTimeout({
              ctx,
              emitEvt,
              emitErrorsProp,
              emitTimeout,
              timerObj
            }))
        }
        const resp = await Promise.race(p)
        debug('Emitter response rxd', { emitEvt, resp })
        if (timerObj.abort) {
          timerObj.abort()
        }
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
          } else {
            throw err
          }
        } else {
          assignResp(ctx.$data || ctx, mapTo, resp)
          runHook(ctx, post, resp)
          return resp
        }
      }
      debug('Emitter created', { emitter: emitEvt })
    })
  },
  listeners ({ ctx, socket, entries }) {
    entries.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      debug('Registered local listener', evt)
      socket.on(evt, async (resp) => {
        debug('Local listener received data', { evt, resp })
        await runHook(ctx, pre)
        assignResp(ctx.$data || ctx, mapTo, resp)
        runHook(ctx, post, resp)
      })
    })
  },
  namespace ({ ctx, namespaceCfg, socket, emitTimeout, emitErrorsProp }) {
    const { emitters = [], listeners = [], emitBacks = [] } = namespaceCfg
    const sets = { emitters, listeners, emitBacks }
    Object.entries(sets).forEach(([setName, entries]) => {
      if (Array.isArray(entries)) {
        register[setName]({ ctx, socket, entries, emitTimeout, emitErrorsProp })
      } else {
        warn(
          `[nuxt-socket-io]: ${setName} needs to be an array in namespace config`
        )
      }
    })
  },
  iox ({ stateOpts, socket, useSocket }) {
    debug('register.iox', stateOpts)
    const iox = ioState().value
    const entryRegex = /\s*<*-->*\s*/
    const toRegex = /\s*[^<]-->\s*/
    const fromRegex = /\s*<--[^>]\s*/

    stateOpts.forEach((entry) => {
      let [evt, dest] = entry.split(entryRegex)
      let nsp
      if (dest === undefined) {
        dest = evt
      }

      const destParts = dest.split('/')
      if (destParts.length > 1) {
        nsp = destParts[0]
        if (iox[nsp] === undefined) {
          iox[nsp] = {}
        }
        dest = destParts[1]
      }

      function receiveEvt () {
        socket.on(evt, (msg) => {
          debug('iox evt received', evt, msg)
          if (nsp) {
            iox[nsp][dest] = msg
            debug('iox evt saved', evt, `${nsp}/${dest}`)
          } else {
            iox[dest] = msg
            debug('iox evt saved', evt, dest)
          }
        })
      }

      function emitBack () {
        const watchPath = nsp ? `${nsp}/${dest}` : dest
        if (useSocket.registeredWatchers.includes(watchPath)) {
          return
        }

        watch(() => nsp
          ? iox[nsp][dest]
          : iox[dest], (n, o) => {
          socket.emit(evt, n)
        })
        useSocket.registeredWatchers.push(watchPath)
      }

      if (toRegex.test(entry)) {
        receiveEvt()
      } else if (fromRegex.test(entry)) {
        emitBack()
      } else {
        receiveEvt()
        emitBack()
      }
    })
  },
  /**
   * @param {import('@nuxt/types').Context } ctx
   * @param {import('socket.io-client').Socket} socket
   * @param {string} connectUrl
   * @param {string} statusProp
   */
  socketStatus (ctx, socket, connectUrl, statusProp) {
    const socketStatus = { connectUrl }
    const clientEvts = [
      'connect_error',
      'connect_timeout',
      'reconnect',
      'reconnect_attempt',
      'reconnect_error',
      'reconnect_failed',
      'ping',
      'pong'
    ]
    clientEvts.forEach((evt) => {
      const prop = camelCase(evt)
      socketStatus[prop] = ''
      // @ts-ignore
      socket.io.on(evt,
        /** @param {*} resp */
        (resp) => {
          Object.assign(ctx[statusProp], { [prop]: resp })
        })
    })
    Object.assign(ctx, { [statusProp]: socketStatus })
  },
  teardown ({ ctx, socket, useSocket }) {
    // Setup listener for "closeSockets" in case
    // multiple instances of nuxtSocket exist in the same
    // component (only one destroy/unmount event takes place).
    // When we teardown, we want to remove the listeners of all
    // the socket.io-client instances
    ctx.$once('closeSockets', function () {
      debug('closing socket id=' + socket.id)
      socket.removeAllListeners()
      socket.close()
    })

    if (!ctx.registeredTeardown) {
      // ctx.$destroy is defined in vue2
      // but will go away in vue3 (in favor of onUnmounted)
      // save user's destroy method and honor it after
      // we run nuxt-socket-io's teardown
      ctx.onComponentDestroy = ctx.$destroy || ctx.onUnmounted
      debug('teardown enabled for socket', { name: useSocket.name })
      // Our $destroy method
      // Gets called automatically on the destroy lifecycle
      // in v2. In v3, we have call it with the
      // onUnmounted hook
      ctx.$destroy = function () {
        debug('component destroyed, closing socket(s)', {
          name: useSocket.name,
          url: useSocket.url
        })
        useSocket.registeredVuexListeners = []
        ctx.$emit('closeSockets')
        // Only run the user's destroy method
        // if it exists
        if (ctx.onComponentDestroy) {
          ctx.onComponentDestroy()
        }
      }

      // onUnmounted will only exist in v3
      if (ctx.onUnmounted) {
        ctx.onUnmounted = ctx.$destroy
      }
      ctx.registeredTeardown = true
    }

    socket.on('disconnect', () => {
      debug('server disconnected', { name: useSocket.name, url: useSocket.url })
      socket.close()
    })
  },
  /**
   * @param {import('vue/types/vue').Vue } ctx
   */
  stubs (ctx) {
    // Use a tiny event bus now. Can probably
    // be replaced by watch eventually. For now this works.
    if (!('$on' in ctx)) { //  || !ctx.$emit || !ctx.$once) {
      ctx.$once = (...args) => emitter.once(...args)
      ctx.$on = (...args) => emitter.on(...args)
      ctx.$off = (...args) => emitter.off(...args)
      ctx.$$emit = (...args) => emitter.emit(...args) // TBD: replace ctx.$emit with ctx.$$emit calls (Vue already defines ctx.$emit). ctx.$$emit for internal use
    }

    if (!('$set' in ctx)) {
      ctx.$set = (obj, key, val) => {
        if (isRefImpl(obj[key])) {
          obj[key].value = val
        } else {
          obj[key] = val
        }
      }
    }

    if (!('$watch' in ctx)) { // TBD: seems to be defined in Nuxt3 ?
      ctx.$watch = (label, cb) => {
        // will enable when '@nuxtjs/composition-api' reaches stable version:
        // vueWatch(ctx.$data[label], cb)
      }
    }
  },
  /**
   * Promisified emit
   */
  emitP (socket) {
    socket.emitP = (evt, msg) => new Promise(resolve =>
      socket.emit(evt, msg, resolve)
    )
  },
  /**
   * Promisified once.
   * Where's the promisified on? Answer: doesn't
   * really fit in to the websocket design.
   */
  onceP (socket) {
    socket.onceP = evt => new Promise(resolve =>
      socket.once(evt, resolve)
    )
  }
}

/**
 * @param {import('./types.d').NuxtSocketOpts} ioOpts
 */
function nuxtSocket (ioOpts) {
  const {
    name,
    channel = '',
    statusProp = 'socketStatus',
    persist,
    teardown = !persist,
    emitTimeout,
    emitErrorsProp = 'emitErrors',
    ioApiProp = 'ioApi',
    ioDataProp = 'ioData',
    apiIgnoreEvts = [],
    serverAPI,
    clientAPI,
    vuex,
    namespaceCfg,
    ...connectOpts
  } = ioOpts
  const { $config } = this

  const { nuxtSocketIO: pluginOptions } = $config.public
  const state = useNuxtSocket().value

  const runtimeOptions = { ...pluginOptions }
  // If runtime config is also defined,
  // gracefully merge those options in here.
  // If naming conflicts extist between sockets, give
  // module options the priority
  if ($config.io) {
    Object.assign(runtimeOptions, $config.io)
    runtimeOptions.sockets = validateSockets(pluginOptions.sockets)
      ? pluginOptions.sockets
      : []
    if (validateSockets($config.io.sockets)) {
      $config.io.sockets.forEach((socket) => {
        const fnd = runtimeOptions.sockets.find(({ name }) => name === socket.name)
        if (fnd === undefined) {
          runtimeOptions.sockets.push(socket)
        }
      })
    }
  }

  const mergedOpts = { ...runtimeOptions, ...ioOpts }
  const { sockets, warnings = true, info = true } = mergedOpts

  warn =
    warnings && process.env.NODE_ENV !== 'production' ? console.warn : () => {}
  infoMsgs =
    info && process.env.NODE_ENV !== 'production' ? console.info : () => {}

  if (!validateSockets(sockets)) {
    throw new Error(
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  }

  register.stubs(this)

  let useSocket = null

  if (!name) {
    useSocket = sockets.find(s => s.default === true)
  } else {
    useSocket = sockets.find(s => s.name === name)
  }

  if (!useSocket) {
    useSocket = sockets[0]
  }

  if (!useSocket.name) {
    useSocket.name = 'dflt'
  }

  if (!useSocket.url) {
    warn(
      `URL not defined for socket "${useSocket.name}". Defaulting to "window.location"`
    )
  }

  if (!useSocket.registeredWatchers) {
    useSocket.registeredWatchers = []
  }

  if (!useSocket.registeredVuexListeners) {
    useSocket.registeredVuexListeners = []
  }

  let { url: connectUrl } = useSocket
  if (connectUrl) {
    connectUrl += channel
  }

  const { namespaces = {} } = useSocket

  let socket
  const label =
    persist && typeof persist === 'string'
      ? persist
      : `${useSocket.name}${channel}`

  function connectSocket () {
    if (connectUrl) {
      socket = io(connectUrl, connectOpts)
      infoMsgs('[nuxt-socket-io]: connect', useSocket.name, connectUrl, connectOpts)
    } else {
      socket = io(channel, connectOpts)
      infoMsgs(
        '[nuxt-socket-io]: connect',
        useSocket.name,
        window.location,
        channel,
        connectOpts
      )
    }
  }

  if (persist) {
    if (_sockets[label]) {
      debug(`resuing persisted socket ${label}`)
      socket = _sockets[label]
      if (socket.disconnected) {
        debug('persisted socket disconnected, reconnecting...')
        connectSocket()
      }
    } else {
      debug(`socket ${label} does not exist, creating and connecting to it..`)
      connectSocket()
      _sockets[label] = socket
    }
  } else {
    connectSocket()
  }

  register.emitP(socket)
  register.onceP(socket)

  if (emitTimeout) {
    mutations.SET_EMIT_TIMEOUT(state, { label, emitTimeout })
  }

  const mergedNspCfg = Object.assign({ ...namespaces[channel] }, namespaceCfg)
  if (mergedNspCfg.emitters || mergedNspCfg.listeners || mergedNspCfg.emitBacks) {
    register.namespace({
      ctx: this,
      namespaceCfg: mergedNspCfg,
      socket,
      emitTimeout,
      emitErrorsProp
    })
    debug('namespaces configured for socket', {
      name: useSocket.name,
      channel,
      namespaceCfg
    })
  }

  if (serverAPI) {
    register.serverAPI({
      label,
      apiIgnoreEvts,
      ioApiProp,
      ioDataProp,
      ctx: this,
      socket,
      serverAPI,
      clientAPI
    })
  }

  if (clientAPI) {
    register.clientAPI({
      ctx: this,
      socket,
      clientAPI
    })
  }

  const stateOpts = [...(useSocket.iox || []), ...(ioOpts.iox || [])]
  if (stateOpts) {
    register.iox({ stateOpts, socket, useSocket })
  }

  if ('socketStatus' in this &&
    typeof this.socketStatus === 'object'
  ) {
    register.socketStatus(this, socket, connectUrl || window.location.origin, statusProp)
    debug('socketStatus registered for socket', {
      name: useSocket.name,
      url: connectUrl
    })
  }

  if (teardown) {
    register.teardown({
      ctx: this,
      socket,
      useSocket
    })
  }

  return socket
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('nuxtSocket', nuxtSocket)
  nuxtApp.provide('ioState', ioState)
})
