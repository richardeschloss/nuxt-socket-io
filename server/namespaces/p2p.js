/* Schemas */

/* API */
const api = {
  label: 'ioApi_page',
  version: 1.31
}

/* SVC */
function Svc(socket) {
  return Object.freeze({
    getAPI(msg) {
      console.log('getAPI', msg)
      return Promise.resolve(api)
    },

    /* Methods */
    sendEvts(msg) {
      console.log('sendEvts', msg)
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
          console.log('received resp', resp)
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
      console.log('received warnings', msg)
      return Promise.resolve(msg)
    },

    receiveMsg(msg) {
      console.log('[peer] receiveMsg', msg)
      return Promise.resolve({
        status: 'ok'
      })
    }
  })
}

module.exports = {
  Svc
}
