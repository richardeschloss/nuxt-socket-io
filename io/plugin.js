import io from 'socket.io-client'
import consola from 'consola'

function nuxtSocket(ioOpts) {
  const { name, channel = '', ...connectOpts } = ioOpts
  const { sockets } = <%= JSON.stringify(options) %>

  if( !sockets || sockets.length == 0 ){
    throw new Error("Please configure sockets if planning to use nuxt-socket-io: \r\n [{name: '', url: ''}]")
    return;
  }
  let useSocket = null;
  if (sockets && sockets.length && sockets.length > 0) {
    if (!name) {
      useSocket = sockets.find((s) => s.default === true)
    } else {
      useSocket = sockets.find((s) => s.name == name)
    }
  }

  if (!useSocket) {
    useSocket = sockets[0]
  }

  if( !useSocket.url ){
    throw new Error('URL must be defined for nuxtSocket')
    return;
  }

  useSocket.url += channel

  const socket = io(useSocket.url, connectOpts)
  consola.info('connect', useSocket.name, useSocket.url)
  socket.on('disconnect', () => {
    socket.close()
  })
  return socket
}

export default function(context, inject) {
  inject('nuxtSocket', nuxtSocket)
}
