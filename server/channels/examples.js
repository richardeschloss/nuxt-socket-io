function Svc() {
  return Object.freeze({
    getProgress: ({ notify, period }) => {
      return new Promise((resolve, reject) => {
        let progress = 0
        const timer = setInterval(() => {
          notify({ evt: 'progress', data: progress })
          progress += 10
          if (progress === 100) {
            clearInterval(timer)
            resolve(progress)
          }
        }, period)
      })
    }
  })
}

module.exports = {
  Svc
}
