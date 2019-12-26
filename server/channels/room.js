const rooms = {
  vueJS: {
    channels: ['general', 'funStuff'],
    users: []
  },
  nuxtJS: {
    users: [],
    channels: ['general', 'help', 'jobs']
  }
}

function Svc(socket, io) {
  return Object.freeze({
    joinRoom({ room, user }) {
      const fndRoom = rooms[room]
      if (!fndRoom) {
        return Promise.reject(new Error(`room ${room} not found`))
      }
      return new Promise((resolve, reject) => {
        if (!fndRoom.users.includes(user)) {
          fndRoom.users.push(user)
        }

        const namespace = `rooms/${room}`
        socket.join(namespace, () => {
          const resp = { room: fndRoom, user, namespace }
          socket.to(namespace).emit('joinedRoom', resp)
          resolve(resp)
        })
      })
    }
  })
}

module.exports = {
  Svc
}
