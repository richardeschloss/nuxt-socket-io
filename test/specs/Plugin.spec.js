import path from 'path'
import { serial as test } from 'ava'
import config from '@/nuxt.config'
import { state as indexState } from '@/store/index'
import { state as examplesState } from '@/store/examples'
import { compileAndImportPlugin } from '@/test/utils'

import Plugin, { pOptions } from '@/io/plugin.compiled'

const { io } = config
const state = indexState()
state.examples = examplesState()
state.examples.__ob__ = ''
const src = path.resolve('./io/plugin.js')
const tmpFile = path.resolve('./io/plugin.compiled.js')

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

function loadPlugin({
  t,
  context = {},
  ioOpts = {},
  plugin = Plugin,
  callCnt = { storeWatch: 0, storeCommit: 0, storeDispatch: 0 }
}) {
  if (!context.$on) {
    context.$on = function(evt, cb) {}
  }

  return new Promise((resolve, reject) => {
    context.$store = {
      commit: (msg) => {
        callCnt.storeCommit++
      },
      dispatch: (msg) => {
        callCnt.storeDispatch++
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

async function testNamespace({
  t,
  context,
  namespace,
  url = 'http://localhost:3000',
  channel = '/index',
  teardown = true
}) {
  const testCfg = {
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
      channel
    }
  })

  if (!namespace) return

  const { emitters = [], listeners = [] } = namespace
  if (listeners.constructor.name === 'Array') {
    listeners.forEach((entry) => {
      const { pre, post, evt, mapTo } = parseEntry(entry)
      if (pre) console.log(`testing pre ${pre} too`)
      if (post) console.log(`testing post ${post} too`)
      socket.on(evt, (msgRxd) => {
        setImmediate(() => {
          if (context[mapTo]) t.is(context[mapTo], msgRxd)
        })
      })
    })
  }

  return new Promise((resolve) => {
    if (emitters.length === 0 || listeners.constructor.name !== 'Array') {
      resolve()
    }
    let doneCnt = 0
    emitters.forEach((entry) => {
      const { mapTo, emitEvt } = parseEntry(entry)
      context[emitEvt]().then((resp) => {
        if (context[mapTo] !== undefined) {
          if (typeof resp === 'object') {
            Object.entries(resp).forEach(([key, val]) => {
              t.is(val, context[mapTo][key])
            })
          } else if (mapTo) {
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
    })
  })
}

async function testVuexOpts({
  t,
  context,
  callCnt,
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
  const socket = await loadPlugin({ t, context, callCnt })
  Object.entries(vuexOpts).forEach(([opt, groupOpts]) => {
    if (groupOpts.constructor.name === 'Array') {
      groupOpts.forEach((entry) => {
        const { evt } = parseEntry(entry)
        socket.emit('echoBack', { evt, data: 'abc123' })
      })
    }
  })
}

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
  const testCfg = { sockets: [{}] }
  pOptions.set(testCfg)
  await loadPlugin({ t }).catch((e) => {
    t.is(e.message, 'URL must be defined for nuxtSocket')
  })
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
  return new Promise((resolve) => {
    setTimeout(() => {
      Object.entries(context.socketStatus).forEach(([key, val]) => {
        if (key === 'connectUrl') {
          t.is(val, url)
        } else {
          t.is(val, '')
        }
      })
      context.$emit('closeSockets')
      resolve()
    }, 150)
  })
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
  return new Promise((resolve) => {
    setTimeout(() => {
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
      resolve()
    }, 150)
  })
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
  const callCnt = { storeWatch: 0, storeCommit: 0, storeDispatch: 0 }
  const context = {}
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
      'titleFromUser' // defined in store/index.js (for issue #35)
    ]
  }
  const testUrl = 'http://localhost:3000/examples'
  await testVuexOpts({ t, context, vuexOpts, callCnt, url: testUrl })
  return new Promise((resolve) => {
    setTimeout(() => {
      callees.called()
      t.is(callCnt.storeCommit, vuexOpts.mutations.length)
      t.is(callCnt.storeDispatch, vuexOpts.actions.length)
      resolve()
    }, 1000)
  })
})

test('Socket plugin (malformed emitBacks)', async (t) => {
  const emitBack = 'examples'
  const vuexOpts = {
    emitBacks: [emitBack]
  }
  await testVuexOpts({ t, vuexOpts }).catch((e) => {
    t.is(
      e.message,
      emitBack + ' is a vuex module. You probably want to watch its properties'
    )
  })
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
    emitBacks: ['examples/sample', { 'examples/sample2': 'sample2' }]
  }
  const context = {}
  const callCnt = { storeWatch: 0 }
  // Load and instantiate the first socket:
  await testVuexOpts({ t, vuexOpts, callCnt, context })

  // Instantiate the second socket:
  context.nuxtSocket({ default: true })
  t.is(callCnt.storeWatch, 2)
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
    myObj: {}
  }
  const callees = Callees({ t, callItems, context })
  const namespace = {
    emitters: [
      'reset] getProgress + refreshInfo --> progress [handleDone',
      'sample3',
      'receiveString + someString --> myArray',
      'receiveArray + someArray --> myObj',
      'noMethod] receiveArray2 + undefProp --> undefProp2 [noMethod2',
      'receiveString2 + someString2'
    ],
    listeners: ['preProgress] progress [postProgress']
  }
  await testNamespace({ t, context, namespace, channel: '/examples' })
  callees.called()
})

test('Namespace config (emitbacks)', async (t) => {
  const namespace = {
    emitBacks: [
      'sample3 [handleDone',
      'noMethod] sample4 <-- myObj.sample4 [handleX',
      'myObj.sample5',
      'preEmit] sample5'
    ]
  }
  const called = { preEmit: false }

  const context = {
    sample3: 100,
    myObj: {
      sample4: 50
    },
    sample5: 421,
    $watch(label, cb) {
      t.true(emitEvts.includes(label))
      cb(newData[label])
      if (label === 'sample5') {
        t.true(called.preEmit)
      }
    },
    preEmit: () => (called.preEmit = true),
    handleDone({ msg }) {
      t.is(msg, 'rxd sample ' + newData.sample3)
    }
  }

  const newData = {
    sample3: context.sample3 + 1,
    'myObj.sample4': context.myObj.sample4 + 1,
    sample5: 111
  }
  const emitEvts = Object.keys(newData)

  await testNamespace({ t, context, namespace, channel: '/examples' })
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 1000)
  })
})

