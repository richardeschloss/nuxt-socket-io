function Svc() {
  function getMessage(msg) {
    return new Promise((resolve, reject) => {
      resolve('It worked! Received msg' + JSON.stringify(msg))
    })
  }

  return Object.freeze({
    getMessage
  })
}

module.exports = {
  Svc
}
