/* eslint-disable no-console */
import test, { beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { injectPlugin } from '@/test/utils'
import Room from '@/pages/rooms/_room.vue'
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

test('Room page mounted ok', async (t) => {
  const wrapper = shallowMount(Room, {
    store,
    localVue,
    stubs: {
      'nuxt-child': true,
      'nuxt-link': true
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
  const { room, $route } = wrapper.vm
  t.is(room, $route.params.room)
})

test('Room page (two clients)', (t) => {
  t.timeout(5000)
  const users = ['user1', 'user2']
  const room = 'vueJS'
  const otherRoom = 'nuxtJS'
  const clients = []
  let doneCnt = 0
  return new Promise((resolve) => {
    function checkLeft() {
      setTimeout(() => {
        console.log('checkLeft')
        const [c1, c2] = clients
        t.is(c1.vm.roomInfo.room, room)
        t.is(c1.vm.roomInfo.users.length, 1)
        t.is(c2.vm.roomInfo.room, otherRoom)
        t.is(c2.vm.roomInfo.users.length, 1)
        resolve()
      }, 1000)
    }

    function checkJoined() {
      setTimeout(() => {
        clients.forEach((client) => {
          t.is(client.vm.roomInfo.users.length, users.length)
        })
        clients[1].vm.$route.params.room = otherRoom
        checkLeft()
      }, 1000)
    }

    users.forEach(async (user) => {
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
              room: ''
            }
          },
          $router: [],
          $nuxtSocket
        }
      }
      const wrapper = shallowMount(Room, options)
      wrapper.vm.$route.params.room = room
      clients.push(wrapper)
      if (++doneCnt === users.length) {
        checkJoined()
      }
    })
  })
})
