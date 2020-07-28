import path from 'path'
import { serial as test, before } from 'ava'
import consola from 'consola'
import config from '@/nuxt.config'
import { state as indexState } from '@/store/index'
import { state as examplesState } from '@/store/examples'
import { delay, compileAndImportPlugin } from '@/test/utils'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { register } from '@/io/module'

const { io } = config
const src = path.resolve('./io/plugin.js')
const tmpFile = path.resolve('./io/plugin.compiled.js')

before(() => {
  const ports = [3000]
  const p = ports.map((port) => register.server({ port }))
  return Promise.all(p)
})

function socketConnected(socket) {
  return new Promise((resolve) => {
    socket.on('connect', resolve)
  })
}

const ChatMsg = {
  date: new Date(),
  from: '',
  to: '',
  text: ''
}

const clientAPI = {
  label: 'ioApi_page',
  version: 1.31,
  evts: {
    undefApiData: {},
    undefEvt: {},
    warnings: {
      data: {
        lostSignal: false,
        battery: 0
      }
    }
  },
  methods: {
    undefMethod: {},
    receiveMsg: {
      msg: ChatMsg,
      resp: {
        status: ''
      }
    }
  }
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

function Callees({ t, callItems = [], context }) {
  const called = {}
  const svc = Object.freeze({
    called() {
      callItems.forEach((item) => {
        t.true(called[item])
      })
    },
    register() {
      callItems.forEach((item) => {
        called[item] = false
        context[item] = () => (called[item] = true)
      })
    }
  })
  svc.register()
  return svc
}

function $set(obj, prop, val) {
  if (obj[prop] === undefined) {
    obj[prop] = {}
  }
  if (typeof val === 'object') {
    if (val.constructor.name === 'Array') {
      obj[prop] = val
    } else {
      Object.assign(obj[prop], val)
    }
  } else {
    Object.assign(obj, { [prop]: val })
  }
}

function loadPlugin({
  t,
  state,
  mutations = {},
  actions = {},
  context = {},
  ioOpts = {},
  plugin = Plugin,
  callCnt = {
    storeWatch: 0,
    storeCommit: 0,
    storeDispatch: 0,
    registerModule: 0
  }
}) {
  if (!context.$on) {
    context.$on = function(evt, cb) {}
  }

  if (!state) {
    state = indexState()
    state.examples = examplesState()
    state.examples.__ob__ = ''
  }

  return new Promise((resolve, reject) => {
    context.$set = $set
    context.$store = {
      registerModule(moduleName, storeCfg, options) {
        const { namespaced, state, mutations, actions } = storeCfg
        callCnt.registerModule++
        t.true(namespaced)
        t.is(moduleName, '$nuxtSocket')
        context.$store.state.$nuxtSocket = Object.assign({}, state)
        context.$store.mutations.$nuxtSocket = Object.assign({}, mutations)
        context.$store.actions.$nuxtSocket = Object.assign({}, actions)
      },
      state,
      mutations,
      actions,
      commit(label, msg) {
        callCnt.storeCommit++
        if (callCnt['storeCommit_' + label] !== undefined) {
          callCnt['storeCommit_' + label]++
        }

        if (label.includes('$nuxtSocket') || label === 'SET_EMIT_ERRORS') {
          const state = context.$store.state.$nuxtSocket
          const mutations = context.$store.mutations.$nuxtSocket
          const props = label.split('/')
          const fn = props.length > 1 ? props[1] : props[0]
          if (mutations[fn]) {
            mutations[fn](state, msg)
          }
        }
      },
      async dispatch(label, msg) {
        callCnt.storeDispatch++
        if (callCnt['storeDispatch_' + label] !== undefined) {
          callCnt['storeDispatch_' + label]++
        }
        if (label.includes('$nuxtSocket')) {
          const { commit } = context.$store
          const state = context.$store.state.$nuxtSocket
          const actions = context.$store.actions.$nuxtSocket
          const fn = label.split('/')[1]
          if (actions[fn]) {
            const resp = await actions[fn]({ state, commit }, msg)
            return resp
          }
        }
      },
      watch: (stateCb, dataCb) => {
        callCnt.storeWatch++
        stateCb(state)
        dataCb({ sample: 123 })
      }
    }
    plugin(context, (label, NuxtSocket) => {
      context[label] = NuxtSocket

      try {
        const socket = context[label](ioOpts)
        t.is(label, 'nuxtSocket')
        t.is(typeof NuxtSocket, 'function')
        t.is(NuxtSocket.name, 'nuxtSocket')
        t.is(socket.constructor.name, 'Socket')
        resolve(socket)
      } catch (e) {
        reject(e)
      }
    })
  })
}

async function testNamespace({
  t,
  context,
  namespace,
  namespaceCfg,
  url = 'http://localhost:3000',
  channel = '/index',
  emitTimeout,
  warnings = true,
  teardown = true
}) {
  const testCfg = {
    warnings,
    sockets: [
      {
        default: true,
        url
      }
    ]
  }

  if (namespace) {
    testCfg.sockets[0].namespaces = { [channel]: namespace }
  } else {
    testCfg.sockets[0].namespaces = {}
  }

  pOptions.set(testCfg)
  const socket = await loadPlugin({
    t,
    context,
    ioOpts: {
      channel,
      emitTimeout,
      namespaceCfg
    }
  })

  if (!(namespace || namespaceCfg)) return

  const { emitters = [], listeners = [] } = namespace || namespaceCfg
  if (listeners.constructor.name === 'Array') {
    listeners.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      if (pre) consola.log(`testing pre ${pre} too`)
      if (post) consola.log(`testing post ${post} too`)
      socket.on(evt, (msgRxd) => {
        setImmediate(() => {
          if (context[mapTo]) t.is(context[mapTo], msgRxd)
        })
      })
    })
  }

  return new Promise((resolve, reject) => {
    if (emitters.length === 0 || listeners.constructor.name !== 'Array') {
      resolve(socket)
    }
    let doneCnt = 0
    emitters.forEach((entry) => {
      const { mapTo, emitEvt } = parseEntry(entry, 'emitter')
      context[emitEvt]()
        .then((resp) => {
          if (context[mapTo] !== undefined) {
            if (typeof resp === 'object' && emitEvt !== mapTo) {
              Object.entries(resp).forEach(([key, val]) => {
                t.is(val, context[mapTo][key])
              })
            } else if (mapTo && emitEvt !== mapTo) {
              setImmediate(() => {
                t.is(resp, context[mapTo])
              })
            } else {
              t.not(resp, context[mapTo])
            }
          }
          if (++doneCnt === emitters.length) {
            if (teardown) {
              socket.close()
            }
            resolve(socket)
          }
        })
        .catch(reject)
    })
  })
}

