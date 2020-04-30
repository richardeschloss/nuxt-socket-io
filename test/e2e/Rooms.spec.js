import test, { before, beforeEach } from 'ava'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { injectPlugin, watchP, ioServerInit } from '@/test/utils'
import Rooms from '@/pages/rooms.vue'

const { io } = config
pOptions.set(io)

let localVue
let store

before(() => ioServerInit())

beforeEach(() => {
  localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(BootstrapVue)
  store = new Vuex.Store({
    state: {}
  })
})

test('Rooms page', async (t) => {
  const wrapper = mount(Rooms, {
    data() {
      return {
        ioApi: {},
        ioData: {},
        selectedRoom: ''
      }
    },
    store,
    localVue,
    stubs: {
      'nuxt-child': true
    },
    mocks: {
      $route: {
        params: {
          room: 'vueJS'
        }
      },
      $router: [],
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  })
  t.truthy(wrapper.isVueInstance())
  const ctx = wrapper.vm
  await watchP(ctx, 'ioApi.ready')
  t.true(ctx.ioApi.ready)
  const rooms = await watchP(ctx, 'rooms')
  t.true(rooms.length > 0)
  wrapper.setData({ selectedRoom: 'vueJS' })
  const elm = wrapper.find('input[list="room-choices"]')
  elm.trigger('input')
  t.is(ctx.$router[0], '/rooms/vueJS')
})
