import http from 'http'
import path from 'path'
import consola from 'consola'
import ava from 'ava'
import ioClient from 'socket.io-client'
import { delay } from 'les-utils/utils/promise.js'
import Module, { register } from '../lib/module.js'
import { getModuleOptions, initNuxt, useNuxt } from './utils/module.js'

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

const waitForListening = server => new Promise(
  resolve => server.on('listening', resolve)
)

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

test('Module: various options', async (t) => {
  const dirs = []
  initNuxt()
  await Module({
    server: false,
    sockets: [{ name: 'home', url: 'https://localhost:3000' }]
  }, useNuxt())
  const nuxt1 = useNuxt()
  t.truthy(nuxt1.hooks['components:dirs'])
  t.truthy(nuxt1.hooks.listen)
  nuxt1.hooks['components:dirs'](dirs)
  nuxt1.hooks.listen(http.createServer())
  t.is(dirs[0].path, path.resolve('./lib/components'))
  t.is(dirs[0].prefix, 'io')
  const [pluginInfo] = nuxt1.options.plugins
  t.is(pluginInfo.src, path.resolve(srcDir, 'lib/plugin.js'))
  const { nuxtSocketIO } = nuxt1.options.runtimeConfig.public
  t.is(nuxtSocketIO.sockets[0].name, 'home')
  t.is(nuxtSocketIO.sockets[0].url, 'https://localhost:3000')

  const serverInst = http.createServer()
  const p = waitForListening(serverInst)
  const p2 = waitForClose(serverInst)
  serverInst.listen()
  initNuxt()
  await Module({
    ...io,
    server: { serverInst }
  }, useNuxt())
  await p
  const nuxt2 = useNuxt()
  nuxt2.hooks.listen(http.createServer())

  t.truthy(nuxt2.hooks.close)
  nuxt2.hooks.close()
  await p2
})

test('Module: edge cases', async (t) => {
  initNuxt()
  // @ts-ignore
  process.env.PORT = 5000
  await Module({}, useNuxt())
  useNuxt().hooks.listen(http.createServer())
  await delay(100)

  /* console shows listening at 5001 */
  await Module({}, useNuxt())
  useNuxt().hooks.listen(http.createServer())
  await delay(100)
  useNuxt().hooks.close()
  /* attempt to register server twice... error handler catches it (in coverage report) */
  t.pass()
})
