import { resolve as pResolve } from 'path'
import hooks from 'require-extension-hooks'
import { ioServerInit, compilePlugin } from './utils'
import config from '@/nuxt.config'

const { TEST } = process.env
const { io } = config

if (TEST === 'unit') {
  // compilePlugin({
  //   src: pResolve('./io/plugin.js'),
  //   tmpFile: pResolve('./io/tmp.compiled.js'),
  //   options: io
  // })
  compilePlugin({
    src: pResolve('./io/plugin.js'),
    tmpFile: pResolve('./io/plugin.compiled.js'),
    options: io
  })
  ioServerInit({ port: 4000 })
  ioServerInit({ port: 3000 })
  require('jsdom-global')()
  require('browser-env')()
  const Vue = require('vue')
  Vue.config.productionTip = false
  // https://github.com/nuxt/create-nuxt-app/issues/180#issuecomment-463069941
  window.Date = global.Date = Date
} else if (TEST === 'e2e') {
  const Vue = require('vue')
  Vue.config.productionTip = false
}

hooks('vue')
  .plugin('vue')
  .push()
hooks(['vue', 'js'])
  .exclude(({ filename }) => filename.match(/\/node_modules\//))
  .plugin('babel')
  .push()
