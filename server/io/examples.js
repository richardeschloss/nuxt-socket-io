import consola from 'consola'

export const middlewares = {
  m1 (_, next) {
    consola.log('m1 in examples namespace')
    next()
  }
}

export default function Svc (socket, io) {
  return Object.freeze({
    getProgress ({ period }) {
      return new Promise((resolve) => {
        let progress = 0
        const timer = setInterval(() => {
          progress += 10
          socket.emit('progress', progress)
          if (progress === 100) {
            clearInterval(timer)
            resolve(progress)
          }
        }, period)
      })
    },
    echoBack (msg = {}) {
      const { evt = 'echoBack', data = evt } = msg
      socket.emit(evt, data)
      return { evt, data }
    },
    echoHello (data) {
      return { evt: 'echoHello', data: 'hello' }
    },
    echoError () {
      throw new Error('ExampleError')
    },
    'examples/sample' (sample) {
      console.log('examples/sample rxd', sample)
      socket.emit('sampleDataRxd', {
        data: {
          msg: 'Sample data rxd on state change',
          sample
        }
      })
    },
    echo ({ evt, msg }) {
      socket.emit(evt, msg)
    },
    'examples/someObj' (data) {
      consola.log('someObj received!', data)
      socket.emit('examples/someObjRxd', data)
      return { msg: 'ok' }
    },
    sample2 ({ data: sample }) {
      socket.emit('sample2DataRxd', {
        data: {
          msg: 'Sample2 data rxd on state change',
          sample
        }
      })
    },
    sample2b ({ data: sample }) {
      socket.emit('sample2bDataRxd', {
        data: {
          msg: 'Sample2b data rxd on state change',
          sample
        }
      })
    },
    sample3 (msg) {
      console.log('sample3', msg)
      const { data: sample } = msg || {}
      return {
        msg: 'rxd sample ' + (sample || 'undef')
      }
    },
    sample4 ({ data: sample }) {
      console.log('sample4 rxd', sample)
      return {
        msg: 'rxd sample ' + sample
      }
    },
    sample5 ({ data: sample }) {
      return {
        msg: 'rxd sample ' + sample
      }
    },
    receiveArray (msg) {
      return {
        resp: 'Received array',
        length: msg.length
      }
    },
    receiveArray2 (msg) {
      return {
        resp: 'Received array2',
        msg
      }
    },
    receiveString (msg) {
      return {
        resp: 'Received string',
        length: msg.length
      }
    },
    receiveString2 (msg) {
      return {
        resp: 'Received string again',
        length: msg.length
      }
    },
    receiveUndef (msg) {}
  })
}
