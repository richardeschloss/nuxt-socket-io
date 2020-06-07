import test, { before, beforeEach } from 'ava'
import { createLocalVue, shallowMount, RouterLinkStub } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { delay, injectPlugin, watchP, ioServerInit } from '@/test/utils'
import Room from '@/pages/rooms/_room.vue'

const { io } = config
pOptions.set(io)

let localVue

async function apiReady({ room, user }) {
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
      NuxtLink: RouterLinkStub
    },
    mocks: {
      $route: {
        params: {
          room
        }
      },
      $router: [],
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  }
  const wrapper = shallowMount(Room, options)
  const ctx = wrapper.vm
  await watchP(ctx, 'ioApi.ready')
  await delay(150)
  return { ctx, wrapper }
}

before(() => ioServerInit())

beforeEach(() => {
  localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(BootstrapVue)
})

test('Room page (two clients)', async (t) => {
  const room = 'vueJS'
  const user1 = 'userABC'
  const user2 = 'userXYZ'
  const { ctx: c1, wrapper } = await apiReady({ room, user: user1 })
  t.true(c1.ioApi.ready)
  t.is(c1.room, 'vueJS')
  t.is(c1.user, user1)  
  
  const { ctx: c2 } = await apiReady({ room, user: user2 })
  t.true(c2.ioApi.ready)
  t.is(c1.ioData.userJoined, user2)
  c1.$destroy()
  await delay(150)
  t.is(c2.ioData.userLeft, user1)
  t.false(c2.users.includes(user1))
  t.true(c2.users.includes(user2))
})
