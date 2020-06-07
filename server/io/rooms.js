import { resolve as pResolve } from 'path'
const { default: Data } = require(pResolve('./server/db'))

const API = {
  version: 1.0,
  methods: {
    getRooms: {
      resp: ['']
    }
  }
}

export default function Svc(socket, io) {
  return Object.freeze({
    getAPI() {
      return API
    },
    getRooms(msg) {
      return Data.rooms.map(({ name }) => name )
    }
  })
}
