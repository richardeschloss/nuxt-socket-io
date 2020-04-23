import test, { before, beforeEach } from 'ava'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import config from '@/nuxt.config'
import { delay, injectPlugin } from '@/test/utils'
import SocketStatus from '@/components/SocketStatus.vue'
import IOStatus from '@/pages/ioStatus.vue'
import { register } from '@/io/module'

const { io } = config
const goodSocket = io.sockets.find(({ name }) => name === 'goodSocket')
const badSocket = io.sockets.find(({ name }) => name === 'badSocket')
goodSocket.default = true
pOptions.set({
  sockets: [goodSocket, badSocket]
})

let localVue
let store

before(() => {
  const ports = [3000]
  const p = ports.map((port) => register.server({ port }))
  return Promise.all(p)
})

beforeEach(() => {
  localVue = createLocalVue()
  localVue.use(Vuex)
  store = new Vuex.Store({
    state: {}
  })
})

test('IO Status Page', async (t) => {
  t.timeout(5000)
  const wrapper = mount(IOStatus, {
    localVue,
    store,
    stubs: {
      'nuxt-link': true
    },
    mocks: {
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  })
  t.truthy(wrapper.isVueInstance())
  await delay(3500)
  const children = wrapper.findAll(SocketStatus)
  const goodChild = children.at(0)
  const badChild = children.at(1)

  const { statusTbl: goodTbl } = goodChild.vm
  const { statusTbl: badTbl } = badChild.vm
  const expected1 = [{ item: 'status', info: 'OK' }]
  expected1.forEach(({ item, info }, idx) => {
    t.is(goodTbl[idx].item, item)
    t.is(goodTbl[idx].info, info)
  })

  const expectedItems = [
    'connectError',
    'reconnectAttempt',
    'reconnecting',
    'reconnectError'
  ]
  expectedItems.forEach((i) => {
    const fndItem = badTbl.find(({ item }) => item === i)
    t.truthy(fndItem)
  })
})
