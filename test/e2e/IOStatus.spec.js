import test, { beforeEach } from 'ava'
import { createLocalVue, mount } from '@vue/test-utils'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import config from '@/nuxt.config'
import { injectPlugin } from '@/test/utils'
import SocketStatus from '@/components/SocketStatus.vue'
import IOStatus from '@/pages/ioStatus.vue'

const { io } = config
pOptions.set(io)

let localVue

beforeEach(() => {
  localVue = createLocalVue()
})

test('IO Status Page', async (t) => {
  const wrapper = mount(IOStatus, {
    localVue,
    stubs: {
      'nuxt-link': true
    },
    mocks: {
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  })
  console.log('Wrapper is vue instance:', wrapper.isVueInstance())
  t.truthy(wrapper.isVueInstance())
  return new Promise((resolve) => {
    setTimeout(() => {
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
      resolve()
    }, 1500)
  })
})
