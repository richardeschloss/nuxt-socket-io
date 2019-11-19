import fs from 'fs'
import path from 'path'
import consola from 'consola'
import { serial as test, before, after } from 'ava'
import config from '@/nuxt.config'
import { state as indexState } from '@/store/index'
import { state as examplesState } from '@/store/examples'
import { compilePlugin, ioServerInit, removeCompiledPlugin } from '@/test/utils'

const { io } = config
const state = indexState()
state.examples = examplesState()
state.examples.__ob__ = ''
const src = path.resolve('./io/plugin.js')
const tmpFile = path.resolve('./io/plugin.compiled.js')

function loadPlugin(t, ioOpts = {}) {
  return new Promise((resolve, reject) => {
    const context = {}
    Plugin(context, (label, NuxtSocket) => {
      const testObj = {
        $store: {
          commit: (msg) => {
            consola.log('commit', msg)
          },
          dispatch: (msg) => {
            consola.log('dispatch', msg)
          },
          watch: (stateCb, dataCb) => {
            stateCb(state)
            dataCb({ sample: 123 })
          }
        },
        testSocket: NuxtSocket
      }

      try {
        const socket = testObj.testSocket(ioOpts)
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

let Plugin, pOptions

before('Compile Plugin', async (t) => {
  const compiled = await compilePlugin({ src, tmpFile, options: io }).catch(
    (err) => {
      consola.error(err)
      t.fail()
    }
  )
  Plugin = compiled.Plugin
  pOptions = compiled.pOptions
  t.pass()
})

before('Init IO Server', ioServerInit)

after('Remove compiled plugin', () => {
  removeCompiledPlugin(tmpFile)
})

test('Socket plugin (empty options)', async (t) => {
  const testCfg = { sockets: [] }
  pOptions.set(testCfg)
  await loadPlugin(t).catch((e) => {
    t.is(
      e.message,
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  })
})

test('Socket plugin (malformed sockets)', async (t) => {
  const testCfg = { sockets: {} }
  pOptions.set(testCfg)
  await loadPlugin(t).catch((e) => {
    t.is(
      e.message,
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  })
})

test('Socket plugin (options missing info)', async (t) => {
  const testCfg = { sockets: [{}] }
  pOptions.set(testCfg)
  await loadPlugin(t).catch((e) => {
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
  await loadPlugin(t, { name: 'home' })
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
  await loadPlugin(t)
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
  await loadPlugin(t)
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
  await loadPlugin(t).catch((e) => {
    t.is(
      e.message,
      emitBack + ' is a vuex module. You probably want to watch its properties'
    )
  })
})

test('Socket plugin (from nuxt.config)', async (t) => {
  delete process.env.TEST
  const { ioServer } = t.context
  const testSocket = await loadPlugin(t, {
    name: 'test',
    channel: '/index'
  })
  const testJSON = { msg: 'it worked!' }
  const expected = 'It worked! Received msg: ' + JSON.stringify(testJSON)
  return new Promise((resolve) => {
    testSocket
      .emit('getMessage', testJSON, async (actual) => {
        t.is(expected, actual)
        await ioServer.stop()
      })
      .on('disconnect', () => {
        resolve()
      })
  })
})
