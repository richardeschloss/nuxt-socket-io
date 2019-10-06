/* eslint-disable no-console */
import { Nuxt, Builder } from 'nuxt'
import config from '@/nuxt.config'

const oneSecond = 1000
const oneMinute = 60 * oneSecond

export async function nuxtInit(t) {
  t.timeout(3 * oneMinute)
  console.time('nuxtInit')
  console.log('Building Nuxt with config', config)
  const nuxt = new Nuxt(config)
  await new Builder(nuxt).build()
  await nuxt.server.listen(3000, 'localhost')
  t.context.nuxt = nuxt
  console.timeEnd('nuxtInit')
}

export function nuxtClose(t) {
  const { nuxt } = t.context
  nuxt.close()
}

export function nuxtWindowReady(window) {
  console.log('waiting for nuxt window...')
  return new Promise((resolve) => {
    console.log('ok...')
    window.onNuxtReady(resolve)
  })
}

export function waitMs(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}
