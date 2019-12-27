/* eslint-disable no-console */
import test, { beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { injectPlugin } from '@/test/utils'
import Channel from '@/pages/rooms/_room/_channel.vue'
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

test.only('Channel page (two clients)', (t) => {
  t.timeout(25000)
  const users = ['user1', 'user2']
  const room = 'vueJS'
  const channel = 'general'
  const otherChannel = 'funStuff'
  const clients = []
  let doneCnt = 0
  const namespace = `rooms/${room}/${channel}`
  return new Promise((resolve) => {
    function checkLeft() {
      setImmediate(() => {
        const [c1, c2] = clients
        t.is(c1.vm.channelInfo.channel, channel)
        t.is(c1.vm.channelInfo.users.length, 1)
        t.is(c2.vm.channelInfo.channel, otherChannel)
        t.is(c2.vm.channelInfo.users.length, 1)
        resolve()
      })
    }

    function checkChatMsg() {
      setImmediate(() => {
        clients.forEach((client, idx) => {
          t.truthy(client.vm.chatMessage)
          t.is(client.vm.chatMessage.inputMsg, `Hi from ${users[1-idx]}`)
        })
        clients[0].vm.socket.on('leftChannel', () => {
          checkLeft()
        })
        clients[1].vm.$route.params.channel = otherChannel
      })
    }

    function testSendMsg() {
      let nextCnt = 0
      clients.forEach((client, idx) => {
        client.vm.inputMsg = `Hi from ${users[idx]}`
        client.vm.socket.on('chatMessage', (resp) => {
          if (++nextCnt === users.length) {
            checkChatMsg()
          }
        })
        client.vm.sendMsg()
      })
    }

    function checkJoined() {
      setImmediate(() => {
        clients.forEach((client, idx) => {
          t.truthy(client.vm.channelInfo)
          t.is(client.vm.channelInfo.users.length, users.length)
          t.is(client.vm.channelInfo.namespace, namespace)
          t.is(client.vm.channelInfo.channel, channel)
        })
        testSendMsg()
      })
    }

    users.forEach(async (user, idx) => {
      const $nuxtSocket = await injectPlugin({}, Plugin)
      const options = {
        propsData: {
          user
        },
        store,
        localVue,
        stubs: {
          'nuxt-child': true,
          'nuxt-link': true
        },
        mocks: {
          $route: {
            params: {
              room,
              channel
            }
          },
          $router: [],
          $nuxtSocket
        }
      }
      const wrapper = shallowMount(Channel, options)
      t.truthy(wrapper.isVueInstance())
      clients.push(wrapper)
      if (idx === 0) doneCnt++
      wrapper.vm.socket.on('joinedChannel', () => {
        if (++doneCnt === users.length) {
          checkJoined()
        }
      })
    })
  })
})
