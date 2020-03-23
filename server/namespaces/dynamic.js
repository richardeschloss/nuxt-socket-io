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
    msgRxd: {},
    progress: 0
  },
  methods: {
    getItems: {
      evts: {
        progress: 0
      },
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
    getItems({ notify }) {
      notify({
        evt: 'progress',
        data: 0.32
      })
      const items = [
        {
          id: 'item1',
          name: 'Some Item (1)',
          desc: 'Some description (1)'
        },
        {
          id: 'item2',
          name: 'Some Item (2)',
          desc: 'Some description (2)'
        }
      ]
      return Promise.resolve(items)
    },
    getItem({ notify, id }) {
      console.log('received msg', id)
      notify({
        evt: 'msgRxd',
        data: {
          id
        }
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
