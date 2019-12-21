/* eslint-disable no-console */
import { resolve as pResolve } from 'path'
import { serial as test, before, beforeEach, after } from 'ava'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { BootstrapVue } from 'bootstrap-vue'
import config from '@/nuxt.config'
import { compilePlugin, ioServerInit, removeCompiledPlugin } from '@/test/utils'
import ProgressBar from '@/components/ProgressBar.vue'
import { state as indexState, mutations, actions } from '@/store/index'
import { state as examplesState } from '@/store/examples'

const { io } = config
const state = indexState()
state.examples = examplesState()

mutations[`examples/SET_PROGRESS`] = function(state, progress) {
  state.examples.progress = progress
}

const src = pResolve('./io/plugin.js')
const tmpFile = pResolve('/tmp/plugin.compiled.js')

let Plugin, pOptions

async function compile(t) {
  const compiled = await compilePlugin({ src, tmpFile, options: io }).catch(
    (err) => {
      console.error(err)
      t.fail()
    }
  )
  Plugin = compiled.Plugin
  pOptions = compiled.pOptions
  pOptions.set(io)
  t.pass()
}

function injectPlugin(context) {
  return new Promise((resolve) => {
    Plugin(context, (label, nuxtSocket) => {
      context[`$${label}`] = nuxtSocket
      resolve(nuxtSocket)
    })
  })
}

let localVue
let store

before('Compile Plugin', compile)
before('Init IO Server', async (t) => {
  await ioServerInit(t, { port: 3000 })
})

beforeEach(() => {
  localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(BootstrapVue)
  store = new Vuex.Store({
    state,
    mutations,
    actions
  })
})

after('Remove compiled plugin', () => {
  removeCompiledPlugin(tmpFile)
})

test('ProgressBar is a Vue component', (t) => {
  const wrapper = shallowMount(ProgressBar, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: () => {}
    }
  })
  t.truthy(wrapper.isVueInstance())
})

test('Inject Plugin', async (t) => {
  const wrapper = shallowMount(ProgressBar, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({})
    }
  })
  t.truthy(wrapper.vm.$nuxtSocket)
})

test('Get Progress', async (t) => {
  const wrapper = shallowMount(ProgressBar, {
    store,
    localVue,
    mocks: {
      $nuxtSocket: await injectPlugin({})
    }
  })
  const refreshPeriod = 50
  wrapper.setData({ refreshPeriod })
  return new Promise((resolve) => {
    wrapper.vm.socket.on('progress', (data) => {
      // The component will set this.progress. Wait for it...
      wrapper.vm.$nextTick(() => {
        t.is(wrapper.vm.progress, wrapper.vm.progressVuex)
      })
    })
    wrapper.vm.getProgress().then(() => {
      const { showProgress, congratulate, progress, progressVuex } = wrapper.vm
      t.false(showProgress)
      t.true(congratulate)
      t.is(progress, 100)
      t.is(progressVuex, progress)
      resolve()
    })
  })
})
