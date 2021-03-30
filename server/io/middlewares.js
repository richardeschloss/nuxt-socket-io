// @ts-nocheck
/* eslint-disable no-console */
export const middlewares = {
  m1(socket, next) {
    console.log('m1 hit')
    // Must call next:
    next()
  },
  m2(socket, next) {
    console.log('m2 hit')
    // Must call next:
    next()
  }
}

export const setIO = (io) => {
  console.log('setIO')
}

export default function(socket, io) {
  return {
    getNamespaces() {
      return Object.keys(io.nsps)
    },
    echo(msg) {
      console.log('echo rxd', msg)
      return msg
    }
  }
}
