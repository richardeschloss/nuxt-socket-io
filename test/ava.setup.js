const hooks = require('require-extension-hooks')
const { TEST } = process.env

if (TEST === 'unit') {
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
