import hooks from 'require-extension-hooks'
import Vue from 'vue'
import { ioServerInit } from './utils'

const { TEST } = process.env

if (TEST === 'unit') {
  ioServerInit({ port: 4000 })
  ioServerInit({ port: 3000 })
  require('jsdom-global')()
  require('browser-env')()

  // https://github.com/nuxt/create-nuxt-app/issues/180#issuecomment-463069941
  window.Date = global.Date = Date
} else if (TEST === 'e2e') {
}

Vue.config.productionTip = false

hooks('vue')
  .plugin('vue')
  .push()
hooks(['vue', 'js'])
  .exclude(({ filename }) => filename.match(/\/node_modules\//))
  .plugin('babel')
  .push()
