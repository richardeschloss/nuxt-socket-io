import { resolve as pResolve } from 'path'
const { default: Data } = require(pResolve('./server/db'))

const API = {
  version: 1.0,
  evts: {
    users: {
      data: ['']
    },
    userJoined: {
      data: ''
    },
    userLeft: {
      data: ''
    }
  },
  methods: {
    join: {
      msg: {
        room: '',
        user: ''
      },
      resp: {
        room: '',
        channels: ['']
      }
    },
    leave: {
      msg: {
        room: '',
        user: ''
      }
    }
  }
}

/**
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
export default function Svc(socket, io) {
  const roomSvc = Object.freeze({
    getAPI() {
      return API
    },
    getRoom({ room }) {
      if (room === undefined) {
        throw new Error(`Room name not specified`)
      }
      const fndRoom = Data.rooms.find(({ name }) => name === room)
      if (fndRoom === undefined) {
        throw new Error(`Room ${room} not found`)
      }
      return fndRoom
    },
    join({ room, user }) {
      const fndRoom = roomSvc.getRoom({ room })
      if (!fndRoom.users) {
        fndRoom.users = []
      }
      if (!fndRoom.users.includes(user)) {
        fndRoom.users.push(user)
      }

      const namespace = `rooms/${room}`
      socket.once('disconnect', () => {
        roomSvc.leave({ room, user })
      })

      // socket.io v3: socket.join now synchronous
      socket.join(namespace)
      socket.to(namespace).emit('userJoined', { data: user })
      socket.to(namespace).emit('users', { data: fndRoom.users })
      socket.emit('users', { data: fndRoom.users })
      return {
        room,
        channels: fndRoom.channels.map(({ name }) => name)
      }
    },
    leave({ room, user }) {
      const fndRoom = roomSvc.getRoom({ room })
      if (!fndRoom) {
        throw new Error(`room ${room} not found`)
      }

      if (fndRoom.users && fndRoom.users.includes(user)) {
        const userIdx = fndRoom.users.findIndex((u) => u === user)
        fndRoom.users.splice(userIdx, 1)
      }

      const namespace = `rooms/${room}`
      // socket.io v3: socket.leave now synchronous
      socket.leave(namespace)
      socket.to(namespace).emit('userLeft', { data: user })
      socket.to(namespace).emit('users', { data: fndRoom.users })
      socket.emit('users', { data: fndRoom.users })
    }
  })
  return roomSvc
}
