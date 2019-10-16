function Svc() {
  return Object.freeze({
    getMessage: (msg) => {
      return new Promise((resolve, reject) => {
        resolve('It worked! Received msg: ' + JSON.stringify(msg))
      })
    }
  })
}

module.exports = {
  Svc
}
