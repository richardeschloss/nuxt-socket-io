import ava from 'ava'
import { delay } from 'les-utils/utils/promise.js'
import { register } from '../lib/module.js'
import { useNuxtSocket, emit } from '../lib/plugin.js' // It actually is used by the mock defineNuxtPlugin
import { pluginCtx } from './utils/plugin.js'

const { serial: test, before, after } = ava
let ioServerObj

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
    alreadyDefd: {},
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

const ctx = pluginCtx()
ctx.$config.nuxtSocketIO = {}

/**
 * @param {import('socket.io-client').Socket} s
 */
function waitForSocket (s) {
  return new Promise((resolve) => {
    if (s.connected) {
      resolve(s)
      return
    }
    s.on('connect', () => resolve(s))
  })
}

/**
 * @param {import('socket.io-client').Socket} s
 * @param {function} trigger
 * @param {Array<String>} evts
 */
function triggerEvents (s, trigger, evts) {
  const p = evts.map(evt =>
    new Promise((resolve) => {
      s.on(evt, resolve)
    })
  )
  trigger()
  return Promise.all(p)
}

function waitForEchoBack (s, evts) {
  const p = evts.map(evt =>
    new Promise((resolve) => {
      s.on(evt, resolve)
      s.emit('echoBack', { evt, data: 'abc123' })
    })
  )
  return Promise.all(p)
}

function RefImpl (arg) {
  this.value = arg
}

before(async (t) => {
  ioServerObj = await register.server({ port: 3000 })
  global.window = {
    // @ts-ignore
    location: {
      host: 'localhost:4000',
      hostname: 'localhost',
      href: 'http://localhost:4000/',
      port: '4000',
      origin: 'http://localhost:4000'
    }
  }
})

after(() => {
  ioServerObj.io.close()
  ioServerObj.server.close()
})

test('nuxtSocket, ioState injected', (t) => {
  t.truthy(ctx.$nuxtSocket)
  t.truthy(ctx.$ioState)
})

test('ioState (state for the new "iox")', (t) => {
  const state = ctx.$ioState().value
  state.xyz = 123
  const next = ctx.$ioState().value
  t.is(next.xyz, 123)
})

test('useNuxtSocket (nuxtSocket internal state)', (t) => {
  const state = useNuxtSocket().value
  t.truthy(state.emitTimeouts)
})

test('Socket plugin (runtime IO $config defined, sockets undef)', (t) => {
  ctx.$config.io = {}
  try {
    ctx.$nuxtSocket({ name: 'runtime' })
  } catch (err) {
    t.is(err.message, "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]")
  }
})

test('Socket plugin (runtime IO $config defined, duplicate sockets)', (t) => {
  ctx.$config.io = {
    sockets: [
      {
        name: 'runtime',
        url: 'http://localhost:3000'
      },
      {
        name: 'runtime',
        url: 'http://someurl'
      }
    ]
  }
  ctx.socketStatus = {}
  const socket = ctx.$nuxtSocket({ name: 'runtime', info: false })
  t.truthy(socket)
  t.is(ctx.socketStatus.connectUrl, 'http://localhost:3000')
})

test('Socket plugin (runtime IO $config defined, merges safely with modOptions)', (t) => {
  ctx.$config.io = {
    sockets: [
      {
        name: 'runtime',
        url: 'http://localhost:3000'
      }
    ]
  }
  ctx.$config.nuxtSocketIO = {
    sockets: [
      {
        name: 'main',
        url: 'http://localhost:3001'
      }
    ]
  }
  ctx.socketStatus = {}
  ctx.$nuxtSocket({ default: true, info: false })
  t.is(ctx.socketStatus.connectUrl, 'http://localhost:3001')
  ctx.socketStatus = {}
  ctx.$nuxtSocket({ name: 'runtime', info: false })
  t.is(ctx.socketStatus.connectUrl, 'http://localhost:3000')
})

test('Socket.url not defined', (t) => {
  ctx.$config.nuxtSocketIO = {
    sockets: [
      {
        name: 'main'
      }
    ]
  }
  ctx.socketStatus = {}
  ctx.$nuxtSocket({ info: false })
  t.is(ctx.socketStatus.connectUrl, window.location.origin)
})

test('Socket Persistence (persist = true)', async (t) => {
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  const s1 = ctx.$nuxtSocket({ persist: true, teardown: false })
  await waitForSocket(s1)
  const s2 = ctx.$nuxtSocket({ persist: true, teardown: false })
  await waitForSocket(s2)
  t.is(s1.id, s2.id)
  s1.close()
  s2.close()
})

