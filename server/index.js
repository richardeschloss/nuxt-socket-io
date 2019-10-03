const http = require('http') // Prod should use https
const fs = require('fs')
const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')

// Boiler-plate
const app = express()
const server = http.createServer(app) // Prod should separate server code from client and use https
const io = require('socket.io')(server)

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
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

  const ioChannels = fs
    .readdirSync('./server/channels')
    .map((f) => f.replace('.js', ''))

  ioChannels.forEach((channel) => {
    io.of(`/${channel}`).on('connection', (socket) => {
      consola.info('socket.io client connected to', channel)
      const svc = require(`./channels/${channel}`).Svc()
      Object.keys(svc).forEach((evt) => {
        if (typeof svc[evt] === 'function') {
          socket.on(evt, (msg, cb) => {
            const { notifyEvt = 'progress' } = msg
            svc[evt]({
              notify: (data) => {
                socket.emit(notifyEvt, data)
              },
              ...msg
            }).then(cb)
          })
        }
      })
    })
  })
}
start()
