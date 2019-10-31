/*
 * Copyright 2019 Richard Schloss (https://github.com/richardeschloss/nuxt-socket-io)
 */

import io from 'socket.io-client'
import consola from 'consola'

function nuxtSocket(ioOpts) {
  const { name, channel = '', ...connectOpts } = ioOpts
  const pluginOptions = <%= JSON.stringify(options) %>
  const { sockets } = pluginOptions
  const { $store: store } = this

  if (!sockets || sockets.length === 0) {
    throw new Error(
      "Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]"
    )
  }

  let useSocket = null
  if (sockets && sockets.length && sockets.length > 0) {
    if (!name) {
      useSocket = sockets.find((s) => s.default === true)
    } else {
      useSocket = sockets.find((s) => s.name === name)
    }
  }

  if (!useSocket) {
    useSocket = sockets[0]
  }

  if (!useSocket.url) {
    throw new Error('URL must be defined for nuxtSocket')
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
      if (groupOpts.length && groupOpts.length > 0) {
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
        let stateProps = null
        if (typeof emitBack === 'string') {
          evt = stateProps = emitBack
        } else {
          ;[[stateProps, evt]] = Object.entries(emitBack)
        }
        stateProps = stateProps.split('/')
        this.$store.watch(
          (state) => {
            const out = Object.assign({}, state)
            const watchProp = stateProps.reduce((outProp, prop) => {
              outProp = outProp[prop]
              return outProp
            }, out)

            if (
              typeof watchProp === 'object' &&
              Object.prototype.hasOwnProperty.call(watchProp, '__ob__')
            ) {
              const errMsg = `${emitBack} is a vuex module. You probably want to watch its properties`
              throw new Error(errMsg)
            }
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