test('Socket Persistence (persist = label)', async (t) => {
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  const s1 = ctx.$nuxtSocket({ persist: 'mySocket', teardown: false })
  await waitForSocket(s1)
  const s2 = ctx.$nuxtSocket({ persist: 'mySocket', teardown: false })
  await waitForSocket(s2)
  t.is(s1.id, s2.id)
  s1.close()
  s2.close()
})

test('Socket Persistence (persist = true, persisted socket disconnected)', async (t) => {
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  const s1 = ctx.$nuxtSocket({ persist: true, teardown: false })
  await waitForSocket(s1)
  s1.close()
  const s2 = ctx.$nuxtSocket({ persist: true, teardown: false })
  await waitForSocket(s2)
  t.not(s1.id, s2.id)
})

test('Namespace config (registration)', async (t) => {
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000',
          namespacesx: {
            '/': {
              emitters: ['echo2 --> respx'],
              listeners: ['xyz']
            }
          }
        }
      ]
    }
  }
  ctx.resp = ''

  ctx.$nuxtSocket({
    channel: '/',
    namespaceCfg: {
      emitters: { echo: 'resp' }
    }
  })
  t.falsy(ctx.echo)

  const s = ctx.$nuxtSocket({
    channel: '/',
    namespaceCfg: {
      emitters: [
        'echo --> resp'
      ]
    }
  })
  await waitForSocket(s)
  await ctx.echo('Hi')
  t.is(ctx.resp, 'Hi')
  s.close()
})

test('Namespace config (emitters)', async (t) => {
  let preEmit, handleAck
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  Object.assign(ctx, {
    chatMessage2: '',
    chatMessage4: '',
    message5Rxd: '',
    echoBack: {}, // Expect to be overwritten by nspCfg.
    resp: '',
    testMsg: 'A test msg',
    userInfo: {
      name: 'John Smith'
    },
    ids: [123, 444],
    items: [],
    titleResp: '',
    hello: new RefImpl(false),
    preEmit () {
      preEmit = true
    },
    preEmitFail () {
      return false
    },
    handleAck () {
      handleAck = true
    }
  })
  const s = ctx.$nuxtSocket({
    channel: '/index',
    emitTimeout: 5000,
    namespaceCfg: {
      emitters: [
        'echoBack --> echoBack',
        'preEmit] titleFromUser + userInfo --> titleResp [handleAck',
        'preEmitFail] echo',
        'echoError',
        'echoHello --> hello',
        'getItems + ids --> items',
        'echoUndefMsg + undefMsg',
        111 // invalid type...nothing should happen
      ]
    }
  })
  t.is(typeof ctx.echoBack, 'function')
  const resp = await ctx.echoBack({ data: 'Hi' })
  t.is(resp.data, 'Hi')
  await ctx.titleFromUser()
  t.true(preEmit)
  t.true(handleAck)
  t.is(ctx.titleResp.data, 'received msg John Smith!')
  const r2 = await ctx.echo('Hi')
  t.falsy(r2)

  await ctx.echoError()
    .catch((err) => {
      t.is(err.message, 'SomeError')
    })
  ctx.emitErrors = {}
  await ctx.echoError()
  t.is(ctx.emitErrors.echoError[0].message, 'SomeError')

  const s2 = ctx.$nuxtSocket({
    channel: '/index',
    emitTimeout: 100,
    namespaceCfg: {
      emitters: ['noHandler']
    }
  })
  await ctx.noHandler()
  t.is(ctx.emitErrors.noHandler[0].message, 'emitTimeout')
  delete ctx.emitErrors
  await ctx.noHandler().catch((err) => {
    t.is(err.message, 'emitTimeout')
  })
  await ctx.echoHello()
  t.is(ctx.hello.value.data, 'hello')

  await ctx.getItems()
  t.is(ctx.items.length, 2)

  const resp3 = await ctx.echoUndefMsg()
  t.falsy(resp3)

  s.close()
  s2.close()
})

test('Namespace config (listeners)', async (t) => {
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  let preEmit, handleAck
  Object.assign(ctx, {
    chatMessage2: '',
    chatMessage4: '',
    message5Rxd: '',
    testMsg: 'A test msg',
    preEmit () {
      preEmit = true
    },
    handleAck () {
      handleAck = true
    }
  })

  const s = ctx.$nuxtSocket({
    channel: '/index',
    namespaceCfg: {
      emitters: [
        'getMessage2 + testMsg --> message2Rxd'
      ],
      listeners: [
        'preEmit] chatMessage2 [handleAck',
        'undef1] chatMessage3 --> message3Rxd [undef2',
        'chatMessage4',
        'chatMessage5 --> message5Rxd'
      ]
    }
  })

  await waitForSocket(s)
  t.truthy(ctx.getMessage2)
  await triggerEvents(s, ctx.getMessage2, ['chatMessage2', 'chatMessage3'])
  t.falsy(ctx.message2Rxd)
  t.true(preEmit)
  t.true(handleAck)
  t.is(ctx.chatMessage2, 'Hi, this is a chat message from IO server!')
  t.falsy(ctx.chatMessage3)
  t.is(ctx.chatMessage4.data, 'Hi again')
  t.is(ctx.message5Rxd.data, 'Hi again from 5')
  s.close()
})

