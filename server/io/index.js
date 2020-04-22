export default function Svc() {
  return Object.freeze({
    getMessage({ notify, ...data }) {
      return new Promise((resolve, reject) => {
        const msgs = [
          'Hi, this is a chat message from IO server!',
          'Hi, this is another chat message from IO server!'
        ]
        let msgIdx = 0
        const timer = setInterval(() => {
          notify({ evt: 'chatMessage', data: msgs[msgIdx] })
          if (++msgIdx >= msgs.length) {
            clearInterval(timer)
            resolve('It worked! Received msg: ' + JSON.stringify(data))
          }
        }, 500)
      })
    },
    getMessage2({ notify, ...data }) {
      return new Promise((resolve, reject) => {
        const msgs = [
          'Hi, this is a chat message from IO server!',
          'Hi, this is another chat message from IO server!'
        ]
        let msgIdx = 0
        notify({ evt: 'chatMessage4', data: 'Hi again' })
        notify({ evt: 'chatMessage5', data: 'Hi again from 5' })
        const timer = setInterval(() => {
          notify({ evt: 'chatMessage2', data: msgs[msgIdx] })
          notify({ evt: 'chatMessage3', data: 'sending chat message3...' })
          if (++msgIdx >= msgs.length) {
            clearInterval(timer)
            resolve('It worked! Received msg: ' + JSON.stringify(data))
          }
        }, 500)
      })
    },
    echoBack({ notify, evt, data }) {
      notify({ evt, data })
      return Promise.resolve()
    },
    titleFromUser(msg) {
      return Promise.resolve({
        data: `received msg ${msg}!`
      })
    }
  })
}
