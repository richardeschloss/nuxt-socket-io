export default function(socket, io) {
  return {
    async echo(msg) {
      msg.data += ' from chat'
      return msg
    },
    me: {
      info: 'I am not a function. Do not register'
    },
    emitError({ notify, data }) {
      notify({ evt: 'dataAck', data })
      return Promise.reject({
        emitError: 'badRequest',
        msg: 'double check format'
      })
    }
  }
}
