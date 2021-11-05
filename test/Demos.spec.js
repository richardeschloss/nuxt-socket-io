import 'jsdom-global/register.js'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import ava from 'ava'
import config from '../nuxt.config.js'
import { register } from '../lib/module.js'
import Plugin from '../lib/plugin.js'
import * as store from '../store/index.js'
import * as examplesStore from '../store/examples.js'
import Messages from '../components/Messages.vue'

const { serial: test, before } = ava

Vue.use(Vuex)

const mocks = ctx => ({
  $store: new Store({
    state: store.state(),
    mutations: store.mutations,
    actions: store.actions,
    modules: {
      examples: {
        namespaced: true,
        state: examplesStore.state()
      }
    }
  }),
  $config: {
    nuxtSocketIO: {},
    io: config.io
  },
  inject: (label, fn) => {
    ctx['$' + label] = fn
  }
})

before('Start IO Server', async (t) => {
  await register.server({ port: 3000 })
})

test('Messages', async (t) => {
  const Comp = Vue.extend(Messages)
  const comp = new Comp()
  Object.assign(comp, mocks(comp))
  Plugin(null, comp.inject)
  comp.$mount()
  await comp.getMessage()
  t.is(comp.messageRxd, 'It worked! Received msg: {"id":"abc123"}')
  t.true(comp.chatMessages.length > 0)
  const p = comp.socket.onceP('chatMessage')
  comp.getMessage()
  const r = await p
  t.is(r, 'Hi, this is a chat message from IO server!')

  t.truthy(comp.getMessage2)
})
