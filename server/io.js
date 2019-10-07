const http = require('http') // Prod should use https
const fs = require('fs')
const consola = require('consola')
const socketIO = require('socket.io')

function IOServer({ host, port, server = http.createServer() }) {
  function registerIO(io) {
    const ioChannels = fs
      .readdirSync('./server/channels')
      .map((f) => f.replace('.js', ''))

    ioChannels.forEach((channel) => {
      io.of(`/${channel}`).on('connection', (socket) => {
        consola.info('socket.io client connected to', channel)
        const svc = require(`./channels/${channel}`).Svc()
        Object.entries(svc).forEach(([evt, fn]) => {
          if (typeof fn === 'function') {
            socket.on(evt, (msg, cb) => {
              const { notifyEvt = 'progress' } = msg
              fn({
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

  function listen() {
    return new Promise((resolve) => {
      server.listen(port, host, resolve)
    })
  }

  async function start() {
    consola.info('starting IO server...', host, port, server.listening)
    if (!server.listening) {
      consola.info('IO server not listening...will fix that...')
      await listen()
    }
    const io = socketIO(server)
    registerIO(io)
    return io
  }

  return Object.freeze({
    registerIO,
    start
  })
}

module.exports = {
  IOServer
}
