/*
 * Copyright 2020 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import http from 'http'
import { existsSync, readdirSync } from 'fs'
import { resolve as pResolve, parse as pParse } from 'path'
import consola from 'consola'
import socketIO from 'socket.io'

function listen(server, port, host) {
  // TBD: move to utils, re-test deploy
  return new Promise((resolve, reject) => {
    server
      .listen(port, host)
      .on('error', reject)
      .on('listening', () => {
        consola.info(`socket.io server listening on ${host}:${port}`)
        resolve(server)
      })
  })
}

const register = {
  ioSvc(io, ioSvc) {
    return new Promise((resolve, reject) => {
      const { default: Svc } = require(ioSvc)
      if (Svc && typeof Svc === 'function') {
        io.on('connection', (socket) => {
          const svc = Svc(socket, io)
          register.socket(svc, socket, '/')
        })
        resolve()
      } else {
        reject(
          new Error(
            `io service at ${ioSvc} does not export a default "Svc()" function. Not registering`
          )
        )
      }
    })
  },
  nspSvc(io, nspDir) {
    return new Promise((resolve, reject) => {
      // const nspDirFull = pResolve(nspDir)
      // if (!existsSync(nspDirFull)) {
      //   reject(
      //     new Error(
      //       `Namespace directory ${nspDirFull} does not exist. Not registering namespaces`
      //     )
      //   )
      //   return
      // }

      const namespaces = readdirSync(nspDir)
        .map(pParse)
        .filter(({ ext }) => ext === '.js')
        .map(({ name }) => name)

      namespaces.forEach((namespace) => {
        const { default: Svc } = require(pResolve(`${nspDir}/${namespace}`))
        if (Svc && typeof Svc === 'function') {
          io.of(`/${namespace}`).on('connection', (socket) => {
            const svc = Svc(socket, io)
            register.socket(svc, socket, namespace)
          })
        } else {
          consola.warn(
            `io service at ${nspDir}/${namespace} does not export a default "Svc()" function. Not registering`
          )
        }
      })
      resolve()
    })
  },
  server(server = http.createServer(), options = {}) {
    const {
      ioSvc = './server/io',
      nspDir = ioSvc,
      host = 'localhost',
      port = 3000
    } = options
    const ioSvcFull = pResolve(ioSvc.endsWith('.js') ? ioSvc : ioSvc + '.js')
    const nspDirFull = pResolve(
      nspDir.endsWith('.js') ? nspDir.substr(nspDir.length - 3) : nspDir
    )
    const io = socketIO(server)
    const svcs = { ioSvc: ioSvcFull, nspSvc: nspDirFull }
    const p = []
    Object.entries(svcs).forEach(([svcName, svc]) => {
      if (existsSync(svc)) {
        p.push(register[svcName](io, svc))
      }
    })

    if (!server.listening) {
      p.push(listen(server, port, host))
    }
    return Promise.all(p).then(() => server)
  },
  socket(svc, socket, namespace) {
    consola.info('socket.io client connected to ', namespace)
    Object.entries(svc).forEach(([evt, fn]) => {
      if (typeof fn === 'function') {
        socket.on(evt, (msg, cb) => {
          // TBD: re-run plugin tests
          fn(msg)
            .then(cb)
            .catch(cb)
        })
      }
    })
    socket.on('disconnect', () => {
      consola.info('client disconnected from', namespace)
    })
  }
}

export default function nuxtSocketIO(moduleOptions) {
  const options = Object.assign({}, this.options.io, moduleOptions)

  if (options.server !== false) {
    this.nuxt.hook('listen', async (server = http.createServer()) => {
      await register.server(server, options.server).catch(consola.error)
      this.nuxt.hook('close', () => {
        server.close()
      })
    })
  }

  this.addPlugin({
    ssr: true,
    src: pResolve(__dirname, 'plugin.js'),
    fileName: 'nuxt-socket-io.js',
    options
  })
}

export { register }
