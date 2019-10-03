import io from 'socket.io-client'
import consola from 'consola'

function ioChannel(channel, { reconnection = false }) {
  const wsURL = process.env.WS_URL + channel
  const socket = io(wsURL, { reconnection })
  consola.log('connect', wsURL)
  socket.on('disconnect', () => {
    socket.close()
  })
  return socket
}

export default function(context, inject) {
  inject('ioChannel', ioChannel)
}
