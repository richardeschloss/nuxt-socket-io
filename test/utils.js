/* eslint-disable no-console */
import { Nuxt, Builder } from 'nuxt'
import config from '@/nuxt.config'
import { IOServer } from '@/server/io'

const oneSecond = 1000
const oneMinute = 60 * oneSecond

export async function ioServerInit(t) {
  console.time('ioServerInit')
  const ioServer = IOServer({
    proto: 'http',
    host: 'localhost',
    port: 4000
  })
  await ioServer.start()
  console.timeEnd('ioServerInit')
}

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
