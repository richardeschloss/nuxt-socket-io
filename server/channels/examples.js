function Svc() {
  function getProgress({ notify, period }) {
    return new Promise((resolve, reject) => {
      let progress = 0
      const timer = setInterval(() => {
        notify(progress)
        progress += 10
        if (progress >= 100) {
          clearInterval(timer)
          resolve()
        }
      }, period)
    })
  }

  return Object.freeze({
    getProgress
  })
}

module.exports = {
  Svc
}
