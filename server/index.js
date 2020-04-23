const express = require('express')
const { Nuxt, Builder } = require('nuxt')
const config = require('../nuxt.config.js')

// Boiler-plate
const app = express()

// Import and Set Nuxt.js options
config.dev = process.env.NODE_ENV !== 'production'

async function start() {
  // Init Nuxt
  const nuxt = new Nuxt(config)
  await nuxt.listen()

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }
}

if (require.main === module) {
  start()
}
