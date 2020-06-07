import { resolve as pResolve } from 'path'
const { ChatMsg } = require(pResolve('./server/apis'))
const { default: RoomSvc } = require(pResolve('./server/io/room'))

const API = {
  version: 1.0,
  evts: {
    chat: {
      data: ChatMsg
    },
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
        channel: '',
        user: ''
      },
      resp: {
        room: '',
        channel: '',
        chats: [ChatMsg]
      }
    },
    leave: {
      msg: {
        room: '',
        channel: '',
        user: ''
      }
    },
    sendMsg: {
      msg: {
        room: '',
        channel: '',
        inputMsg: '',
        user: ''
      }
    }
  }
}

const roomSvc = RoomSvc()
const chatLimit = 100

export default function(socket, io) {
  const channelSvc = Object.freeze({
    getAPI() {
      return API
    },
    getChannel(room, channel) {
      const fndRoom = roomSvc.getRoom({ room })
      if (fndRoom.channels === undefined) {
        throw new Error(`Channels not found in ${room}`)
      }
      const fndChannel = fndRoom.channels.find(({ name }) => name === channel)
      if (fndChannel === undefined) {
        throw new Error(`Channel ${channel} not found in room ${room}`)
      }
      return fndChannel
    },
    join({ room, channel, user }) {
      const fndChannel = channelSvc.getChannel(room, channel)

      return new Promise((resolve, reject) => {
        if (!fndChannel.users.includes(user)) {
          fndChannel.users.push(user)
        }

        const { users, chats } = fndChannel
        const namespace = `rooms/${room}/${channel}`
        socket.join(namespace, () => {
          socket.to(namespace).emit('userJoined', { data: user })
          socket.to(namespace).emit('users', { data: users })
          socket.emit('users', { data: users })
          resolve({ room, channel, chats })
        })
        socket.once('disconnect', () => {
          channelSvc.leave({ room, channel, user })
        })
      })
    },
    leave({ room, channel, user }) {
      const fndChannel = channelSvc.getChannel(room, channel)
      return new Promise((resolve, reject) => {
        if (fndChannel.users.includes(user)) {
          const userIdx = fndChannel.users.findIndex((u) => u === user)
          fndChannel.users.splice(userIdx, 1)
        }

        const { users } = fndChannel
        const namespace = `rooms/${room}/${channel}`
        socket.leave(namespace, () => {
          socket.to(namespace).emit('userLeft', { data: user })
          socket.to(namespace).emit('users', { data: users })
          socket.emit('users', { data: users })
          resolve()
        })
      })
    },
    sendMsg({ inputMsg, room, channel, user }) {
      if (!inputMsg || inputMsg === '') {
        throw new Error('no input msg rxd')
      }
      const fndChannel = channelSvc.getChannel(room, channel)
      const chatMsg = {
        user,
        inputMsg,
        timestamp: Date.now()
      }
      if (fndChannel.chats.length > chatLimit) {
        fndChannel.chats = fndChannel.chats.splice(Math.floor(chatLimit / 2))
      }

      fndChannel.chats.push(chatMsg)
      const namespace = `rooms/${room}/${channel}`
      socket.to(namespace).emit('chat', { data: chatMsg })
      socket.emit('chat', { data: chatMsg })
      return Promise.resolve()
    }
  })

  return channelSvc
}
