/* eslint-disable no-console */
import { serial as test, beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import config from '@/nuxt.config'
import { injectPlugin, removeCompiledPlugin } from '@/test/utils' // TBD
import Messages from '@/components/Messages.vue'
import { state as indexState, mutations, actions } from '@/store/index'
import { state as examplesState } from '@/store/examples'

const { io } = config
pOptions.set(io)
const state = indexState()
const vuexModules = {
  examples: {
    namespaced: true,
    state: examplesState()
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

test('Get Message', async (t) => {
  const wrapper = shallowMount(Messages, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({}, Plugin)
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
