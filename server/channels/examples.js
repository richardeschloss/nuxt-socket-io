function Svc() {
  return Object.freeze({
    getProgress({ notify, period }) {
      return new Promise((resolve) => {
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
    },
    resetSample({ notify }) {
      notify({
        evt: 'sample',
        data: 0
      })
    },
    'examples/sample': ({ data }) => {
      // eslint-disable-next-line no-console
      console.log('sample data rxd from client!', data)
      return Promise.resolve()
    },
    sample2({ data }) {
      // eslint-disable-next-line no-console
      console.log('sample2 data rxd from client!', data)
      return Promise.resolve()
    }
  })
}

module.exports = {
  Svc
}
