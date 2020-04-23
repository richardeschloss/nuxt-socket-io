export default function Svc(socket, io) {
  return Object.freeze({
    getProgress({ period }) {
      return new Promise((resolve) => {
        let progress = 0
        const timer = setInterval(() => {
          progress += 10
          socket.emit('progress', { data: progress })
          if (progress === 100) {
            clearInterval(timer)
            resolve(progress)
          }
        }, period)
      })
    },
    echoBack({ evt, data }) {
      socket.emit(evt, data)
      return { evt, data }
    },
    echoHello({ evt, data }) {
      return { evt, data }
    },
    echoError({ evt, data }) {
      return Promise.reject({ emitError: 'ExampleError' })
    },
    'examples/sample': ({ data: sample }) => {
      socket.emit('sampleDataRxd', {
        data: {
          msg: 'Sample data rxd on state change',
          sample
        }
      })
    },
    'examples/someObj': ({ data }) => {
      return { msg: 'ok' }
    },
    sample2({ data: sample }) {
      socket.emit('sample2DataRxd', {
        data: {
          msg: 'Sample2 data rxd on state change',
          sample
        }
      })
    },
    sample2b({ data: sample }) {
      socket.emit('sample2bDataRxd', {
        data: {
          msg: 'Sample2b data rxd on state change',
          sample
        }
      })
    },
    sample3(msg) {
      const sample = msg.data || 'undef'
      return {
        msg: 'rxd sample ' + sample
      }
    },
    sample4({ data: sample }) {
      return {
        msg: 'rxd sample ' + sample
      }
    },
    sample5({ data: sample }) {
      return {
        msg: 'rxd sample ' + sample
      }
    },
    receiveArray(msg) {
      return {
        resp: 'Received array',
        length: msg.length
      }
    },
    receiveArray2(msg) {
      return {
        resp: 'Received array2',
        length: msg.length
      }
    },
    receiveString(msg) {
      return {
        resp: 'Received string',
        length: msg.length
      }
    },
    receiveString2(msg) {
      return {
        resp: 'Received string again',
        length: msg.length
      }
    },
    receiveUndef(msg) {}
  })
}
