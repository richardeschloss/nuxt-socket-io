import test, { before, beforeEach } from 'ava'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { delay, injectPlugin, waitForEvt, watchP, ioServerInit } from '@/test/utils'
import Channel from '@/pages/rooms/_room/_channel.vue'

const { io } = config
pOptions.set(io)

let localVue

async function apiReady({ room, channel, user }) {
  const store = new Vuex.Store({
    state: {}
  })
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
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  }
  const wrapper = mount(Channel, options)
  const ctx = wrapper.vm
  await watchP(ctx, 'ioApi.ready')
  await delay(150)
  return { ctx }
}

function msgSend(from, to, msg) {
  return new Promise((resolve) => {
    to.$watch('ioData.chat', resolve)
    from.inputMsg = msg
    from.ioApi.sendMsg(from.userMsg)
  })
}

before(() => ioServerInit())

beforeEach(() => {
  localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(BootstrapVue)
})

test('Channel Page (two users)', async (t) => {
  const user1 = 'userABC'
  const user2 = 'userXYZ'
  const room = 'vueJS'
  const channel = 'general'
  const { ctx: c1 } = await apiReady({ room, channel, user: user1 })
  t.true(c1.ioApi.ready)
  
  const { ctx: c2 } = await apiReady({ room, channel, user: user2 })
  t.true(c2.ioApi.ready)
  t.is(c1.ioData.userJoined, user2)

  const testMsg = `Hi from ${user1}`
  const chatRxd = await msgSend(c1, c2, testMsg)
  t.is(chatRxd.inputMsg, testMsg)
})