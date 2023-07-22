/* eslint-disable node/no-callback-literal */
/*
 * Copyright 2022 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import http from 'http'
import { existsSync } from 'fs'
import { resolve as pResolve, parse as pParse, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import consola from 'consola'
import { defineNuxtModule, addPlugin } from '@nuxt/kit'
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
      (process.platform === 'win32' ? 'file://' : '') + ioSvc
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
      const imports = await import((process.platform === 'win32' ? 'file://' : '') +  nspFiles[idx])
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
  async redis (io, redisClient) {
    let useClient = redisClient
    const dfltClient = { url: 'redis://localhost:6379' }
    if (redisClient === true) {
      useClient = dfltClient
    }
    debug('starting redis adapter', useClient)
    const { createAdapter } = await import('@socket.io/redis-adapter')
    const { createClient } = await import('redis')
    const pubClient = createClient(useClient)
    const subClient = pubClient.duplicate()
    await Promise.all([pubClient.connect(), subClient.connect()])
    io.adapter(createAdapter(pubClient, subClient))
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
      redisClient,
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
    if (redisClient) {
      register.redis(io, redisClient)
    }
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

function includeDeps (nuxt, deps) {
  /* c8 ignore start */
  if (!nuxt.options.vite) {
    nuxt.options.vite = {}
  }

  if (!nuxt.options.vite.optimizeDeps) {
    nuxt.options.vite.optimizeDeps = {}
  }
  if (!nuxt.options.vite.optimizeDeps.include) {
    nuxt.options.vite.optimizeDeps.include = []
  }
  nuxt.options.vite.optimizeDeps.include.push(...deps)
  /* c8 ignore stop */
}

/** @param {import('./types').NuxtSocketIoOptions} moduleOptions */
export default defineNuxtModule({
  setup (moduleOptions, nuxt) {
    const options = { ...nuxt.options.io, ...moduleOptions }
    nuxt.hook('components:dirs', (dirs) => {
      dirs.push({
        path: pResolve(__dirname, 'components'),
        prefix: 'io'
      })
    })
    nuxt.options.runtimeConfig.public.nuxtSocketIO = { ...options }
    nuxt.hook('listen', (server) => {
      if (options.server !== false) {
        // PORT=4444 npm run dev # would run nuxt app on a different port.
        // socket.io server will run on process.env.PORT + 1 or 3001 by default.
        // Specifying io.server.port will override this behavior.
        // NOTE: nuxt.options.server is planned to be deprecated, so we'll pull from env vars instead.
        // Not sure why they're deprecating that, it's super useful!
        // const { host = 'localhost', port = 3000 } = nuxt.options?.server || {}
        const ioServerOpts = {
          teardown: true,
          serverInst: server, // serverInst can be overridden by options.server.serverInst below
          host: process.env.HOST || 'localhost',
          port: process.env.PORT !== undefined
            ? parseInt(process.env.PORT) // + 1
            : 3000, // 3001,
          ...options.server // <-- This is different from nuxt.options server. This is the server options to pass to socket.io server
        }
        if (ioServerOpts.teardown) {
          nuxt.hook('close', () => {
            ioServerOpts.serverInst.close()
          })
        }

        register.server(ioServerOpts, ioServerOpts.serverInst).catch((err) => {
          debug('error registering socket.io server', err)
        })
      }
    })

    includeDeps(nuxt, [
      'deepmerge',
      'socket.io-client',
      // '@socket.io/component-emitter',
      'engine.io-client',
      'debug',
      'tiny-emitter/instance.js'
    ])
    nuxt.options.build.transpile.push(__dirname)
    addPlugin({
      src: pResolve(__dirname, 'plugin.js')
    })
  }
})

export { register }
