const debug = require('debug')('nuxt-socket-io:dynamic')

/* Schemas */
const Item = {
  id: '',
  name: '',
  desc: ''
}

/* API */
const api = {
  version: 1.02,
  evts: {
    ignoreMe: {},
    someList: {
      methods: ['getList'],
      data: []
    },
    itemRxd: {
      methods: ['getItems', 'toBeAdded'],
      data: {
        progress: 0,
        item: {}
      }
    },
    msgRxd: {
      data: {
        date: new Date(),
        msg: ''
      }
    }
  },
  methods: {
    getItems: {
      resp: [Item]
    },
    getItem: {
      msg: {
        id: ''
      },
      resp: Item
    },
    noResp: {}
  }
}

/* SVC */
export default function(socket) {
  return Object.freeze({
    getAPI(data) {
      socket.emit('getAPI', {}, (clientApi) => {
        socket.emit(
          'receiveMsg',
          {
            date: new Date(),
            from: 'server1',
            to: 'client1',
            text: 'Hi client from server!'
          },
          (resp) => {
            debug('receiveMsg response', resp)
          }
        )
        socket.on('warnings', (msg) => {
          debug('warnings from client', msg)
        })
      })
      return Promise.resolve(api)
    },

    /* Methods */
    getItems() {
      const items = Array(4)
      let idx = 0
      return new Promise((resolve) => {
        const timer = setInterval(() => {
          items[idx] = {
            id: `item${idx}`,
            name: `Some Item ${idx}`,
            desc: `Some description ${idx}`
          }
          const item = items[idx]
          socket.emit('itemRxd', {
            method: 'getItems',
            data: {
              progress: ++idx / items.length,
              item
            }
          })
          socket.emit('itemRxd', {
            method: 'toBeDone',
            data: {}
          })
          if (idx >= items.length) {
            clearInterval(timer)
            resolve(items)
          }
        }, 500)
      })
    },
    getItem({ id }) {
      const data = {
        date: new Date(),
        msg: id
      }
      socket.emit('msgRxd', { data }, (resp) => {
        debug('ack received', resp)
      })
      const ItemOut = Object.assign(
        { ...Item },
        {
          id,
          name: 'Some Item',
          desc: 'Some description'
        }
      )
      return ItemOut
    },
    noResp() {
      return {}
    },
    badRequest() {
      throw new Error('badRequest...Input does not match schema')
    }
  })
}
