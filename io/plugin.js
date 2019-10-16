import io from 'socket.io-client'
import consola from 'consola'

const pluginOptions = <%= JSON.stringify(options) %>

function nuxtSocket({ ioOpts, store }) {
  const { name, channel = '', ...connectOpts } = ioOpts
  const { sockets } = pluginOptions

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

  if (vuexOpts && store) {
    const storeFns = {
      mutations: 'commit',
      actions: 'dispatch'
    }
    Object.entries(storeFns).forEach(([group, fn]) => {
      const groupOpts = vuexOpts[group]
      if (groupOpts.length && groupOpts.length > 0) {
        groupOpts.forEach((item) => {
          let evt, mappedItem = null
          if (typeof item === 'string'){
            evt = mappedItem = item
          } else {
            [ [evt, mappedItem] ] = Object.entries(item)
          }
          
          socket.on(evt, (data) => {
            store[fn](mappedItem, data)
          })
        })
      }
    })
  }

  socket.on('disconnect', () => {
    socket.close()
  })
  return socket
}

export default function(context, inject) {
  inject('nuxtSocket', nuxtSocket)
}
