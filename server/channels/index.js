function Svc() {
  return Object.freeze({
    getMessage: ({ notify, ...data }) => {
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
    }
  })
}

module.exports = {
  Svc
}
