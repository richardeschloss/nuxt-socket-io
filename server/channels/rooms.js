const rooms = ['vueJS', 'nuxtJS']

function Svc(socket, io) {
  return Object.freeze({
    getRooms() {
      return Promise.resolve(rooms)
    }
  })
}

module.exports = {
  Svc
}