async function testVuexOpts({
  t,
  context,
  callCnt,
  ioOpts = {},
  vuexOpts,
  url = 'http://localhost:3000/index'
}) {
  const testCfg = {
    sockets: [
      {
        default: true,
        url,
        vuex: vuexOpts
      }
    ]
  }
  pOptions.set(testCfg)
  const socket = await loadPlugin({ t, context, callCnt, ioOpts })
  const group = ioOpts.vuex || vuexOpts
  Object.entries(group).forEach(([opt, groupOpts]) => {
    if (groupOpts.constructor.name === 'Array') {
      groupOpts.forEach((entry) => {
        const { evt } = parseEntry(entry)
        socket.emit('echoBack', { evt, data: 'abc123' })
      })
    }
  })
  return socket
}

async function waitForAPI({ t, ioOpts }) {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const context = {
    ioApi: {},
    ioData: {}
  }
  const socket = await loadPlugin({
    t,
    context,
    ioOpts
  })
  await delay(500)
  t.true(context.ioApi.ready)
  return { context, socket }
}

test('$nuxtSocket vuex module registration', async (t) => {
  const testCfg = {
    sockets: [
      {
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const context = {}
  const state = {}
  const callCnt = { registerModule: 0 }
  await loadPlugin({ t, context, state, callCnt })
  await loadPlugin({ t, context, state, callCnt })
  t.is(callCnt.registerModule, 1)
})

test('$nuxtSocket vuex module (emit action; error conditions)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const context = {}
  const state = {}
  const mutations = {}
  const actions = {}
  const ioOpts = {
    channel: '/dynamic',
    persist: true
  }
  const socket = await loadPlugin({
    t,
    context,
    ioOpts,
    state,
    mutations,
    actions
  })
  await context.$store
    .dispatch('$nuxtSocket/emit', {
      evt: 'getAPI'
    })
    .catch((err) => {
      t.is(
        err.message,
        'socket instance required. Please provide a valid socket label or socket instance'
      )
    })

  await context.$store
    .dispatch('$nuxtSocket/emit', {
      evt: 'getAPIxyz',
      label: 'home/dynamic',
      emitTimeout: 500
    })
    .catch((err) => {
      t.is(err.message, 'emitTimeout')
    })

  await context.$store
    .dispatch('$nuxtSocket/emit', {
      evt: 'getAPIxyz',
      socket,
      emitTimeout: 500
    })
    .catch((err) => {
      const json = JSON.parse(err.message)
      t.is(json.message, 'emitTimeout')
    })

  state.$nuxtSocket.emitErrors['home/dynamic'].badRequest = []
  await context.$store
    .dispatch('$nuxtSocket/emit', {
      evt: 'badRequest',
      socket
    })
    .catch((err) => {
      const json = JSON.parse(err.message)
      t.is(json.message, 'badRequest...Input does not match schema')
    })

  await context.$store.dispatch('$nuxtSocket/emit', {
    evt: 'badRequest',
    label: 'home/dynamic'
  })

  t.truthy(state.$nuxtSocket.emitErrors['home/dynamic'])
  t.true(state.$nuxtSocket.emitErrors['home/dynamic'].badRequest.length > 0)
  t.is(
    state.$nuxtSocket.emitErrors['home/dynamic'].badRequest[0].message,
    'badRequest...Input does not match schema'
  )
})

test('Socket persistence (enabled)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const context = {}
  const state = {}
  const ioOpts = { persist: true, teardown: false, channel: '/dynamic' }
  const socket1 = await loadPlugin({ t, context, ioOpts, state })
  const socket2 = await loadPlugin({ t, context, ioOpts, state })
  t.is(socket1.id, socket2.id)
  socket1.close()
  socket2.close()
})

test('Socket persistence (enabled; use provided label)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const context = {}
  const state = {}
  const ioOpts = { persist: 'mySocket', teardown: false, channel: '/dynamic' }
  const socket1 = await loadPlugin({ t, context, ioOpts, state })
  await socketConnected(socket1)
  const socket2 = await loadPlugin({ t, context, ioOpts, state })
  t.is(socket1.id, socket2.id)
  socket1.close()
  socket2.close()
})

