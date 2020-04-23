const debug = require('debug')('nuxt-socket-io:p2p')

/* API */
const api = {
  label: 'ioApi_page',
  version: 1.31
}

/* SVC */
export default function Svc(socket) {
  return Object.freeze({
    getAPI(msg) {
      debug('getAPI', msg)
      return Promise.resolve(api)
    },

    /* Methods */
    sendEvts(msg) {
      debug('sendEvts', msg)
      return new Promise((resolve) => {
        let doneCnt = 0
        const expCnt = 3
        const testMsg = {
          date: new Date(),
          from: 'server1',
          to: 'client1',
          text: 'Hi client from server!'
        }

        function handleResp(resp) {
          debug('received resp', resp)
          doneCnt++
          if (doneCnt === expCnt) {
            resolve()
          }
        }
        socket.emit('getAPI')
        socket.emit('getAPI', {}, handleResp)
        socket.emit('receiveMsg', testMsg)
        socket.emit('receiveMsg', testMsg, handleResp)
        socket.emit('undefMethod', testMsg)
        socket.emit('undefMethod', testMsg, handleResp)
      })
    },

    warnings(msg) {
      debug('received warnings', msg)
      return msg
    },

    receiveMsg(msg) {
      debug('[peer] receiveMsg', msg)
      return {
        status: 'ok'
      }
    }
  })
}
