/* eslint-disable no-console */
import { resolve as pResolve } from 'path'
import { serial as test, before, beforeEach, after } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import { compilePlugin, ioServerInit, removeCompiledPlugin } from '@/test/utils'
import Samples from '@/components/Samples.vue'
import { state as indexState, mutations, actions } from '@/store/index'
import {
  state as examplesState,
  mutations as examplesMutations
} from '@/store/examples'

const { io } = config
const state = indexState()
const vuexModules = {
  examples: {
    namespaced: true,
    state: examplesState(),
    mutations: examplesMutations
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

test('Samples is a Vue component', (t) => {
  const wrapper = shallowMount(Samples, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: () => {}
    }
  })
  t.truthy(wrapper.isVueInstance())
})

test('Prop changes emitted back', async (t) => {
  t.timeout(5000)
  const testVal = 1337
  const testVal2 = 4321
  const serverEvts = [
    {
      evt: 'sampleDataRxd',
      expMsg: 'Sample data rxd on state change',
      expVal: testVal
    },
    {
      evt: 'sample2DataRxd',
      expMsg: 'Sample2 data rxd on state change',
      expVal: testVal2
    }
  ]

  const wrapper = shallowMount(Samples, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({})
    }
  })

  return new Promise((resolve) => {
    let doneCnt = 0
    const handleDone = () => {
      if (++doneCnt === serverEvts.length) {
        resolve()
      }
    }
    serverEvts.forEach(({ evt, expMsg, expVal }, idx) => {
      console.log('register listener...', evt)
      wrapper.vm.socket.on(evt, ({ msg, sample }) => {
        console.log('msg rxd', msg, sample)
        t.is(msg, expMsg)
        t.is(sample, expVal)
        handleDone()
      })
    })
    wrapper.vm.sample = testVal
    wrapper.vm.sample2 = testVal2
  })
})
