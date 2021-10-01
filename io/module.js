/* eslint-disable standard/no-callback-literal */
/*
 * Copyright 2020 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import http from 'http'
import { existsSync } from 'fs'
import { resolve as pResolve, parse as pParse } from 'path'
import { promisify } from 'util'
import consola from 'consola'
import { Server as SocketIO } from 'socket.io'
import Glob from 'glob'

const glob = promisify(Glob)

const register = {
  middlewares(io, middlewares) {
    Object.values(middlewares).forEach((m) => io.use(m))
  },
  ioSvc(io, ioSvc, nspDir) {
    return new Promise(async (resolve, reject) => {
      const { default: Svc, middlewares = {}, setIO = () => {} } = await import(
        ioSvc
      )
      register.middlewares(io, middlewares)
      setIO(io)

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
    return new Promise(async (resolve, reject) => {
      const nspFiles = await glob(`${nspDir}/**/*.{js,ts,mjs}`)
      const nspDirResolved = pResolve(nspDir).replace(/\\/g, '/')
      const namespaces = nspFiles.map(
        (f) => f.split(nspDirResolved)[1].split(/\.(js|ts|mjs)$/)[0]
      )
      namespaces.forEach(async (namespace, idx) => {
        const {
          default: Svc,
          middlewares = {},
          setIO = () => {}
        } = await import(nspFiles[idx])
        register.middlewares(io.of(namespace), middlewares)
        setIO(io)

        if (Svc && typeof Svc === 'function') {
          io.of(`${namespace}`).on('connection', (socket) => {
            const svc = Svc(socket, io)
            register.socket(svc, socket, namespace)
          })
        } else {
          consola.info(
            `io service at ${nspDirResolved}${namespace} does not export a default "Svc()" function. Not registering`
          )
        }
      })
      resolve()
    })
  },
  listener(server = http.createServer(), port = 3000, host = 'localhost') {
    return new Promise((resolve, reject) => {
      server
        .listen(port, host)
        .on('error', reject)
        .on('listening', () => {
          consola.info(`socket.io server listening on ${host}:${port}`)
          resolve(server)
        })
    })
  },
  server(options = {}, server = http.createServer()) {
    const {
      ioSvc = './server/io',
      nspDir = ioSvc,
      host = 'localhost',
      port = 3000,
      ...ioServerOpts // Options that get passed down to SocketIO instance.
    } = options

    const { ext: ioSvcExt } = pParse(ioSvc)
    const { ext: nspDirExt } = pParse(ioSvc)
    const extList = ['.js', '.ts', '.mjs']
    const ioSvcFull = ioSvcExt
      ? pResolve(ioSvc)
      : extList
          .map((ext) => pResolve(ioSvc + ext))
          .find((path) => existsSync(path))
    const nspDirFull = pResolve(
      extList.includes(nspDirExt)
        ? nspDir.substr(0, nspDir.length - nspDirExt.length)
        : nspDir
    )

    const io = new SocketIO(server, ioServerOpts)
    const svcs = { ioSvc: ioSvcFull, nspSvc: nspDirFull }
    const p = []
    Object.entries(svcs).forEach(([svcName, svc]) => {
      if (existsSync(svc)) {
        p.push(register[svcName](io, svc, nspDirFull))
      }
    })

    if (!server.listening) {
      p.push(register.listener(server, port, host))
    }
    return Promise.all(p).then(() => server)
  },
  socket(svc, socket, namespace) {
    consola.info('socket.io client connected to ', namespace)
    Object.entries(svc).forEach(([evt, fn]) => {
      if (typeof fn === 'function') {
        socket.on(evt, async (msg, cb = () => {}) => {
          try {
            const resp = await fn(msg)
            cb(resp)
          } catch (err) {
            cb({ emitError: err.message, evt })
          }
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
      await register.server(options.server, server).catch(consola.error)
      this.nuxt.hook('close', () => server.close())
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
