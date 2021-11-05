import './SocketStatus.css'
export default {
  render (h) {
    if (!this.status.connectUrl) { return h() }
    const label = h('label', {
      staticClass: 'socket-status label'
    }, [
      h('b', 'Status for: '),
      this.status.connectUrl
    ])
    const entries = []
    for (const entry of this.statusTbl) {
      const entryElm = h('div', {
        staticClass: 'socket-status grid striped'
      }, [
        h('span', {
          staticClass: 'socket-status col-key'
        }, entry.item),
        h('span', {
          staticClass: 'socket-status col-val'
        }, entry.info)
      ])
      entries.push(entryElm)
    }

    return h('div', [
      label,
      entries
    ])
  },
  props: {
    status: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  computed: {
    statusTbl () {
      const { status } = this
      let err
      const items = Object.entries(status).reduce((arr, [item, info]) => {
        if (item !== 'connectUrl' && info !== undefined && info !== '') {
          if (item.match(/Error|Failed/)) {
            err = true
          }
          arr.push({
            item,
            info: typeof info === 'string'
              ? info
              : info.toString()
          })
        }
        return arr
      }, [])

      if (!err) {
        items.unshift({ item: 'status', info: 'OK' })
      }

      return items
    }
  }
}
