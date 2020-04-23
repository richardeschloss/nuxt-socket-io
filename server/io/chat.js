export default function(socket, io) {
  return {
    echo(msg) {
      msg.data += ' from chat'
      return msg
    },
    me: {
      info: 'I am not a function. Do not register'
    },
    badRequest({ data }) {
      socket.emit('dataAck', data)
      throw new Error('double check format')
    }
  }
}
