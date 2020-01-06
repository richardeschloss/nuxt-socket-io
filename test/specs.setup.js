import { resolve as pResolve } from 'path'
import { ioServerInit, compilePlugin } from './utils'
import config from '@/nuxt.config'

const { io } = config
const ioPorts = [3000]

console.time('avaSetup_specs')
compilePlugin({
  src: pResolve('./io/plugin.js'),
  tmpFile: pResolve('./io/plugin.compiled.js'),
  options: io,
  overwrite: false // true
})
ioPorts.forEach((port) => {
  ioServerInit({ port }).catch((err) => {
    console.error(err.message)
  })
})
console.timeEnd('avaSetup_specs')
