/*
 * Copyright 2019 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import io from 'socket.io-client'
import consola from 'consola'

function PluginOptions() {
  let _pluginOptions
  const svc = {}
  if (process.env.TEST) {
    svc.get = () => (_pluginOptions)
    svc.set = (opts) => _pluginOptions = opts
  } else {
    svc.get = () => (<%= JSON.stringify(options) %>)
  }
  return Object.freeze(svc)
}

const _pOptions = PluginOptions()

function nuxtSocket(ioOpts) {
  const { name, channel = '', ...connectOpts } = ioOpts
  const pluginOptions = _pOptions.get()
  const { sockets } = pluginOptions
  const { $store: store } = this

  if (
    !sockets ||
    sockets.constructor.name !== 'Array' ||
    sockets.length === 0
  ) {
    throw new Error(
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  }

  let useSocket = null
  if (!name) {
    useSocket = sockets.find((s) => s.default === true)
  } else {
    useSocket = sockets.find((s) => s.name === name)
  }

  if (!useSocket) {
    useSocket = sockets[0]
  }

  if (!useSocket.url) {
    throw new Error('URL must be defined for nuxtSocket')
  }

  if (!useSocket.registeredWatchers) {
    useSocket.registeredWatchers = []
  }

  const { vuex: vuexOpts } = useSocket
  useSocket.url += channel

  const socket = io(useSocket.url, connectOpts)
  consola.info('connect', useSocket.name, useSocket.url)

  if (vuexOpts) {
    const storeFns = {
      mutations: 'commit',
      actions: 'dispatch'
    }
    Object.entries(storeFns).forEach(([group, fn]) => {
      const groupOpts = vuexOpts[group]
      if (
        groupOpts &&
        groupOpts.constructor.name === 'Array' &&
        groupOpts.length > 0
      ) {
        groupOpts.forEach((item) => {
          let evt = null
          let mappedItem = null
          if (typeof item === 'string') {
            evt = mappedItem = item
          } else {
            ;[[evt, mappedItem]] = Object.entries(item)
          }

          socket.on(evt, (data) => {
            store[fn](mappedItem, data)
          })
        })
      }
    })

    const { emitBacks } = vuexOpts
    if (emitBacks && emitBacks.length) {
      emitBacks.forEach((emitBack) => {
        let evt = null
        let statePropsPath = null
        if (typeof emitBack === 'string') {
          evt = statePropsPath = emitBack
        } else {
          ;[[statePropsPath, evt]] = Object.entries(emitBack)
        }

        if (useSocket.registeredWatchers.includes(statePropsPath)) {
          return
        }
        
        const stateProps = statePropsPath.split('/')
        this.$store.watch(
          (state) => {
            const out = Object.assign({}, state)
            const missingProps = []
            const watchProp = stateProps.reduce((outProp, prop) => {
              if (!outProp || !outProp[prop]) {
                missingProps.push(prop)
                return 
              }
              outProp = outProp[prop]
              return outProp
            }, out)
            if (missingProps.length > 0) {
              const errEmitBack = missingProps.join('/')
              throw new Error([
                `[nuxt-socket-io]: Trying to register emitback ${errEmitBack} failed`,
                `because it is not defined in Vuex.`,
                'Is state set up correctly in your stores folder?'
              ].join('\n'))
            }

            if (
              typeof watchProp === 'object' &&
              Object.prototype.hasOwnProperty.call(watchProp, '__ob__')
            ) {
              const errMsg =
                `${emitBack} is a vuex module. You probably want to watch its properties`
              throw new Error(errMsg)
            }
            useSocket.registeredWatchers.push(statePropsPath)
            return watchProp
          },
          (data) => {
            socket.emit(evt, { data })
          }
        )
      })
    }
  }

  socket.on('disconnect', () => {
    socket.close()
  })
  return socket
}

export default function(context, inject) {
  inject('nuxtSocket', nuxtSocket)
}

export let pOptions
if (process.env.TEST) {
  pOptions = {}
  Object.assign(pOptions, _pOptions)
}
