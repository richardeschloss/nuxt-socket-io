/* eslint-disable no-console */
import { resolve as pResolve } from 'path'
import { compilePlugin } from './utils'
import config from '@/nuxt.config'

const { io } = config

console.time('avaSetup_specs')
compilePlugin({
  src: pResolve('./io/plugin.js'),
  tmpFile: pResolve('./io/plugin.compiled.js'),
  options: io,
  overwrite: true
})
console.timeEnd('avaSetup_specs')
