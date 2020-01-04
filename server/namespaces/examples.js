function Svc() {
  return Object.freeze({
    getProgress({ notify, period }) {
      return new Promise((resolve) => {
        let progress = 0
        const timer = setInterval(() => {
          progress += 10
          notify({ evt: 'progress', data: progress })
          if (progress === 100) {
            clearInterval(timer)
            resolve(progress)
          }
        }, period)
      })
    },
    echoBack({ notify, evt, data }) {
      notify({ evt, data })
      return Promise.resolve({ evt, data })
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
    },
    sample2b({ data: sample, notify }) {
      return new Promise((resolve) => {
        notify({
          evt: 'sample2bDataRxd',
          data: {
            msg: 'Sample2b data rxd on state change',
            sample
          }
        })
        resolve()
      })
    },
    sample3(msg) {
      const sample = msg.data || 'undef'
      return Promise.resolve({
        msg: 'rxd sample ' + sample
      })
    },
    sample4({ data: sample }) {
      return Promise.resolve({
        msg: 'rxd sample ' + sample
      })
    },
    sample5({ data: sample }) {
      return Promise.resolve({
        msg: 'rxd sample ' + sample
      })
    },
    receiveArray(msg) {
      return Promise.resolve({
        resp: 'Received array',
        length: msg.length
      })
    },
    receiveArray2(msg) {
      return Promise.resolve({
        resp: 'Received array2',
        length: msg.length
      })
    },
    receiveString(msg) {
      return Promise.resolve({
        resp: 'Received string',
        length: msg.length
      })
    },
    receiveString2(msg) {
      return Promise.resolve({
        resp: 'Received string again',
        length: msg.length
      })
    }
  })
}

module.exports = {
  Svc
}
