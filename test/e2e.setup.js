/* eslint-disable no-console */
import 'jsdom-global/register'
import { resolve as pResolve } from 'path'
import BrowserEnv from 'browser-env'
import hooks from 'require-extension-hooks'
import config from '@/nuxt.config'
import { compilePlugin } from './utils'
BrowserEnv()

const { io } = config

console.time('avaSetup_e2e')
compilePlugin({
  src: pResolve('./io/plugin.js'),
  tmpFile: pResolve('./io/plugin.compiled.js'),
  options: io,
  overwrite: false
})

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
