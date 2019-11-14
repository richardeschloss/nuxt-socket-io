import fs from 'fs'
import path from 'path'
import consola from 'consola'
import { serial as test } from 'ava'
import config from '@/nuxt.config'
import { state as indexState } from '@/store/index'
import { state as examplesState } from '@/store/examples'
import { compilePlugin, removeCompiledPlugin } from '@/test/utils'

const { io } = config
const state = indexState()
state.examples = examplesState()

test.only('Socket plugin', async (t) => {
  consola.log('testing with plugin options', io)
  const src = path.resolve('./io/plugin.js')
  const tmpFile = path.resolve('./io/plugin.compiled.js')
  const Plugin = await compilePlugin({ src, tmpFile, options: io }).catch(
    (err) => {
      consola.error(err)
      t.fail()
    }
  )
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
      const socket = testObj.testSocket({})
      t.is(label, 'nuxtSocket')
      t.is(typeof NuxtSocket, 'function')
      t.is(NuxtSocket.name, 'nuxtSocket')
      t.is(socket.constructor.name, 'Socket')
    } catch (e) {
      consola.error(
        'Plugin error:',
        e,
        '\r\n\r\n(were mocks set up correctly?)'
      )
      t.fail()
    }
  })
  removeCompiledPlugin(tmpFile)
})
