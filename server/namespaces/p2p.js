/* Schemas */

/* API */
const api = {
  label: 'ioApi_page',
  version: 1.31
}

/* SVC */
function Svc(socket) {
  return Object.freeze({
    getAPI(data) {
      console.log('getAPI', data)
      return Promise.resolve(api)
    },

    /* Methods */
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
