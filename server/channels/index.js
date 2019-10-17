function Svc() {
  return Object.freeze({
    getMessage: ({ notify, ...data }) => {
      const msgs = [
        'Hi, this is a chat message from IO server!',
        'Hi, this is another chat message from IO server!'
      ]
      let msgIdx = 0
      const timer = setInterval(() => {
        notify({ evt: 'chatMessage', data: msgs[msgIdx] })
        if (++msgIdx >= msgs.length) {
          clearInterval(timer)
        }
      }, 500)
      return new Promise((resolve, reject) => {
        resolve('It worked! Received msg: ' + JSON.stringify(data))
      })
    }
  })
}

module.exports = {
  Svc
}
