import http from 'http'
import path from 'path'
import consola from 'consola'
import ava from 'ava'
import ioClient from 'socket.io-client'
import { delay } from 'les-utils/utils/promise.js'
import Module, { register } from '../lib/module.js'
import { getModuleOptions, wrapModule } from './utils/module.js'

const { serial: test } = ava
const srcDir = path.resolve('.')
const { io } = getModuleOptions('io/module', 'io')
const { listener: listen } = register

async function send ({
  host = 'localhost',
  port = 3000,
  nsp = '',
  evt = 'echo',
  msg = {},
  listeners = [],
  notify = () => {},
  emitTimeout = 1500
}) {
  consola.log('connect', nsp)
  const socket = ioClient(`http://${host}:${port}${nsp}`)
  listeners.forEach((listenEvt) => {
    socket.on(listenEvt, (data) => {
      notify(listenEvt, data)
    })
  })
  socket.emit(evt, msg)
  await delay(emitTimeout)
}

function sendReceive ({
  host = 'localhost',
  port = 3000,
  nsp = '',
  evt = 'echo',
  msg = {},
  listeners = [],
  notify = () => {},
  emitTimeout = 1500
}) {
  return new Promise((resolve, reject) => {
    consola.log('connect', nsp)
    const socket = ioClient(`http://${host}:${port}${nsp}`)
    listeners.forEach((listenEvt) => {
      socket.on(listenEvt, (data) => {
        // @ts-ignore
        notify(listenEvt, data)
      })
    })
    socket.emit(evt, msg,
      /**
      * @param {any} resp
      */
      (resp) => {
        socket.close()
        resolve(resp)
      })
    setTimeout(() => {
      socket.close()
      reject(new Error('emitTimeout'))
    }, emitTimeout)
  })
}

function validatePlugin ({ pluginInfo, options, t, moduleOptions }) {
  const { ssr, src, fileName } = pluginInfo
  t.true(ssr)
  t.is(src, path.resolve(srcDir, 'lib/plugin.js'))
  t.is(fileName, 'nuxt-socket-io.js')
  t.truthy(options.sockets)
  t.true(options.sockets.length > 0)
  options.sockets.forEach((s, idx) => {
    Object.entries(s).forEach(([key, entry]) => {
      t.is(entry, moduleOptions.sockets[idx][key])
    })
  })
}

const waitForClose = server => new Promise(
  resolve => server.listening ? server.on('close', resolve) : resolve()
)

test('Register.server: server created if undef', async (t) => {
  const { io, server } = await register.server({})
  t.truthy(server)
  t.true(server.listening)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.server: options undef', async (t) => {
  const { io, server } = await register.server()
  t.truthy(server)
  t.true(server.listening)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.server: server already listening', async (t) => {
  const serverIn = await listen()
  const { io, server } = await register.server({}, serverIn)
  t.true(server.listening)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc does not exist)', async (t) => {
  const ioSvc = '/tmp/ioNotHere'
  const { io, server } = await register.server({ ioSvc })
  const msg = { data: 'hello' }
  await sendReceive({ msg }).catch((err) => {
    t.is(err.message, 'emitTimeout')
  })
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, default export undefined)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io.bad1.js'
  const rootSvc = path.resolve(ioSvc)
  const { io, server, errs } = await register.server({ ioSvc }, serverIn)
  t.is(
    errs[0].message,
    `io service at ${rootSvc} does not export a default "Svc()" function. Not registering`
  )
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, default export not a function)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io.bad2.js'
  const rootSvc = path.resolve(ioSvc)
  const { io, server, errs } = await register.server({ ioSvc }, serverIn)
  t.is(
    errs[0].message,
      `io service at ${rootSvc} does not export a default "Svc()" function. Not registering`
  )
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, ok)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io'
  const { io, server } = await register.server({ ioSvc }, serverIn)
  const msg = { data: 'hello' }
  const resp = await sendReceive({ msg })
  t.is(resp.data, msg.data)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, .ts extension)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io.ts'
  const { io, server } = await register.server({ ioSvc }, serverIn)
  const resp = await sendReceive({ evt: 'tsTest' })
  t.is(resp, 'hi from io.ts')
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, .mjs extension)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io.mjs'
  const { io, server } = await register.server({ ioSvc }, serverIn)
  const resp = await sendReceive({ evt: 'mjsTest' })
  t.is(resp, 'hi from io.mjs')
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, middlewares defined)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io/middlewares'
  const { io, server } = await register.server({ ioSvc }, serverIn)
  const msg = { data: 'hello' }
  const resp = await sendReceive({ msg })
  t.is(resp.data, msg.data)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, ok, callback undef)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io'
  const { io, server } = await register.server({ ioSvc }, serverIn)
  const msg = { data: 'hello' }
  const resp = await send({ msg })
  t.falsy(resp)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.ioSvc (ioSvc exists, ok, strip off ".js" ext)', async (t) => {
  const serverIn = http.createServer()
  const ioSvc = './server/io.js'
  const { io, server } = await register.server({ ioSvc }, serverIn)
  const msg = { data: 'hello' }
  const resp = await sendReceive({ msg })
  t.is(resp.data, msg.data)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.nspSvc (nspDir does not exist)', async (t) => {
  const serverIn = http.createServer()
  const nspDir = '/tmp/io/notAvail'
  const { io, server } = await register.server({ ioSvc: '/tmp/ignore', nspDir }, serverIn)
  const msg = { data: 'hello' }
  await sendReceive({ nsp: '/chat', msg }).catch((err) => {
    t.is(err.message, 'emitTimeout')
  })
  io.close()
  server.close()
  await waitForClose(server)
})