test('Namespace config (emitBacks)', async (t) => {
  let preEmit, postEmit
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  Object.assign(ctx, {
    hello: false,
    hello2: false,
    sample3: 100,
    myObj: {
      sample4: 50
    },
    sample5: 421,
    preEmit () {
      preEmit = true
    },
    preEmitValid ({ data }) {
      return data === 'yes'
    },
    postEmitHook () {
      postEmit = true
    },
    handleDone ({ msg }) {
      t.is(msg, 'rxd sample ' + newData.sample3)
    }
  })
  const newData = {
    sample3: ctx.sample3 + 1,
    'myObj.sample4': ctx.myObj.sample4 + 1,
    'myObj.sample5': ctx.myObj.sample5 + 1,
    sample5: 111,
    hello: 'no',
    hello2: 'yes'
  }
  const emitEvts = Object.keys(newData)
  ctx.$watch = (label, cb) => {
    t.true(emitEvts.includes(label))
    cb(newData[label])
    if (label === 'sample5') {
      t.true(preEmit)
    }
  }

  const s = ctx.$nuxtSocket({
    channel: '/examples',
    namespaceCfg: {
      emitBacks: [
        'sample3 [handleDone',
        'noMethod] sample4 <-- myObj.sample4 [handleX',
        'myObj.sample5',
        'preEmit] sample5',
        'preEmitValid] hello [postEmitHook',
        'preEmitValid] echoHello <-- hello2 [postEmitHook'
      ]
    }
  })
  await delay(1000)
  t.true(postEmit)
  s.close()
})

test('Teardown', (t) => {
  const ctx = pluginCtx()
  ctx.$config.nuxtSocketIO = {}
  let componentDestroyCnt = 0
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  Object.assign(ctx, {
    $destroy () {
      componentDestroyCnt++
    }
  })

  const s = ctx.$nuxtSocket({ teardown: true })
  ctx.$emit = ctx.$$emit
  const s2 = ctx.$nuxtSocket({ teardown: true })
  s.on('someEvt', () => {})
  s2.on('someEvt', () => {})
  t.true(s.hasListeners('someEvt'))
  t.true(s2.hasListeners('someEvt'))
  ctx.$destroy()
  t.is(componentDestroyCnt, 1)
  t.false(s.hasListeners('someEvt'))
  t.false(s2.hasListeners('someEvt'))

  const ctx3 = { ...ctx }
  Object.assign(ctx3, {
    registeredTeardown: false,
    onUnmounted: ctx.$destroy
  })

  const s3 = ctx3.$nuxtSocket({ teardown: true })
  ctx3.onUnmounted()
  t.is(componentDestroyCnt, 2)
})

test('Stubs (composition api support)', async (t) => {
  const ctx = pluginCtx()
  ctx.$config.nuxtSocketIO = { sockets: [{ url: 'http://localhost:3000' }] }
  // ctx.Plugin(null, ctx.inject)

  async function validateEventHub () {
    const props = ['$on', '$off', '$once', '$$emit']
    props.forEach(p => t.truthy(ctx[p]))

    let rxCnt = 0
    let rx2Cnt = 0
    ctx.$on('msg', (arg) => {
      rxCnt++
      t.is(arg, 'hello')
    })
    ctx.$once('msg2', (arg) => {
      rx2Cnt++
      t.is(arg, 'hello 2')
    })
    ctx.$$emit('msg', 'hello')
    ctx.$off('msg')
    ctx.$$emit('msg', 'hello again')
    ctx.$$emit('msg2', 'hello 2')
    await delay(100)
    t.is(rxCnt, 1)
    t.is(rx2Cnt, 1)
  }

  function validateSet () {
    const obj = {
      val1: new RefImpl(10),
      val2: 10
    }
    ctx.$set(obj, 'val1', 22)
    ctx.$set(obj, 'val2', 22)
    t.is(obj.val1.value, 22)
    t.is(obj.val2, 22)
  }

  function validateWatch () {
    ctx.$watch('someLabel', () => {})
    t.pass()
  }
  ctx.$nuxtSocket({})
  const p = [validateEventHub(), validateSet(), validateWatch()]
  await Promise.all(p)
})

