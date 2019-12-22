import path from 'path'
import consola from 'consola'
import { serial as test } from 'ava'
import config from '@/nuxt.config'
import { state as indexState } from '@/store/index'
import { state as examplesState } from '@/store/examples'
import { compileAndImportPlugin, removeCompiledPlugin } from '@/test/utils'

import Plugin, { pOptions } from '@/io/plugin.compiled'

const { io } = config
const state = indexState()
state.examples = examplesState()
state.examples.__ob__ = ''
const src = path.resolve('./io/plugin.js')
const tmpFile = path.resolve('./io/plugin.compiled.js')

function loadPlugin({
  t,
  ioOpts = {},
  plugin = Plugin,
  callCnt = { storeWatch: 0 }
}) {
  return new Promise((resolve, reject) => {
    const context = {}
    plugin(context, (label, NuxtSocket) => {
      context.$store = {
        commit: (msg) => {
          consola.log('commit', msg)
        },
        dispatch: (msg) => {
          consola.log('dispatch', msg)
        },
        watch: (stateCb, dataCb) => {
          callCnt.storeWatch++
          stateCb(state)
          dataCb({ sample: 123 })
        }
      }
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

test('Socket plugin (malformed vuex options)', async (t) => {
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000',
        vuex: {
          actions: {},
          mutations: {},
          emitBacks: {}
        }
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t })
})

test('Socket plugin (vuex options missing mutations)', async (t) => {
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000',
        vuex: {
          actions: []
        }
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t })
})

test('Socket plugin (vuex options missing actions)', async (t) => {
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000',
        vuex: {
          mutations: []
        }
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t })
})

test('Socket plugin (vuex opts as strings)', async (t) => {
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000',
        vuex: {
          actions: ['someAction'],
          mutations: ['someMutation']
        }
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t })
})

test('Socket plugin (malformed emitBacks)', async (t) => {
  const emitBack = 'examples'
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000',
        vuex: {
          actions: [],
          mutations: [],
          emitBacks: [emitBack]
        }
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t }).catch((e) => {
    t.is(
      e.message,
      emitBack + ' is a vuex module. You probably want to watch its properties'
    )
  })
})

test('Emitback is not defined in vuex store', async (t) => {
  const errEmitBack = 'something/undefined'
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000',
        vuex: {
          actions: [],
          mutations: [],
          emitBacks: [errEmitBack]
        }
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t }).catch((e) => {
    t.is(
      e.message,
      [
        `[nuxt-socket-io]: Trying to register emitback ${errEmitBack} failed`,
        `because it is not defined in Vuex.`,
        'Is state set up correctly in your stores folder?'
      ].join('\n')
    )
  })
})

test('Emitback is not defined in vuex store (variant 2)', async (t) => {
  const errEmitBack = { 'something/undefined': 'someData' }
  const [errEmitBackLabel] = Object.keys(errEmitBack)
  const testCfg = {
    sockets: [
      {
        default: true,
        url: 'http://localhost:3000',
        vuex: {
          actions: [],
          mutations: [],
          emitBacks: [errEmitBack]
        }
      }
    ]
  }
  pOptions.set(testCfg)
  await loadPlugin({ t }).catch((e) => {
    t.is(
      e.message,
      [
        `[nuxt-socket-io]: Trying to register emitback ${errEmitBackLabel} failed`,
        `because it is not defined in Vuex.`,
        'Is state set up correctly in your stores folder?'
      ].join('\n')
    )
  })
})

test('Duplicate Watchers are not registered', async (t) => {
  const testCfg = {
    sockets: [
      {
        default: true,
        name: 'test',
        url: 'http://localhost:3000',
        vuex: {
          emitBacks: ['examples/sample', { 'examples/sample2': 'sample2' }]
        }
      }
    ]
  }
  pOptions.set(testCfg)
  const callCnt = { storeWatch: 0 }
  const loadCnt = 2
  for (let i = 0; i < loadCnt; i++) {
    await loadPlugin({
      t,
      ioOpts: {
        name: 'test',
        channel: '/index'
      },
      callCnt
    })
  }

  t.is(callCnt.storeWatch, 2)
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
      name: 'test',
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
