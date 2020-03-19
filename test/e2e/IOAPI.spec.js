/* eslint-disable no-console */
import test, { beforeEach } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import config from '@/nuxt.config'
import Plugin, { pOptions } from '@/io/plugin.compiled'
import { injectPlugin } from '@/test/utils'
import IOAPI from '@/pages/ioApi.vue'

const { io } = config
pOptions.set(io)

let localVue

beforeEach(() => {
  localVue = createLocalVue()
})

test('Get API', async (t) => {
  const wrapper = shallowMount(IOAPI, {
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({}, Plugin)
    }
  })
  t.truthy(wrapper.isVueInstance())
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('API', wrapper.vm.ioApi)
      t.truthy(wrapper.vm.ioApi)
      resolve()
    }, 500)
  })
})
