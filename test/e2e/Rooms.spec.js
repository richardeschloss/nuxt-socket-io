/* eslint-disable no-console */
import test, { beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { injectPlugin } from '@/test/utils'
import Rooms from '@/pages/rooms.vue'
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

test('Rooms page', async (t) => {
  const wrapper = shallowMount(Rooms, {
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
  wrapper.setData({ selectedRoom: 'vueJS' })
  t.truthy(wrapper.isVueInstance())
  return new Promise((resolve) => {
    setTimeout(() => {
      t.true(wrapper.vm.rooms.length > 0)
      wrapper.vm.toRoom()
      t.is(wrapper.vm.$router[0], `/rooms/${wrapper.vm.selectedRoom}`)
      resolve()
    }, 1500)
  })
})