test('Rooms (emitters)', async (t) => {
  const namespace = {
    emitters: ['getRooms --> rooms']
  }

  const expected = ['vueJS', 'nuxtJS']
  const context = {
    rooms: []
  }
  await testNamespace({
    t,
    context,
    namespace,
    channel: '/rooms',
    teardown: false
  })
  expected.forEach((room, idx) => {
    t.is(room, context.rooms[idx])
  })
})

test('Room (emitters and listeners)', (t) => {
  t.timeout(5000)
  const users = ['userABC', 'userXYZ']
  const namespace = {
    emitters: ['joinRoom + joinMsg --> roomInfo'],
    listeners: ['joinedRoom [updateUsers', 'leftRoom [userLeft']
  }
  let doneCnt = 0
  const sockets = []

  return new Promise((resolve) => {
    const room = 'vueJS'
    users.forEach(async (user, idx) => {
      const called = { updateUsers: false }
      const context = {
        joinMsg: {
          room,
          user
        },
        joinedRoom: {},
        roomInfo: {},
        userLeft({ user: goneUser, users: usersNow }) {
          t.is(goneUser, users[1])
          t.is(usersNow.length, 1)
          sockets[0].close()
          resolve()
        },
        updateUsers(resp) {
          called.updateUsers = true
        }
      }
      const socket = await testNamespace({
        t,
        context,
        namespace,
        channel: '/room',
        teardown: false
      })
      sockets.push(socket)
      setTimeout(() => {
        if (idx === 0) {
          t.true(called.updateUsers)
          t.is(context.joinedRoom.user, users[1])
        }
        const {
          room: roomName,
          users: roomUsers,
          user: userResp,
          namespace
        } = context.roomInfo
        t.is(namespace, `rooms/${context.joinMsg.room}`)
        t.is(roomName, room)
        t.is(userResp, user)
        t.true(roomUsers.includes(user))
        if (++doneCnt === users.length) {
          sockets[1].close()
        }
      }, 100)
    })
  })
})

test('Channel (emitters and listeners)', (t) => {
  t.timeout(5000)
  const users = ['userABC', 'userXYZ']
  const namespace = {
    emitters: [
      'joinChannel + joinMsg --> channelInfo',
      'sendMsg + userMsg --> msgRxd [updateChats'
    ],
    listeners: [
      'joinedChannel [updateUsers',
      'leftChannel [userLeft',
      'chatMessage [appendChat'
    ]
  }

  let doneCnt = 0
  const sockets = []

  return new Promise((resolve) => {
    const room = 'vueJS'
    const channel = 'general'
    const chatNamespace = `rooms/${room}/${channel}`
    users.forEach((user, idx) => {
      const context = {
        joinMsg: {
          room,
          channel,
          user
        },
        joinedChannel: {},
        channelInfo: {},
        chatMessage: '',
        userMsg: {
          inputMsg: `Hi from user ${user}`,
          user,
          room,
          channel,
          namespace: chatNamespace
        },
        msgRxd: {},
        appendChat(resp) {
          t.is(context.chatMessage.inputMsg, `Hi from user ${users[1]}`)
        },
        userLeft({ user: goneUser, users: usersNow }) {
          t.is(goneUser, users[1])
          t.is(usersNow.length, 1)
          resolve()
        },
        updateChats(resp) {
          t.is(resp.inputMsg, context.userMsg.inputMsg)
        },
        updateUsers({ user: joinedUser }) {
          t.is(joinedUser, users[1])
        }
      }

      setTimeout(async () => {
        const socket = await testNamespace({
          t,
          context,
          namespace,
          channel: '/channel',
          teardown: false
        })
        sockets.push(socket)
      }, 100 * (idx + 1))

      setTimeout(() => {
        if (idx === 0) {
          t.is(context.joinedChannel.user, users[1])
        }
        const {
          channel: fndChannel,
          user: userResp,
          chats,
          namespace
        } = context.channelInfo
        t.is(namespace, chatNamespace)
        t.is(fndChannel, channel)
        t.is(userResp, user)
        t.is(context.msgRxd.inputMsg, context.userMsg.inputMsg)
        if (++doneCnt === users.length) {
          const [firstChat] = chats
          t.is(firstChat.user, users[0])
          t.is(firstChat.inputMsg, `Hi from user ${users[0]}`)
          sockets[1].close()
        }
      }, 1000)
    })
  })
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

test('Socket plugin (from nuxt.config)', async (t) => {
  delete require.cache[tmpFile]
  delete process.env.TEST
  const imported = await compileAndImportPlugin({
    src,
    tmpFile,
    options: io,
    overwrite: true
  }).catch((err) => {
    console.error('Compile and Import err', err.message)
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
