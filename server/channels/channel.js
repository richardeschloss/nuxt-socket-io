const rooms = {
  vueJS: {
    general: {
      chats: [],
      users: []
    },
    funStuff: {
      chats: [],
      users: []
    }
  },
  nuxtJS: {
    general: {
      chats: [],
      users: []
    },
    help: {
      chats: [],
      users: []
    }
  }
}

function Svc(socket, io) {
  return Object.freeze({
    joinChannel({ room, channel, user }) {
      const fndRoom = rooms[room]
      if (!fndRoom) {
        return Promise.reject(new Error(`room ${room} not found`))
      }

      const fndChannel = fndRoom[channel]
      if (!fndChannel) {
        return Promise.reject(new Error(`channel ${channel} not found`))
      }

      return new Promise((resolve, reject) => {
        const namespace = `rooms/${room}/${channel}`
        socket.join(namespace, () => {
          const resp = { room: fndRoom, channel: fndChannel, user, namespace }
          socket.to(namespace).emit('joinedChannel', resp)
          resolve(resp)
        })
      })
    },
    sendMsg({ inputMsg, room, channel, user, namespace }) {
      rooms[room][channel].chats.push({
        user,
        inputMsg,
        timestamp: Date.now()
      })
      socket.to(namespace).emit('chatMessage', inputMsg)
      return Promise.resolve(inputMsg)
    }
  })
}

module.exports = {
  Svc
}
