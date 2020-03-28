/* Schemas */
const ChatMsg = {
  date: new Date(),
  from: '',
  to: '',
  text: ''
}

const Item = {
  id: '',
  name: '',
  desc: ''
}

/* API */
const api = {
  version: 1.02,
  evts: {
    itemRxd: {
      methods: ['getItems'],
      data: {
        progress: 0,
        item: {}
      }
    },
    msgRxd: {
      data: {
        date: new Date(),
        msg: ''
      },
      ack: ''
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
    }
  }
}

const peerAPI = {
  label: 'ioApi_page',
  version: 1.31,
  evts: {
    warnings: {
      data: {
        lostSignal: false,
        battery: 0
      }
    }
  },
  methods: {
    receiveMsg: {
      msg: ChatMsg,
      resp: {
        status: ''
      }
    }
  }
}

/* SVC */
function Svc(socket) {
  return Object.freeze({
    getAPI(data) {
      console.log('getAPI', data)
      socket.emit('getAPI', {}, (clientApi) => {
        console.log('clientApi', clientApi)
      })
      return Promise.resolve(api)
    },

    getPeerAPI(data) {
      console.log('getPeerAPI', data)
      return Promise.resolve(peerAPI)
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
          if (idx >= items.length) {
            clearInterval(timer)
            resolve(items)
          }
        }, 500)
      })
    },
    getItem({ notify, id }) {
      console.log('received msg', id)
      const data = {
        date: new Date(),
        msg: id
      }
      socket.emit('msgRxd', { data }, (resp) => {
        console.log('ack received', resp)
      })
      const ItemOut = Object.assign(
        { ...Item },
        {
          id,
          name: 'Some Item',
          desc: 'Some description'
        }
      )
      return Promise.resolve(ItemOut)
    }
  })
}

module.exports = {
  Svc
}
