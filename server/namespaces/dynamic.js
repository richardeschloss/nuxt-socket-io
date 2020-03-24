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
    itemRxd: {
      method: '',
      data: {}
    },
    progress: {
      method: '',
      data: 0
    },
    msgRxd: {
      data: '',
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

/* SVC */
function Svc(socket) {
  return Object.freeze({
    getAPI({ version }) {
      console.log('getAPI', version)
      return Promise.resolve(api)
    },

    /* Methods */
    getItems() {
      return new Promise((resolve) => {
        const items = Array(4)
        let idx = 0
        const timer = setInterval(() => {
          items[idx] = {
            id: `item${idx}`,
            name: `Some Item ${idx}`,
            desc: `Some description ${idx}`
          }
          socket.emit('itemRxd', { method: 'getItems', data: items[idx] })
          socket.emit('progress', {
            method: 'getItems',
            data: ++idx / items.length
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
      socket.emit('msgRxd', { data: id }, (resp) => {
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
