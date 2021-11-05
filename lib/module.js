/* eslint-disable node/no-callback-literal */
/*
 * Copyright 2021 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import http from 'http'
import { existsSync } from 'fs'
import { resolve as pResolve, parse as pParse, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import consola from 'consola'
import Debug from 'debug'
import { Server as SocketIO } from 'socket.io'
import Glob from 'glob'

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url))

const debug = Debug('nuxt-socket-io')
const glob = promisify(Glob)

const register = {
  /**
   * @param {import('socket.io').Server | import('socket.io').Namespace} io
   * @param {{ [s: string]: any; } | ArrayLike<any>} middlewares
   */
  middlewares (io, middlewares) {
    Object.values(middlewares).forEach(m => io.use(m))
  },
  /**
   * @param {import('socket.io').Server} io
   * @param {string} ioSvc
   */
  async ioSvc (io, ioSvc) {
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
    } else {
      throw new Error(
        `io service at ${ioSvc} does not export a default "Svc()" function. Not registering`
      )
    }
  },
  /**
   * @param {import('socket.io').Server} io
   * @param {string} nspDir
   */
  async nspSvc (io, nspDir) {
    const nspFiles = await glob(`${nspDir}/**/*.{js,ts,mjs}`)
    const nspDirResolved = pResolve(nspDir).replace(/\\/g, '/')
    const namespaces = nspFiles.map(
      f => f.split(nspDirResolved)[1].split(/\.(js|ts|mjs)$/)[0]
    )
    namespaces.forEach(async (namespace, idx) => {
      const imports = await import(nspFiles[idx])
      const {
        default: Svc,
        middlewares = {},
        setIO = () => {}
      } = imports

      register.middlewares(io.of(namespace), middlewares)
      setIO(io)

      if (Svc && typeof Svc === 'function') {
        io.of(`${namespace}`).on('connection', (socket) => {
          const svc = Svc(socket, io)
          register.socket(svc, socket, namespace)
        })
      } else {
        debug(
          `io service at ${nspDirResolved}${namespace} does not export a default "Svc()" function. Not registering`
        )
      }
    })
  },
  listener (server = http.createServer(), port = 3000, host = 'localhost') {
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
  server (options = {}, server = http.createServer()) {
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
        .map(ext => pResolve(ioSvc + ext))
        .find(path => existsSync(path))
    const nspDirFull = pResolve(
      extList.includes(nspDirExt)
        ? nspDir.substr(0, nspDir.length - nspDirExt.length)
        : nspDir
    )

    const io = new SocketIO(server, ioServerOpts)
    const svcs = { ioSvc: ioSvcFull, nspSvc: nspDirFull }
    const p = []
    const errs = []
    Object.entries(svcs).forEach(([svcName, svc]) => {
      if (existsSync(svc)) {
        p.push(register[svcName](io, svc, nspDirFull)
          .catch((err) => {
            debug(err)
            errs.push(err)
          }))
      }
    })

    if (!server.listening) {
      p.push(register.listener(server, port, host))
    }
    return Promise.all(p).then(() => ({ io, server, errs }))
  },
  socket (svc, socket, namespace) {
    consola.info('socket.io client connected to ', namespace)
    Object.entries(svc).forEach(([evt, fn]) => {
      if (typeof fn === 'function') {
        socket.on(evt, async (msg, cb = () => {}) => {
          try {
            const resp = await fn(msg)
            // @ts-ignore
            cb(resp)
          } catch (err) {
            // @ts-ignore
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

/** @param {import('./types').NuxtSocketIoOptions} moduleOptions */
export default function (moduleOptions) {
  const options = { ...this.options.io, ...moduleOptions }

  this.options.publicRuntimeConfig.nuxtSocketIO = { ...options }

  if (options.server !== false) {
    this.nuxt.hook('listen', async (server = http.createServer()) => {
      await register.server(options.server, server).catch(consola.error)
      this.nuxt.hook('close', () => server.close())
    })
  }

  this.nuxt.hook('components:dirs', (dirs) => {
    dirs.push({
      path: pResolve(__dirname, 'components'),
      prefix: 'io'
    })
  })

  this.addPlugin({
    ssr: true,
    src: pResolve(__dirname, 'plugin.js'),
    fileName: 'nuxt-socket-io.js'
  })
}

export { register }
