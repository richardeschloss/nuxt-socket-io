import { reactive, toRef, isReactive } from 'vue'
const ctx = {
  payload: {},
  provide (label, fn) {
    ctx['$' + label] = fn
  },
  $config: {
    public: {}
  }
}

// lib/plugin.js will call this...
export function defineNuxtPlugin (cb) {
  cb(ctx)
  return { ...ctx }
}

// This returns a clean copy of the ctx
export function pluginCtx () {
  return { ...ctx }
}

export function useState (key, init) {
  const nuxtApp = pluginCtx()
  if (!nuxtApp.payload.useState) {
    nuxtApp.payload.useState = {}
  }
  if (!isReactive(nuxtApp.payload.useState)) {
    nuxtApp.payload.useState = reactive(nuxtApp.payload.useState)
  }

  const state = toRef(nuxtApp.payload.useState, key)
  if (state.value === undefined && init) {
    state.value = init()
  }
  return state
}
