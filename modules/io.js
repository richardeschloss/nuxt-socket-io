const { resolve } = require('path')

module.exports = function nuxtSocketIO(moduleOptions) {
  const options = Object.assign({}, this.options.io, moduleOptions)

  this.addPlugin({
    ssr: false,
    src: resolve('plugins/io.js'),
    fileName: 'nuxt-socket-io.js',
    options
  })
}

// module.exports.meta = require('../package.json')
