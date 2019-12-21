/* eslint-disable no-console */
import { resolve as pResolve } from 'path'
import { serial as test, before, beforeEach, after } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import { compilePlugin, ioServerInit, removeCompiledPlugin } from '@/test/utils'
import Messages from '@/components/Messages.vue'
import { state as indexState, mutations, actions } from '@/store/index'
import { state as examplesState } from '@/store/examples'

const { io } = config
const state = indexState()
const vuexModules = {
  examples: {
    namespaced: true,
    state: examplesState()
  }
}

const src = pResolve('./io/plugin.js')
const tmpFile = pResolve('./io/tmp.compiled.js')

let Plugin, pOptions

async function compile(t) {
  const compiled = await compilePlugin({ src, tmpFile, options: io }).catch(
    (err) => {
      console.error(err)
      t.fail()
    }
  )
  Plugin = compiled.Plugin
  pOptions = compiled.pOptions
  pOptions.set(io)
  t.pass()
}

function injectPlugin(context) {
  return new Promise((resolve) => {
    Plugin(context, (label, nuxtSocket) => {
      context[`$${label}`] = nuxtSocket
      resolve(nuxtSocket)
    })
  })
}

let localVue
let store

before('Compile Plugin', compile)
before('Init IO Server', async (t) => {
  await ioServerInit(t, { port: 3000 })
})

beforeEach(() => {
  localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(BootstrapVue)
  store = new Vuex.Store({
    state,
    mutations,
    actions,
    modules: vuexModules
  })
})

after('Remove compiled plugin', () => {
  removeCompiledPlugin(tmpFile)
})

after('Stop IO Server', (t) => {
  t.context.ioServer.stop()
})

test('Messages is a Vue component', (t) => {
  const wrapper = shallowMount(Messages, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: () => {}
    }
  })
  t.truthy(wrapper.isVueInstance())
})

test('Inject Plugin', async (t) => {
  const wrapper = shallowMount(Messages, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({})
    }
  })
  t.truthy(wrapper.vm.$nuxtSocket)
})

test('Get Message', async (t) => {
  const wrapper = shallowMount(Messages, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({})
    }
  })
  const testJSON = { id: 'abc123' }
  const expected = 'It worked! Received msg: ' + JSON.stringify(testJSON)
  return new Promise(async (resolve) => {
    await wrapper.vm.getMessage()
    const { chatMessages, messageRxd } = wrapper.vm
    t.true(chatMessages.includes('Hi, this is a chat message from IO server!'))
    t.true(
      chatMessages.includes('Hi, this is another chat message from IO server!')
    )
    t.is(messageRxd, expected)
    resolve()
  })
})
