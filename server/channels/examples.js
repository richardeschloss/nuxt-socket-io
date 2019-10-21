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
    'examples/sample': ({ data: sample, notify }) => {
      return new Promise((resolve) => {
        notify({
          evt: 'sampleDataRxd',
          data: {
            msg: 'Sample data rxd on state change',
            sample
          }
        })
        resolve()
      })
    },
    sample2({ data: sample, notify }) {
      return new Promise((resolve) => {
        notify({
          evt: 'sample2DataRxd',
          data: {
            msg: 'Sample2 data rxd on state change',
            sample
          }
        })
        resolve()
      })
    }
  })
}

module.exports = {
  Svc
}