test('Register.nspSvc (nspDir exists, some nsp malformed)', async (t) => {
  const serverIn = http.createServer()
  const nspDir = './server/io'
  const { io, server } = await register.server({ ioSvc: '/tmp/ignore', nspDir }, serverIn)
  const msg = { data: 'hello' }
  const resp = await sendReceive({ nsp: '/chat', msg })
  t.is(resp.data, msg.data + ' from chat')
  const evt = 'badRequest'
  const resp2 = await sendReceive({
    nsp: '/chat',
    evt,
    msg,
    listeners: ['dataAck'],
    notify (evt, data) {
      t.is(evt, 'dataAck')
      t.is(data, msg.data)
    }
  })
  t.is(resp2.emitError, 'double check format')
  t.is(resp2.evt, evt)
  io.close()
  server.close()
  await waitForClose(server)
})

test('Module: adds plugin, does not register IO server (simple config)', (t) => {
  const ctx = wrapModule(Module)
  const moduleOptions = {
    server: false,
    sockets: [{ name: 'home', url: 'https://localhost:3000' }]
  }
  ctx.Module(moduleOptions)
  const [pluginInfo] = ctx.options.plugins
  const { nuxtSocketIO: options } = ctx.options.publicRuntimeConfig
  validatePlugin({ pluginInfo, options, t, moduleOptions })
})

test('Module: adds plugin, registers IO server, if undef', (t) => {
  const ctx = wrapModule(Module)
  const moduleOptions = Object.assign({}, io)
  ctx.Module(moduleOptions)
  const [pluginInfo] = ctx.options.plugins
  const { nuxtSocketIO: options } = ctx.options.publicRuntimeConfig
  validatePlugin({ pluginInfo, options, t, moduleOptions })
})

test('Module: adds plugin, registers IO server (nuxt config)', (t) => {
  const ctx = wrapModule(Module)
  const serverIn = http.createServer()
  const moduleOptions = Object.assign({}, io)
  ctx.Module(moduleOptions)
  const [pluginInfo] = ctx.options.plugins
  const { nuxtSocketIO: options } = ctx.options.publicRuntimeConfig
  validatePlugin({ pluginInfo, options, t, moduleOptions })
  t.truthy(ctx.nuxt.hooks.listen)
  ctx.nuxt.hooks.listen(serverIn)

  return new Promise((resolve) => {
    serverIn.on('listening', () => {
      setTimeout(() => {
        t.truthy(ctx.nuxt.hooks.close)
        ctx.nuxt.hooks.close()
      }, 100)
    })
    serverIn.on('close', resolve)
  })
})

test('Module: adds components directory for this library', (t) => {
  const dirs = []
  const ctx = wrapModule(Module)
  ctx.Module({})
  ctx.nuxt.hooks['components:dirs'](dirs)
  t.is(dirs[0].path, path.resolve('./lib/components'))
  t.is(dirs[0].prefix, 'io')
})
