/* eslint-disable no-console */
import { resolve as pResolve } from 'path'
import hooks from 'require-extension-hooks'
import { compilePlugin } from './utils'
import config from '@/nuxt.config'

const { io } = config

console.time('avaSetup_e2e')
compilePlugin({
  src: pResolve('./io/plugin.js'),
  tmpFile: pResolve('./io/plugin.compiled.js'),
  options: io,
  overwrite: false
})
require('jsdom-global')()
require('browser-env')()
const Vue = require('vue')
Vue.config.productionTip = false
// https://github.com/nuxt/create-nuxt-app/issues/180#issuecomment-463069941
window.Date = global.Date = Date

hooks('vue')
  .plugin('vue')
  .push()
hooks(['vue', 'js'])
  .exclude(({ filename }) => filename.match(/\/node_modules\//))
  .plugin('babel')
  .push()

console.timeEnd('avaSetup_e2e')
