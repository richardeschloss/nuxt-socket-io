const rooms = {
  vueJS: {
    channels: {
      general: {},
      funStuff: {}
    }
  },
  nuxtJS: {
    channels: {
      general: {},
      help: {},
      jobs: {}
    }
  }
}

Object.entries(rooms).forEach(([room, roomInfo]) => {
  roomInfo.users = []
  Object.entries(roomInfo.channels).forEach(([channel, channelInfo]) => {
    channelInfo.users = []
    channelInfo.chats = []
  })
})

export default function Svc(socket, io) {
  return Object.freeze({
    getRooms() {
      return Promise.resolve(Object.keys(rooms))
    }
  })
}

export function getRoom(room) {
  const fndRoom = rooms[room]
  if (fndRoom === undefined) {
    throw new Error(`Room ${room} not found`)
  }
  return fndRoom
}
