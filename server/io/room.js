const { getRoom } = require('./rooms')

export default function Svc(socket, io) {
  const roomSvc = Object.freeze({
    joinRoom({ room, user }) {
      const fndRoom = getRoom(room)
      if (!fndRoom) {
        return Promise.reject(new Error(`room ${room} not found`))
      }
      return new Promise((resolve, reject) => {
        if (!fndRoom.users.includes(user)) {
          fndRoom.users.push(user)
        }

        const namespace = `rooms/${room}`
        const channels = Object.keys(fndRoom.channels)
        const { users } = fndRoom
        socket.join(namespace, () => {
          const resp = { room, users, channels, user, namespace }
          socket.to(namespace).emit('joinedRoom', resp)
          resolve(resp)
        })
        socket.on('disconnect', () => {
          roomSvc.leaveRoom({ room, user })
        })
      })
    },
    leaveRoom({ room, user }) {
      const fndRoom = getRoom(room)
      if (!fndRoom) {
        return Promise.reject(new Error(`room ${room} not found`))
      }
      return new Promise((resolve, reject) => {
        if (fndRoom.users.includes(user)) {
          const userIdx = fndRoom.users.findIndex((u) => u === user)
          fndRoom.users.splice(userIdx, 1)
        }

        const namespace = `rooms/${room}`
        const { users } = fndRoom
        socket.leave(namespace, () => {
          const resp = { room: fndRoom, users, user, namespace }
          socket.to(namespace).emit('leftRoom', resp)
          resolve(resp)
        })
      })
    }
  })
  return roomSvc
}

export function getChannel(room, channel) {
  const fndRoom = getRoom(room)
  if (fndRoom === undefined) {
    throw new Error(`Room ${room} not found`)
  }

  if (fndRoom.channels === undefined) {
    throw new Error(`Channels not found in ${room}`)
  }
  return fndRoom.channels[channel]
}