test('Dynamic API Feature (Server)', async (t) => {
  const ctx = pluginCtx()
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  const apiIgnoreEvts = ['ignoreMe']
  ctx.$nuxtSocket({
    channel: '/dynamic',
    serverAPI: {},
    apiIgnoreEvts
  })
  await delay(500)
  t.falsy(ctx.ioApi)
  Object.assign(ctx, {
    ioApi: {},
    ioData: {}
  })

  const s = ctx.$nuxtSocket({
    channel: '/dynamic',
    serverAPI: {},
    apiIgnoreEvts
  })
  // eslint-disable-next-line no-console
  console.log('creating a duplicate listener to see if plugin handles it')
  s.on('itemRxd', () => {})
  await delay(500)
  t.true(ctx.ioApi.ready)
  const state = useNuxtSocket().value
  t.truthy(state.ioApis['main/dynamic'])
  const items = await ctx.ioApi.getItems()
  const item1 = await ctx.ioApi.getItem({ id: 'abc123' })
  Object.assign(ctx.ioData.getItem.msg, { id: 'something' })
  const item2 = await ctx.ioApi.getItem()
  const noResp = await ctx.ioApi.noResp()
  t.true(items.length > 0)
  t.is(item1.id, 'abc123')
  t.is(item2.id, 'something')
  Object.keys(ctx.ioApi.evts).forEach((evt) => {
    if (!apiIgnoreEvts.includes(evt)) {
      t.true(s.hasListeners(evt))
    } else {
      t.false(s.hasListeners(evt))
    }
  })
  t.true(Object.keys(noResp).length === 0)

  Object.assign(ctx, {
    ioApi: {},
    ioData: {}
  })

  const s2 = ctx.$nuxtSocket({
    channel: '/p2p',
    serverAPI: {},
    clientAPI
  })
  await delay(500)
  t.truthy(state.ioApis['main/p2p'])
  const props = ['evts', 'methods']
  props.forEach((prop) => {
    const clientProps = Object.keys(clientAPI[prop])
    const serverProps = Object.keys(ctx.ioApi[prop])
    clientProps.forEach((cProp) => {
      t.true(serverProps.includes(cProp))
    })
  })
  t.true(ctx.ioApi.ready)
})

test('Dynamic API Feature (Client)', async (t) => {
  const ctx = pluginCtx()
  ctx.$config = {
    nuxtSocketIO: {
      sockets: [
        {
          name: 'main',
          url: 'http://localhost:3000'
        }
      ]
    }
  }
  Object.assign(ctx, {
    ioApi: {},
    ioData: {},
    alreadyDefdEmit () {

    }
  })
  const s = ctx.$nuxtSocket({
    channel: '/p2p',
    clientAPI: {}
  })

  const state = useNuxtSocket().value
  t.falsy(state.clientApis['main/p2p'])
  s.close()
  const callCnt = { receiveMsg: 0 }
  Object.assign(ctx, {
    undefApiData: {},
    warnings: {},
    receiveMsg (msg) {
      callCnt.receiveMsg++
      return Promise.resolve({
        status: 'ok'
      })
    }
  })
  const s2 = ctx.$nuxtSocket({
    channel: '/p2p',
    persist: true,
    serverAPI: {},
    clientAPI
  })
  t.truthy(state.clientApis)

  await emit({
    evt: 'sendEvts',
    msg: {},
    socket: s2
  })
  t.is(callCnt.receiveMsg, 2)
  Object.keys(clientAPI.evts.warnings.data).forEach((prop) => {
    t.true(ctx.warnings[prop] !== undefined)
  })
  ctx.warnings.battery = 11

  const resp = await ctx.warningsEmit()
  const resp2 = await ctx.warningsEmit({ ack: true })
  const resp3 = await ctx.warningsEmit({ ack: true, battery: 22 })
  t.falsy(resp)
  t.truthy(resp2)
  t.is(resp2.battery, ctx.warnings.battery)
  t.is(resp3.battery, 22)

  ctx.$nuxtSocket({
    warnings: true, // show the warnings
    channel: '/p2p',
    persist: true,
    serverAPI: {},
    clientAPI
  })

  ctx.$nuxtSocket({
    warnings: false, // hide the warnings
    channel: '/p2p',
    persist: true,
    serverAPI: {},
    clientAPI
  })
})

test('Promisified emit and once', async (t) => {
  const ctx = pluginCtx()
  ctx.$config.nuxtSocketIO = { sockets: [{ url: 'http://localhost:3000' }] }
  const s = ctx.$nuxtSocket({ channel: '/index', teardown: false, reconnection: true })
  t.truthy(s.emitP)
  t.truthy(s.onceP)
  const p = s.onceP('chatMessage')
  t.true(s.hasListeners('chatMessage'))
  const r = await s.emitP('getMessage', { id: 'abc123' })
  const r2 = await p
  t.false(s.hasListeners('chatMessage'))
  t.is(r, 'It worked! Received msg: {"id":"abc123"}')
  t.is(r2, 'Hi, this is a chat message from IO server!')
})
