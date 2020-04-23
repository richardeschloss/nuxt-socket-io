const { getChannel } = require('./room')

export default function(socket, io) {
  const channelSvc = Object.freeze({
    joinChannel({ room, channel, user }) {
      const fndChannel = getChannel(room, channel)
      if (!fndChannel) {
        return Promise.reject(new Error(`channel ${channel} not found`))
      }

      return new Promise((resolve, reject) => {
        if (!fndChannel.users.includes(user)) {
          fndChannel.users.push(user)
        }

        const { users, chats } = fndChannel
        const namespace = `rooms/${room}/${channel}`
        socket.join(namespace, () => {
          const resp = { room, channel, chats, users, user, namespace }
          socket.to(namespace).emit('joinedChannel', resp)
          resolve(resp)
        })
        socket.on('disconnect', () => {
          channelSvc.leaveChannel({ room, channel, user })
        })
      })
    },
    leaveChannel({ room, channel, user }) {
      const fndChannel = getChannel(room, channel)
      if (!fndChannel) {
        return Promise.reject(new Error(`channel ${channel} not found`))
      }

      return new Promise((resolve, reject) => {
        if (fndChannel.users.includes(user)) {
          const userIdx = fndChannel.users.findIndex((u) => u === user)
          fndChannel.users.splice(userIdx, 1)
        }

        const { users } = fndChannel
        const namespace = `rooms/${room}/${channel}`
        socket.leave(namespace, () => {
          const resp = { room, channel, users, user, namespace }
          socket.to(namespace).emit('leftChannel', resp)
          resolve(resp)
        })
      })
    },
    sendMsg({ inputMsg, room, channel, user, namespace }) {
      const fndChannel = getChannel(room, channel)
      const chatMsg = {
        user,
        inputMsg,
        timestamp: Date.now()
      }
      fndChannel.chats.push(chatMsg)
      socket.to(namespace).emit('chatMessage', chatMsg)
      return Promise.resolve(chatMsg)
    }
  })

  return channelSvc
}