test('Socket persistence (enabled; reconnect only if disconnected)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const context = {}
  const state = {}
  const ioOpts = { persist: true, teardown: false, channel: '/dynamic' }
  const socket1 = await loadPlugin({ t, context, ioOpts, state })
  const socket2 = await loadPlugin({ t, context, ioOpts, state })
  await socketConnected(socket1)
  await socketConnected(socket2)
  t.true(socket1.id !== socket2.id)
  socket1.close()
  socket2.close()
})

test('Socket persistence (disabled)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const context = {}
  const state = {}
  const ioOpts = { persist: false, channel: '/dynamic' }
  await loadPlugin({ t, context, ioOpts })
  const socket1 = await loadPlugin({ t, context, ioOpts, state })
  const socket2 = await loadPlugin({ t, context, ioOpts, state })
  await socketConnected(socket1)
  await socketConnected(socket2)
  t.true(socket1.id !== socket2.id)
  socket1.close()
  socket2.close()
})

test('API registration (server)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const callCnt = {
    'storeCommit_$nuxtSocket/SET_API': 0
  }
  const state = {}
  const actions = {}
  const context = {
    ioApi: {},
    ioData: {}
  }
  const ioOpts = {
    channel: '/dynamic',
    serverAPI: {},
    apiIgnoreEvts: ['ignoreMe']
  }

  const socket1 = await loadPlugin({
    t,
    context,
    ioOpts,
    callCnt,
    state,
    actions
  })
  consola.log('creating a duplicate listener to see if plugin handles it')
  socket1.on('itemRxd', () => {})
  await delay(500)
  t.true(context.ioApi.ready)
  consola.log('Attempt to re-use api...')
  await loadPlugin({ t, context, ioOpts, callCnt, state, actions })
  await delay(500)
  t.true(context.ioApi.ready)
  t.is(callCnt['storeCommit_$nuxtSocket/SET_API'], 1)
  const items = await context.ioApi.getItems()
  const item1 = await context.ioApi.getItem({ id: 'abc123' })
  Object.assign(context.ioData.getItem.msg, { id: 'something' })
  const item2 = await context.ioApi.getItem()
  const noResp = await context.ioApi.noResp()
  t.true(items.length > 0)
  t.is(item1.id, 'abc123')
  t.is(item2.id, 'something')
  Object.keys(context.ioApi.evts).forEach((evt) => {
    if (!ioOpts.apiIgnoreEvts.includes(evt)) {
      t.true(socket1.hasListeners(evt))
    } else {
      t.false(socket1.hasListeners(evt))
    }
  })
  t.true(Object.keys(noResp).length === 0)
})

test('API registration (server; join and leave room)', async (t) => {
  const ioOpts = { channel: '/room', serverAPI: true }
  const { context: ctx1, socket: s1 } = await waitForAPI({ t, ioOpts })
  await ctx1.ioApi.join({ room: 'vueJS', user: 'userABC' })

  const { context: ctx2, socket: s2 } = await waitForAPI({ t, ioOpts })
  await ctx2.ioApi.join({ room: 'vueJS', user: 'userXYZ' })
  t.is(ctx1.ioData.userJoined, 'userXYZ')
  t.is(ctx1.ioData.users.length, 2)
  t.is(ctx2.ioData.users.length, 2)

  const r1 = await ctx1.ioApi.leave({ room: 'vueJS', user: 'userABC' })
  t.is(ctx2.ioData.userLeft, 'userABC')
  t.falsy(r1)

  s1.close()
  s2.close()
})

test('API registration (server, ioApi not defined)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }
  pOptions.set(testCfg)
  const context = {}
  const ioOpts = {
    channel: '/dynamic',
    serverAPI: {}
  }

  await loadPlugin({ t, context, ioOpts })
  await delay(500)
  t.falsy(context.ioApi)
})

test('API registration (server, methods and evts not defined)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const callCnt = {
    'storeCommit_$nuxtSocket/SET_API': 0
  }
  const state = {}
  const actions = {}
  const context = {
    ioApi: {},
    ioData: {}
  }
  const ioOpts = {
    channel: '/p2p',
    serverAPI: {}
  }

  await loadPlugin({ t, context, ioOpts, callCnt, state, actions })
  await delay(500)
  t.is(callCnt['storeCommit_$nuxtSocket/SET_API'], 1)
  t.falsy(context.ioApi.evts)
  t.falsy(context.ioApi.methods)
  t.true(context.ioApi.ready)
})

