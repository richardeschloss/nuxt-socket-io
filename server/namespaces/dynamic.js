const Schemas = {
  Person: {
    firstName: String,
    lastName: String
  },
  Transaction: {
    date: Date,
    amt: Number
  },
  Item: {
    id: '',
    item: '',
    desc: ''
  }
}

function API() {
  const version = 1.01

  const schemas = Object.freeze({
    getItems: {
      resp: []
    },
    getItem: {
      msg: {
        id: 'tbd'
      },
      resp: Schemas.Item
    }
  })

  const methods = Object.freeze({
    getItems({ notify, ...data }) {
      console.log('data!', data)
      return Promise.resolve([{ id: 'item1' }, { id: 'item2' }])
    },
    getItem({ notify, ...data }) {
      return Promise.resolve({ msg: 'ok2' })
    }
  })

  return Object.freeze({
    ...methods,
    api() {
      return Promise.resolve({
        methods: Object.keys(methods),
        schemas,
        version
      })
    }
  })
}

module.exports = {
  Svc: API
}