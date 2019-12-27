/* eslint-disable no-console */
import test, { beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { injectPlugin } from '@/test/utils'
import ProgressBar from '@/components/ProgressBar.vue'
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

test('Get Progress', async (t) => {
  t.timeout(10000)
  const wrapper = shallowMount(ProgressBar, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  })
  t.truthy(wrapper.isVueInstance())
  const refreshInfo = { period: 50 }
  wrapper.setData({ refreshInfo })
  return new Promise((resolve) => {
    wrapper.vm.socket.on('progress', (data) => {
      // The component will set this.progress. Wait for it...
      wrapper.vm.$nextTick(() => {
        const {
          showProgress,
          congratulate,
          progress,
          progressVuex
        } = wrapper.vm
        t.is(progressVuex, progress)
        if (progress < 100) {
          t.true(showProgress)
          t.false(congratulate)
        }
      })
    })
    wrapper.vm.getProgress().then(() => {
      setTimeout(() => {
        const {
          showProgress,
          congratulate,
          progress,
          progressVuex
        } = wrapper.vm
        t.false(showProgress)
        t.true(congratulate)
        t.is(progress, 100)
        t.is(progressVuex, progress)
        resolve()
      }, 1000)
    })
  })
})