test('API registration (server, methods and evts not defined, but is peer)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const callCnt = {
    'storeCommit_$nuxtSocket/SET_API': 0
  }
  const state = {}
  const actions = {}
  const context = {
    ioApi: {},
    ioData: {}
  }
  const ioOpts = {
    channel: '/p2p',
    serverAPI: {},
    clientAPI
  }

  await loadPlugin({ t, context, ioOpts, callCnt, state, actions })
  await delay(500)
  t.is(callCnt['storeCommit_$nuxtSocket/SET_API'], 1)
  const props = ['evts', 'methods']
  props.forEach((prop) => {
    const clientProps = Object.keys(clientAPI[prop])
    const serverProps = Object.keys(context.ioApi[prop])
    clientProps.forEach((cProp) => {
      t.true(serverProps.includes(cProp))
    })
  })
  t.true(context.ioApi.ready)
})

test('API registration (client, methods and evts not defined)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const callCnt = {
    'storeCommit_$nuxtSocket/SET_CLIENT_API': 0
  }
  const state = {}
  const actions = {}
  const context = {}
  const ioOpts = {
    channel: '/p2p',
    clientAPI: {}
  }

  await loadPlugin({ t, context, ioOpts, callCnt, state, actions })
  t.is(callCnt['storeCommit_$nuxtSocket/SET_CLIENT_API'], 1)
  t.falsy(context.receiveMsg)
})

test('API registration (client, methods and evts defined)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        url: 'http://localhost:3000'
      }
    ]
  }

  pOptions.set(testCfg)
  const callCnt = {
    'storeCommit_$nuxtSocket/SET_CLIENT_API': 0,
    receiveMsg: 0
  }
  const state = {}
  const mutations = {}
  const actions = {}
  const context = {
    undefApiData: {},
    warnings: {},
    receiveMsg(msg) {
      callCnt.receiveMsg++
      return Promise.resolve({
        status: 'ok'
      })
    }
  }
  const ioOpts = {
    channel: '/p2p',
    persist: true,
    serverAPI: {},
    clientAPI
  }

  const socket = await loadPlugin({
    t,
    context,
    ioOpts,
    callCnt,
    state,
    mutations,
    actions
  })
  t.is(callCnt['storeCommit_$nuxtSocket/SET_CLIENT_API'], 1)
  await context.$store.dispatch('$nuxtSocket/emit', {
    evt: 'sendEvts',
    msg: {},
    socket
  })
  t.is(callCnt.receiveMsg, 2)
  Object.keys(clientAPI.evts.warnings.data).forEach((prop) => {
    t.true(context.warnings[prop] !== undefined)
  })
  context.warnings.battery = 11

  const resp = await context.warningsEmit()
  const resp2 = await context.warningsEmit({ ack: true })
  const resp3 = await context.warningsEmit({ ack: true, battery: 22 })
  t.falsy(resp)
  t.truthy(resp2)
  t.is(resp2.battery, context.warnings.battery)
  t.is(resp3.battery, 22)

  consola.log(
    'load plugin again, verify that events have already been registered'
  )
  await loadPlugin({ t, context, ioOpts, callCnt, state, mutations, actions })
})

