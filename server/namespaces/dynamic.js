const Schemas = {
  Item: {
    id: '',
    item: '',
    desc: ''
  }
}

const { Item } = Schemas

const api = {
  version: 1.02,
  nodeType: 'server',
  evts: {
    msgRxd: {},
    progress: {
      evt: '',
      val: 0
    }
  },
  methods: {
    getItems: {
      evts: {
        progress: 0
      },
      resp: [Schemas.Item]
    },
    getItem: {
      msg: {
        id: ''
      },
      resp: Schemas.Item
    }
  }
}

function Svc(socket) {
  return Object.freeze({
    getAPI: () => Promise.resolve(api),

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
