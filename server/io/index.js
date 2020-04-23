export default function Svc(socket, io) {
  return Object.freeze({
    getMessage(data) {
      return new Promise((resolve, reject) => {
        const msgs = [
          'Hi, this is a chat message from IO server!',
          'Hi, this is another chat message from IO server!'
        ]
        let msgIdx = 0
        const timer = setInterval(() => {
          socket.emit('chatMessage', msgs[msgIdx])
          if (++msgIdx >= msgs.length) {
            clearInterval(timer)
            resolve('It worked! Received msg: ' + JSON.stringify(data))
          }
        }, 500)
      })
    },
    getMessage2(data) {
      return new Promise((resolve, reject) => {
        const msgs = [
          'Hi, this is a chat message from IO server!',
          'Hi, this is another chat message from IO server!'
        ]
        let msgIdx = 0
        socket.emit('chatMessage4', { data: 'Hi again' })
        socket.emit('chatMessage5', { data: 'Hi again from 5' })
        const timer = setInterval(() => {
          socket.emit('chatMessage2', msgs[msgIdx])
          socket.emit('chatMessage3', 'sending chat message3...')
          if (++msgIdx >= msgs.length) {
            clearInterval(timer)
            resolve('It worked! Received msg: ' + JSON.stringify(data))
          }
        }, 500)
      })
    },
    echoBack({ evt, data }) {
      socket.emit(evt, data)
      return { evt, data }
    },
    titleFromUser(msg) {
      return {
        data: `received msg ${msg}!`
      }
    }
  })
}
