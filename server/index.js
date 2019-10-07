const http = require('http') // Prod should use https
const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const config = require('../nuxt.config.js')
const { IOServer } = require('./io')

// Boiler-plate
const app = express()
const server = http.createServer(app) // Prod should separate server code from client and use https
const altServer = http.createServer()
altServer.listen(4000, 'localhost')
const ioServer = IOServer(altServer)

// Import and Set Nuxt.js options
config.dev = process.env.NODE_ENV !== 'production'

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)
  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  server.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}

if (require.main === module) {
  start()
  ioServer.start()
}
