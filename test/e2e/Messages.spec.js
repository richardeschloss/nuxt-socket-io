/* eslint-disable no-console */
import test, { beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import config from '@/nuxt.config'
import { injectPlugin } from '@/test/utils'
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

test('Get Message', async (t) => {
  const wrapper = shallowMount(Messages, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  })
  t.truthy(wrapper.isVueInstance())
  const testJSON = { id: 'abc123' }
  const expected = 'It worked! Received msg: ' + JSON.stringify(testJSON)
  const expectedChats = [
    'Hi, this is a chat message from IO server!',
    'Hi, this is another chat message from IO server!'
  ]
  let chatIdx = 0
  return new Promise(async (resolve) => {
    wrapper.vm.socket.on('chatMessages', (msg) => {
      wrapper.vm.$nextTick(() => {
        t.true(wrapper.vm.chatMessages.includes(expectedChats[chatIdx]))
        chatIdx++
      })
    })
    await wrapper.vm.getMessage()
    const { messageRxd } = wrapper.vm
    t.is(messageRxd, expected)
    resolve()
  })
})

test('Get Message (namespace cfg)', async (t) => {
  t.timeout(5000)
  const wrapper = shallowMount(Messages, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  })
  const testMsg = { id: 'abc123' }
  wrapper.setData({ testMsg })
  const expected = 'It worked! Received msg: ' + JSON.stringify(testMsg)
  const expectedChats = [
    'Hi, this is a chat message from IO server!',
    'Hi, this is another chat message from IO server!'
  ]
  const expectedMessage3 = 'sending chat message3...'
  let chatIdx = 0
  return new Promise(async (resolve) => {
    wrapper.vm.socket.on('chatMessage2', (msg) => {
      wrapper.vm.$nextTick(() => {
        t.true(wrapper.vm.chatMessage2.includes(expectedChats[chatIdx]))
        chatIdx++
      })
    })
    wrapper.vm.socket.on('chatMessage3', (msg) => {
      setTimeout(() => {
        t.is(wrapper.vm.message3Rxd, expectedMessage3)
      }, 500)
    })
    await wrapper.vm.getMessage2()
    t.is(wrapper.vm.message2Rxd, expected)
    resolve()
  })
})
