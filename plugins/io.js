import io from 'socket.io-client'
import consola from 'consola'

function nuxtSocket(ioOpts) {
  const { name, channel, ...connectOpts } = ioOpts
  const { sockets } = <%= JSON.stringify(options) %>
  let useSocket;
  if (sockets && sockets.length && sockets.length > 0) {
    if (!name) {
      useSocket = sockets.find((s) => s.dflt === true )
      if (!useSocket) {
        useSocket = sockets[0]
      }
    }
  }

  useSocket.url = useSocket.url || process.env.wsURL
  if( !useSocket.url ){
    throw new Error('URL must be defined for nuxtSocket')
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
