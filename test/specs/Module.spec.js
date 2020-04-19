import http from 'http'
import path from 'path'
import consola from 'consola'
import { serial as test } from 'ava'
import ioClient from 'socket.io-client'
import NuxtSocketMod, { register } from '@/io/module'
import { getModuleOptions } from '@/test/utils'

const srcDir = path.resolve('.')
const { io } = getModuleOptions('io/module', 'io')

const serverDflt = http.createServer()

function listen(server, port = 3000, host = 'localhost') {
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

function loadModule(moduleOptions, server) {
  consola.log('Testing with moduleOptions:', moduleOptions)
  let pluginInfo
  let hooksCalled = 0
  return new Promise((resolve) => {
    const evtMap = {
      close(fn) {
        fn()
        hooksCalled++
        handleDone()
      },
      async listen(fn) {
        await fn(server)
        console.log('here??')
        hooksCalled++
        handleDone()
      }
    }
    const hooksCnt = Object.keys(evtMap).length

    function handleDone() {
      if (pluginInfo) {
        if (moduleOptions.server) {
          if (hooksCalled === hooksCnt) {
            // if (server) server.close()
            resolve({ pluginInfo })
          }
        } else {
          resolve({ pluginInfo })
        }
      }
    }

    const context = {
      nuxt: {
        hook(evt, fn) {
          if (evtMap[evt]) {
            evtMap[evt](fn)
          }
        }
      },
      addPlugin(plugin) {
        pluginInfo = plugin
        handleDone()
      },
      options: {
        srcDir,
        modules: []
      },
      NuxtSocketMod
    }
    context.NuxtSocketMod(moduleOptions)
  })
}

function sendReceive({
  host = 'localhost',
  port = 3000,
  nsp = '',
  evt = 'echo',
  msg = {},
  listeners = [],
  notify = () => {}
}) {
  return new Promise((resolve) => {
    console.log('connect', nsp)
    const socket = ioClient(`http://${host}:${port}${nsp}`)
    listeners.forEach((listenEvt) => {
      socket.on(listenEvt, (data) => {
        notify(listenEvt, data)
      })
    })
    socket.emit(evt, msg, (resp) => {
      socket.close()
      resolve(resp)
    })
  })
}

test('Module: adds plugin, does not register IO server (simple config)', async (t) => {
  const moduleOptions = {
    sockets: [{ name: 'home', url: 'https://localhost:3000' }]
  }
  const { pluginInfo } = await loadModule(moduleOptions, serverDflt)
  const { ssr, src, fileName, options } = pluginInfo
  t.true(ssr)
  t.is(src, path.resolve(srcDir, 'io/plugin.js'))
  t.is(fileName, 'nuxt-socket-io.js')
  t.truthy(options.sockets)
  t.true(options.sockets.length > 0)
  options.sockets.forEach((s, idx) => {
    Object.entries(s).forEach(([key, entry]) => {
      t.is(entry, moduleOptions.sockets[idx][key])
    })
  })
})

test('Module: adds plugin, registers IO server (nuxt config)', async (t) => {
  const moduleOptions = Object.assign({}, io)
  const { pluginInfo } = await loadModule(moduleOptions, serverDflt)
  const { ssr, src, fileName, options } = pluginInfo
  t.true(ssr)
  t.is(src, path.resolve(srcDir, 'io/plugin.js'))
  t.is(fileName, 'nuxt-socket-io.js')
  t.truthy(options.sockets)
  t.true(options.sockets.length > 0)
  options.sockets.forEach((s, idx) => {
    Object.entries(s).forEach(([key, entry]) => {
      t.is(entry, moduleOptions.sockets[idx][key])
    })
  })
})

test('Module adds plugin correctly (nuxt config, server undefined)', async (t) => {
  const moduleOptions = Object.assign({}, io)
  const { pluginInfo } = await loadModule(moduleOptions)
  const { ssr, src, fileName, options } = pluginInfo
  t.true(ssr)
  t.is(src, path.resolve(srcDir, 'io/plugin.js'))
  t.is(fileName, 'nuxt-socket-io.js')
  t.truthy(options.sockets)
  t.true(options.sockets.length > 0)
  options.sockets.forEach((s, idx) => {
    Object.entries(s).forEach(([key, entry]) => {
      t.is(entry, moduleOptions.sockets[idx][key])
    })
  })
})

test('Register.server: server created if undef', async (t) => {
  let serverIn
  const server = await register.server(serverIn, {})
  t.truthy(server)
  t.true(server.listening)
  server.close()
})

test('Register.server: server already listening', async (t) => {
  await listen(serverDflt)
  const server = await register.server(serverDflt, {})
  t.truthy(server)
  t.true(server.listening)
  serverDflt.close()
})

test('Register.ioSvc (ioSvc does not exist)', async (t) => {
  const ioSvc = '/tmp/io/svc.js'
  await listen(serverDflt)
  await register.server(serverDflt, { ioSvc }).catch((err) => {
    const baseMsg = `Cannot find module '${ioSvc}'`
    t.true(err.message.startsWith(baseMsg))
  })
  serverDflt.close()
})

test('Register.ioSvc (ioSvc exists)', async (t) => {
  console.log('start next test!')
  const ioSvc = './io/index'
  await listen(serverDflt)
  await register.server(serverDflt, { ioSvc })
  const msg = { data: 'hello' }
  const resp = await sendReceive({ msg })
  t.is(resp.data, msg.data)
  serverDflt.close()
})

test('Register.ioSvc (ioSvc exists, default export undefined)', async (t) => {
  const ioSvc = './io/index.bad1'
  await listen(serverDflt)
  await register.server(serverDflt, { ioSvc }).catch((err) => {
    t.is(
      err.message,
      `io service at ${ioSvc} does not export a default "Svc()" function. Not registering`
    )
  })
  serverDflt.close()
})

test('Register.ioSvc (ioSvc exists, default export not a function)', async (t) => {
  const ioSvc = './io/index.bad2'
  await listen(serverDflt)
  await register.server(serverDflt, { ioSvc }).catch((err) => {
    t.is(
      err.message,
      `io service at ${ioSvc} does not export a default "Svc()" function. Not registering`
    )
  })
  serverDflt.close()
})

test('Register.nspSvc (nspDir does not exist)', async (t) => {
  const nspDir = '/tmp/io/notAvail'
  await listen(serverDflt)
  await register.server(serverDflt, { nspDir }).catch((err) => {
    t.is(
      err.message,
      `Namespace directory ${nspDir} does not exist. Not registering namespaces`
    )
  })
  serverDflt.close()
})

test('Register.nspSvc (nspDir exists, some nsp malformed)', async (t) => {
  const nspDir = './io/namespaces'
  const nspDirFull = path.resolve(nspDir)
  await listen(serverDflt)
  await register.server(serverDflt, { nspDir }).catch((err) => {
    console.log('HERE?', err.message)
    t.is(
      err.message,
      `Namespace directory ${nspDirFull} does not exist. Not registering namespaces`
    )
  })
  const msg = { data: 'hello' }
  const resp = await sendReceive({ nsp: '/chat', msg })
  t.is(resp.data, msg.data + ' from chat')
  const resp2 = await sendReceive({
    nsp: '/chat',
    evt: 'emitError',
    msg,
    listeners: ['dataAck'],
    notify(evt, data) {
      t.is(evt, 'dataAck')
      t.is(data, msg.data)
    }
  })
  t.is(resp2.emitError, 'badRequest')
  serverDflt.close()
})
