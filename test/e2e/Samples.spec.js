/* eslint-disable no-console */
import test, { beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { injectPlugin } from '@/test/utils'
import Samples from '@/components/Samples.vue'
import { state as indexState, mutations, actions } from '@/store/index'
import {
  state as examplesState,
  mutations as examplesMutations
} from '@/store/examples'

const { io } = config
pOptions.set(io)
const state = indexState()
const vuexModules = {
  examples: {
    namespaced: true,
    state: examplesState(),
    mutations: examplesMutations
  }
}

let localVue
let store

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
      $nuxtSocket: await injectPlugin({}, Plugin)
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