test('Socket plugin (empty options)', async (t) => {
  const testCfg = { sockets: [] }
  pOptions.set(testCfg)
  await loadPlugin({ t }).catch((e) => {
    t.is(
      e.message,
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  })
})

test('Socket plugin (malformed sockets)', async (t) => {
  const testCfg = { sockets: {} }
  pOptions.set(testCfg)
  await loadPlugin({ t }).catch((e) => {
    t.is(
      e.message,
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  })
})

test('Socket plugin (options missing info)', async (t) => {
  const jsdom = require('jsdom-global')
  const testCfg = { sockets: [{}] }
  const ioOpts = {
    channel: '/dynamic'
  }
  const windowUrl = 'http://localhost:3000'
  pOptions.set(testCfg)

  jsdom('', { url: windowUrl })
  const socket = await loadPlugin({ t, ioOpts })
  await socketConnected(socket)
  t.is(socket.io.uri, windowUrl + ioOpts.channel)
})

test('Socket plugin (no vuex options)', async (t) => {
  const testCfg = {
    sockets: [
      {
        name: 'home',
        default: true,
        url: 'http://localhost:3000'
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t, ioOpts: { name: 'home' } })
})

test('Socket plugin (socket status OK)', async (t) => {
  const cbs = []
  const context = {
    socketStatus: {},
    $on(evt, cb) {
      cbs.push(cb)
    },
    $emit(evt) {
      cbs.forEach((cb) => cb())
    }
  }
  const url = 'http://localhost:3000'
  const testCfg = {
    sockets: [
      {
        default: true,
        url
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t, ioOpts: {}, context })
  await delay(150)
  Object.entries(context.socketStatus).forEach(([key, val]) => {
    if (key === 'connectUrl') {
      t.is(val, url)
    } else {
      t.is(val, '')
    }
  })
  context.$emit('closeSockets')
})

test('Socket plugin (socket status NOT ok)', async (t) => {
  const cbs = []
  const context = {
    socketStatus: {},
    $on(evt, cb) {
      cbs.push(cb)
    },
    $emit(evt) {
      cbs.forEach((cb) => cb())
    }
  }
  const url = 'http://localhost:3001'
  const testCfg = {
    sockets: [
      {
        default: true,
        url
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t, ioOpts: {}, context })
  await delay(150)
  Object.entries(context.socketStatus).forEach(([key, val]) => {
    if (key === 'connectUrl') {
      t.is(val, url)
    } else if (key === 'connectError') {
      t.is(val.message, 'xhr poll error')
    } else {
      t.is(val, '')
    }
  })
  context.$emit('closeSockets')
})

test('Socket plugin (vuex options empty)', async (t) => {
  const vuexOpts = {}
  await testVuexOpts({ t, vuexOpts })
})

test('Socket plugin (malformed vuex options)', async (t) => {
  const vuexOpts = {
    actions: {},
    mutations: {},
    emitBacks: {}
  }
  await testVuexOpts({ t, vuexOpts })
})

test('Socket plugin (vuex options missing mutations)', async (t) => {
  const vuexOpts = {
    actions: []
  }
  await testVuexOpts({ t, vuexOpts })
})

test('Socket plugin (vuex options missing actions)', async (t) => {
  const vuexOpts = {
    mutations: []
  }
  await testVuexOpts({ t, vuexOpts })
})

test('Socket plugin (vuex opts ok)', async (t) => {
  const callItems = ['pre1', 'post1', 'preEmit', 'postAck']
  const callCnt = {
    storeWatch: 0,
    storeCommit: 0,
    storeDispatch: 0,
    postEmitHook: 0
  }
  const context = {
    postEmitHook(args) {
      callCnt.postEmitHook++
    },
    preEmitVal(args) {
      return true
    },
    preEmitValFail() {
      return false
    }
  }
  const callees = Callees({ t, context, callItems })
  const vuexOpts = {
    actions: [
      'nonExist1] someAction [nonExist2',
      'pre1] someAction2 --> format [post1',
      { chatMessage: 'FORMAT_MESSAGE' }
    ],
    mutations: ['someMutation'],
    emitBacks: [
      'noPre] examples/sample [noPost',
      { 'examples/sample2': 'sample2' },
      'preEmit] sample2b <-- examples/sample2b [postAck',
      'titleFromUser', // defined in store/index.js (for issue #35)
      'preEmitVal] echoHello <-- examples/hello [postEmitHook',
      'preEmitValFail] echoHello <-- examples/helloFail [postEmitHook'
    ]
  }
  const testUrl = 'http://localhost:3000/examples'
  await testVuexOpts({ t, context, vuexOpts, callCnt, url: testUrl })
  await delay(1000)
  callees.called()
  t.is(callCnt.storeCommit, vuexOpts.mutations.length)
  t.is(callCnt.storeDispatch, vuexOpts.actions.length)
  t.is(callCnt.postEmitHook, 1)
  t.pass()
})

test('IO Opts (warnings disabled)', async (t) => {
  pOptions.set({ warnings: false, sockets: [{}] })
  await loadPlugin({
    t,
    context: {},
    ioOpts: {}
  }).catch(() => {})

  pOptions.set({ sockets: [{}] })
  await loadPlugin({
    t,
    context: {},
    ioOpts: { warnings: false }
  }).catch(() => {})
  consola.log('Check coverage report')
  t.pass()
})

test('IO Opts (warnings enabled by default)', async (t) => {
  pOptions.set({ sockets: [{}] })
  await loadPlugin({
    t,
    context: {},
    ioOpts: {}
  }).catch(() => {})

  pOptions.set({ sockets: [{}] })
  consola.log('Check coverage report')
  t.pass()
})

test('Vuex opts (defined in instance)', async (t) => {
  const callCnt = {
    storeWatch: 0,
    storeCommit: 0,
    storeCommit_something: 0,
    storeDispatch: 0,
    storeDispatch_someAction: 0
  }
  const context = {}
  const vuexOpts = {
    actions: [
      'nonExist1] someAction [nonExist2',
      'pre1] someAction2 --> format [post1',
      { chatMessage: 'FORMAT_MESSAGE' }
    ],
    mutations: ['someMutation', 'anotherMutation'],
    emitBacks: [
      'noPre] examples/sample [noPost',
      { 'examples/sample2': 'sample2' },
      'preEmit] sample2b <-- examples/sample2b [postAck',
      'titleFromUser', // defined in store/index.js (for issue #35)
      'preEmitVal] echoHello <-- examples/hello [postEmitHook',
      'preEmitValFail] echoHello <-- examples/helloFail [postEmitHook'
    ]
  }
  const ioOpts = {
    vuex: {
      actions: ['someAction'],
      mutations: ['something'],
      emitBacks: [{ 'examples/sample2': 'sample2' }]
    }
  }
  const testUrl = 'http://localhost:3000/examples'
  await testVuexOpts({ t, context, vuexOpts, callCnt, url: testUrl, ioOpts })
  await delay(1000)
  t.not(callCnt.storeCommit, vuexOpts.mutations.length)
  t.not(callCnt.storeDispatch, vuexOpts.actions.length)
  t.is(callCnt.storeCommit_something, ioOpts.vuex.mutations.length)
  t.is(callCnt.storeDispatch_someAction, ioOpts.vuex.actions.length)
})

test('Emitback is not defined in vuex store', (t) => {
  const errEmitBack = 'something/undefined'
  const errEmitBacks = [
    'something/undefined',
    { 'something/undefined': 'someData' }
  ]
  let doneCnt = 0
  return new Promise((resolve) => {
    errEmitBacks.forEach(async (emitBack) => {
      const vuexOpts = {
        emitBacks: [emitBack]
      }
      await testVuexOpts({ t, vuexOpts }).catch((e) => {
        t.is(
          e.message,
          [
            `[nuxt-socket-io]: Trying to register emitback ${errEmitBack} failed`,
            `because it is not defined in Vuex.`,
            'Is state set up correctly in your stores folder?'
          ].join('\n')
        )
        if (++doneCnt === errEmitBacks.length) resolve()
      })
    })
  })
})

test('Duplicate Watchers are not registered', async (t) => {
  const vuexOpts = {
    emitBacks: [
      'examples/someObj',
      'examples/sample',
      { 'examples/sample2': 'sample2' }
    ]
  }
  const context = {}
  const callCnt = { storeWatch: 0 }
  // Load and instantiate the first socket:
  await testVuexOpts({ t, vuexOpts, callCnt, context })

  // Instantiate the second socket:
  context.nuxtSocket({ default: true })
  t.is(callCnt.storeWatch, vuexOpts.emitBacks.length)
})

test('Duplicate Vuex Listeners are not registered', async (t) => {
  const vuexOpts = {
    mutations: ['progress']
  }
  const context = {}
  const callCnt = { storeCommit: 0 }
  const testUrl = 'http://localhost:3000/examples'

  // Load and instantiate the first socket:
  const socket = await testVuexOpts({
    t,
    vuexOpts,
    callCnt,
    context,
    url: testUrl
  })
  // Instantiate the second socket:
  context.nuxtSocket({ default: true })

  return new Promise((resolve) => {
    setTimeout(() => {
      t.is(callCnt.storeCommit, vuexOpts.mutations.length)
      socket.close()
      resolve()
    }, 1000)
  })
})

test('Namespace config (undefined)', async (t) => {
  const context = {
    message2Rxd: '',
    testMsg: { msg: 'abc123xyz' }
  }
  await testNamespace({ t, context })
  t.falsy(context.getMessage2)
})

test('Namespace config (defined but empty)', async (t) => {
  const context = {
    message2Rxd: '',
    testMsg: { msg: 'abc123xyz' }
  }
  await testNamespace({ t, context, namespace: {} })
  t.falsy(context.getMessage2)
})

test('Namespace config (wrong types)', async (t) => {
  const namespace = {
    emitters: {},
    listeners: {},
    emitBacks: {}
  }
  await testNamespace({ t, namespace })
})

test('Namespace config (listeners)', async (t) => {
  const context = {
    chatMessage2: '',
    chatMessage4: '',
    message5Rxd: ''
  }
  const callees = Callees({ t, callItems: ['preEmit', 'handleAck'], context })
  const namespace = {
    emitters: ['getMessage2 + testMsg --> message2Rxd'],
    listeners: [
      'preEmit] chatMessage2 [handleAck',
      'undef1] chatMessage3 --> message3Rxd [undef2',
      'chatMessage4',
      { chatMessage5: 'message5Rxd' }
    ]
  }
  await testNamespace({ t, context, namespace })
  callees.called()
})

test('Namespace config (emitters)', async (t) => {
  const callItems = ['reset', 'handleDone', 'preProgress', 'postProgress']
  const context = {
    progress: 0,
    refreshInfo: {
      period: 50
    },
    someString: 'Hello world',
    someString2: 'Hello world2',
    myArray: [],
    someArray: [3, 1, 2],
    myObj: {},
    echoResp: {},
    preEmitVal(arg) {
      return arg
    },
    hello: false
  }
  const callees = Callees({ t, callItems, context })
  const namespace = {
    emitters: [
      'reset] getProgress + refreshInfo --> progress [handleDone',
      'sample3',
      'receiveString + someString --> myArray',
      'receiveArray + someArray --> myObj',
      'noMethod] receiveArray2 + undefProp --> undefProp2 [noMethod2',
      'receiveString2 + someString2',
      'echoBack --> echoResp',
      'receiveUndef',
      'preEmitVal] echoHello --> hello'
    ],
    listeners: ['preProgress] progress [postProgress']
  }
  const socket = await testNamespace({
    t,
    context,
    namespace,
    channel: '/examples',
    teardown: false
  })
  callees.called()
  context.hello = false
  await context.echoHello(false)
  t.false(context.hello)
  await context.echoHello({ data: 'hello' })
  t.is(context.hello.data, 'hello')
  const argsAsMsg = { data: 'some data!!' }
  await context.echoBack(argsAsMsg)
  t.is(argsAsMsg.data, context.echoResp.data)
  socket.close()
})

test('Namespace config (emitters; prevent overwriting emitter)', async (t) => {
  const context = {
    echoBack: {}
  }
  const namespace = {
    emitters: ['echoBack --> echoBack']
  }
  const socket = await testNamespace({
    t,
    context,
    namespace,
    channel: '/examples',
    teardown: false
  })
  const argsAsMsg = { data: 'some data!!' }
  await context.echoBack(argsAsMsg)
  t.is(typeof context.echoBack, 'function')
  socket.close()
})

test('Namespace config (emitters, emitTimeout)', async (t) => {
  const context = {
    item: {}
  }
  const namespace = {
    emitters: ['undefMethod']
  }
  await testNamespace({
    t,
    context,
    namespace,
    emitTimeout: 1000
  }).catch(({ message, emitEvt, emitTimeout, hint, timestamp }) => {
    t.is(message, 'emitTimeout')
    t.is(emitEvt, 'undefMethod')
    t.is(emitTimeout, 1000)
    t.is(
      hint,
      [
        `1) Is ${emitEvt} supported on the backend?`,
        `2) Is emitTimeout ${emitTimeout} ms too small?`
      ].join('\r\n')
    )
    t.truthy(timestamp)
  })
})

test('Namespace config (emitters, emitTimeout --> emitErrors)', async (t) => {
  const context = {
    item: {},
    emitErrors: {}
  }
  const namespace = {
    emitters: ['undefMethod']
  }
  const socket = await testNamespace({
    t,
    context,
    namespace,
    emitTimeout: 1000,
    teardown: false
  })
  context.emitErrors.undefMethod.forEach(
    ({ message, emitEvt, emitTimeout, hint, timestamp }) => {
      t.is(message, 'emitTimeout')
      t.is(emitEvt, 'undefMethod')
      t.is(emitTimeout, 1000)
      t.is(
        hint,
        [
          `1) Is ${emitEvt} supported on the backend?`,
          `2) Is emitTimeout ${emitTimeout} ms too small?`
        ].join('\r\n')
      )
      t.truthy(timestamp)
    }
  )
  await context.undefMethod()
  socket.close()
  t.is(context.emitErrors.undefMethod.length, 2)
})

test('Namespace config (emitters, emitErrors rejected)', async (t) => {
  const context = {
    item: {}
  }
  const namespace = {
    emitters: ['echoError']
  }
  await testNamespace({
    t,
    context,
    namespace,
    channel: '/examples'
  }).catch(({ message, emitEvt, timestamp }) => {
    t.is(emitEvt, 'echoError')
    t.is(message, 'ExampleError')
    t.truthy(timestamp)
  })
})

test('Namespace config (emitters, emitErrors prop absorbs other errors)', async (t) => {
  const context = {
    item: {},
    emitErrors: {}
  }
  const namespace = {
    emitters: ['echoError']
  }
  await testNamespace({
    t,
    context,
    namespace,
    channel: '/examples'
  })

  context.emitErrors.echoError.forEach(({ message, emitEvt, timestamp }) => {
    t.is(emitEvt, 'echoError')
    t.is(message, 'ExampleError')
    t.truthy(timestamp)
  })
})

test('Namespace config (emitbacks)', async (t) => {
  const namespace = {
    emitBacks: [
      'sample3 [handleDone',
      'noMethod] sample4 <-- myObj.sample4 [handleX',
      'myObj.sample5',
      'preEmit] sample5',
      'preEmitValid] hello [postEmitHook',
      'preEmitValid] echoHello <-- hello2 [postEmitHook'
    ]
  }
  const called = { preEmit: 0, postEmitHook: 0 }

  const context = {
    hello: false,
    hello2: false,
    sample3: 100,
    myObj: {
      sample4: 50
    },
    sample5: 421,
    preEmit: () => called.preEmit++,
    preEmitValid({ data }) {
      return data === 'yes'
    },
    postEmitHook() {
      called.postEmitHook++
    },
    handleDone({ msg }) {
      t.is(msg, 'rxd sample ' + newData.sample3)
    }
  }

  const newData = {
    sample3: context.sample3 + 1,
    'myObj.sample4': context.myObj.sample4 + 1,
    sample5: 111,
    hello: 'no',
    hello2: 'yes'
  }
  const emitEvts = Object.keys(newData)
  context.$watch = (label, cb) => {
    t.true(emitEvts.includes(label))
    cb(newData[label])
    if (label === 'sample5') {
      t.is(called.preEmit, 1)
    }
  }

  await testNamespace({ t, context, namespace, channel: '/examples' })
  await delay(1000)
  t.is(called.postEmitHook, 1)
})

test('Namespace config (locally defined)', async (t) => {
  const callItems = ['reset', 'handleDone', 'preProgress', 'postProgress']
  const context = {
    progress: 0,
    refreshInfo: {
      period: 50
    },
    someString: 'Hello world',
    someString2: 'Hello world2',
    myArray: [],
    someArray: [3, 1, 2],
    myObj: {},
    echoResp: {},
    preEmitVal(arg) {
      return arg
    },
    hello: false
  }
  const callees = Callees({ t, callItems, context })
  const namespace = {
    emitters: [
      'reset] getProgress + refreshInfo --> progress [handleDone',
      'sample3',
      'receiveString + someString --> myArray',
      'receiveArray + someArray --> myObj',
      'noMethod] receiveArray2 + undefProp --> undefProp2 [noMethod2',
      'receiveString2 + someString2',
      'echoBack --> echoResp',
      'receiveUndef',
      'preEmitVal] echoHello --> hello'
    ],
    listeners: ['preProgress] progress [postProgress']
  }
  const socket = await testNamespace({
    t,
    context,
    namespaceCfg: namespace,
    channel: '/examples',
    teardown: false
  })
  callees.called()
  context.hello = false
  await context.echoHello(false)
  t.false(context.hello)
  await context.echoHello({ data: 'hello' })
  t.is(context.hello.data, 'hello')
  const argsAsMsg = { data: 'some data!!' }
  await context.echoBack(argsAsMsg)
  t.is(argsAsMsg.data, context.echoResp.data)
  socket.close()
})

test('Teardown (enabled)', async (t) => {
  let componentDestroyCnt = 0
  const cbs = []
  const context = {
    $on(evt, cb) {
      t.is(evt, 'closeSockets')
      cbs.push(cb)
    },
    $emit(evt) {
      t.is(evt, 'closeSockets')
      cbs.forEach((cb) => cb())
    },
    $destroy() {
      componentDestroyCnt++
    }
  }
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000'
      }
    ]
  }
  pOptions.set(testCfg)
  const socket = await loadPlugin({ t, context })
  const socket2 = context.nuxtSocket({})
  const evt = 'test'
  socket.on(evt, () => {})
  socket2.on(evt, () => {})
  t.true(socket.hasListeners(evt))
  t.true(socket2.hasListeners(evt))
  context.$destroy()
  t.false(socket.hasListeners(evt))
  t.false(socket2.hasListeners(evt))
  t.is(componentDestroyCnt, 1)
})

test('Teardown (disabled)', async (t) => {
  let componentDestroyCnt = 0
  const context = {
    $destroy() {
      componentDestroyCnt++
    }
  }
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000'
      }
    ]
  }
  pOptions.set(testCfg)
  const socket = await loadPlugin({ t, context, ioOpts: { teardown: false } })
  const evt = 'test'
  socket.on(evt, () => {})
  t.true(socket.hasListeners(evt))
  context.$destroy()
  t.true(socket.hasListeners(evt))
  t.is(componentDestroyCnt, 1)
})

