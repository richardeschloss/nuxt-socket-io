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
      return new Promise((resolve) => {
        if (!fndRoom.users) {
          fndRoom.users = []
        }
        if (!fndRoom.users.includes(user)) {
          fndRoom.users.push(user)
        }

        const namespace = `rooms/${room}`
        socket.join(namespace, () => {
          socket.to(namespace).emit('userJoined', { data: user })
          socket.to(namespace).emit('users', { data: fndRoom.users })
          socket.emit('users', { data: fndRoom.users })
          resolve({
            room,
            channels: fndRoom.channels.map(({ name }) => name)
          })
        })

        socket.once('disconnect', () => {
          roomSvc.leave({ room, user })
        })
      })
    },
    leave({ room, user }) {
      const fndRoom = roomSvc.getRoom({ room })
      if (!fndRoom) {
        throw new Error(`room ${room} not found`)
      }
      return new Promise((resolve, reject) => {
        if (fndRoom.users && fndRoom.users.includes(user)) {
          const userIdx = fndRoom.users.findIndex((u) => u === user)
          fndRoom.users.splice(userIdx, 1)
        }

        const namespace = `rooms/${room}`
        socket.leave(namespace, () => {
          socket.to(namespace).emit('userLeft', { data: user })
          socket.to(namespace).emit('users', { data: fndRoom.users })
          socket.emit('users', { data: fndRoom.users })
          resolve()
        })
      })
    }
  })
  return roomSvc
}