test('Socket plugin (runtime IO $config defined, sockets undef)', async (t) => {
  const cbs = []
  const context = {
    $config: {
      io: {}
    },
    socketStatus: {},
    $on(evt, cb) {
      cbs.push(cb)
    },
    $emit(evt) {
      cbs.forEach((cb) => cb())
    }
  }
  const url = 'http://localhost:3000'
  const testCfg = {
    sockets: [
      {
        default: true,
        url
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({
    t,
    ioOpts: {
      name: 'runtime'
    },
    context
  })
  await delay(150)
  Object.entries(context.socketStatus).forEach(([key, val]) => {
    if (key === 'connectUrl') {
      t.is(val, url)
    } else {
      t.is(val, '')
    }
  })
  context.$emit('closeSockets')
})

test('Socket plugin (runtime IO $config defined)', async (t) => {
  const cbs = []
  const context = {
    $config: {
      io: {
        sockets: [
          {
            name: 'runtime',
            url: 'http://someurl'
          },
          {
            name: 'runtime',
            url: 'http://someurl'
          }
        ]
      }
    },
    socketStatus: {},
    $on(evt, cb) {
      cbs.push(cb)
    },
    $emit(evt) {
      cbs.forEach((cb) => cb())
    }
  }
  const url = 'http://localhost:3000'
  const testCfg = {
    sockets: [
      {
        default: true,
        url
      }
    ]
  }
  pOptions.set(testCfg)
  const socket = await loadPlugin({
    t,
    ioOpts: {
      name: 'runtime'
    },
    context
  })
  await delay(150)
  t.is(context.socketStatus.connectUrl, 'http://someurl')
  socket.close()
  context.$emit('closeSockets')
})

test('Socket plugin (runtime IO $config defined, dev sockets malformed)', async (t) => {
  const cbs = []
  const context = {
    $config: {
      io: {
        sockets: [
          {
            name: 'runtime',
            url: 'http://someurl'
          },
          {
            name: 'runtime',
            url: 'http://someurl'
          }
        ]
      }
    },
    socketStatus: {},
    $on(evt, cb) {
      cbs.push(cb)
    },
    $emit(evt) {
      cbs.forEach((cb) => cb())
    }
  }
  const url = 'http://localhost:3000'
  const testCfg = {
    socketsX: [
      {
        default: true,
        url
      }
    ]
  }
  pOptions.set(testCfg)
  const socket = await loadPlugin({
    t,
    ioOpts: {
      name: 'runtime'
    },
    context
  })
  await delay(150)
  t.is(context.socketStatus.connectUrl, 'http://someurl')
  socket.close()
  context.$emit('closeSockets')
})

test('Socket plugin (from nuxt.config)', async (t) => {
  delete require.cache[tmpFile]
  delete process.env.TEST
  const imported = await compileAndImportPlugin({
    src,
    tmpFile,
    options: io,
    overwrite: true
  }).catch((err) => {
    consola.error('Compile and Import err', err.message)
    t.fail()
  })

  const testSocket = await loadPlugin({
    t,
    ioOpts: {
      channel: '/index'
    },
    plugin: imported.Plugin
  })
  const testJSON = { msg: 'it worked!' }
  const expected = 'It worked! Received msg: ' + JSON.stringify(testJSON)

  return new Promise((resolve) => {
    testSocket.emit('getMessage', testJSON, (actual) => {
      t.is(expected, actual)
      testSocket.close()
      resolve()
    })
  })
})
