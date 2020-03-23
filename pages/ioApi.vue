<template>
  <div class="container">
    <h2 id="hdr">Dynamic API Examples</h2>
    <h3>Server API Examples</h3>
    <div style="border: 1px solid; width:100%;">
      <span style="width: 40%; display:inline-block;">
        <label>IO server API (for "home" socket on "/dynamic" channel)</label>
        <div
          style="white-space:pre-wrap;"
          v-text="JSON.stringify(ioApis.home, null, '\t')"
        ></div>
      </span>
      <span style="width: 50%; display:inline-block; vertical-align:top;">
        <label>Actions Pane</label>
        <br />
        <button @click="dynamic.getItems('stuff')">Get Items</button>
        <br />
        Items:
        <div
          style="white-space:pre-wrap;"
          v-text="JSON.stringify(items, null, '\t')"
        ></div>
      </span>
    </div>
    <button @click="ioApi.getItem()">Get Item 1</button>
    <div v-if="ioData.getItems">
      (Progress: {{ ioData.getItems.progress }})
      <label>Items: </label>
      <div v-for="item in ioData.getItems.resp" :key="item.id">
        {{ item.id }}
        <ul v-for="(v, k) in item" :key="k">
          <li>
            {{ k }}:
            {{ v }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
const Item = {
  id: '',
  item: '',
  desc: ''
}

const ChatMessage = {
  date: new Date(),
  from: '',
  to: '',
  text: ''
}

function emit(evt, msg, callback) {
  const Items = [
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
  const evts = {
    getItems() {
      callback(Items)
    }
  }
  console.log('[dummy] emit evt rxd', evt, msg)
  if (evts[evt]) {
    evts[evt]()
  }
}

export default {
  data() {
    return {
      ioApis: {},
      ioApi: {},
      ioData: {}, // TBD
      ioMsg: {}, // TBD
      ioResp: {}
    }
  },
  computed: {
    dynamic() {
      return this.ioApi.home['/dynamic']
    },
    items() {
      return this.ioResp.home ? this.ioResp.home.getItems : []
    },
    progress() {
      // this.ioData.getItems.msg // this.ioData.getItems.resp // this.ioData.getItems.progress
      // this.ioData.progress this.ioData.msgRxd
      // this.ioData.progress --> { }
      return this.ioData.getItems ? this.ioData.getItems.progress : 0
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/dynamic',
      clientAPI: {
        version: 1.31,
        nodeType: 'client',
        evts: {
          warnings: {
            lostSignal: false,
            battery: 0
          }
        },
        methods: {
          receiveMessage: {
            msg: ChatMessage,
            resp: {
              status: ''
            }
          }
        }
      }
    })
    // Rx api:
    this.ioApis = {
      home: {
        // server 1
        '/dynamic': {
          version: 1.02,
          evts: {
            msgRxd: {},
            progress: 0
          },
          methods: {
            // Auto-generate these...
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
      },
      server2: {
        version: 1.31,
        methods: {
          getItems: {
            msg: {},
            resp: {}
          }
        }
      }
    }

    // Assemble API for this page:
    const ctx = this
    // Init data:
    ctx.$set(ctx.ioResp, 'home', {}) // Init for each server

    this.ioApi = {
      home: {
        '/dynamic': {
          getItems(msg) {
            console.log('[ioApi] getItems!', msg)
            return new Promise((resolve) => {
              emit('getItems', msg, (resp) => {
                console.log('resp', resp)
                ctx.$set(ctx.ioResp.home, 'getItems', resp)
                resolve(resp)
              })
            })
          }
        }
      }
    }
  },
  methods: {
    getItems() {
      console.log('getItems')
    }
  }
}
</script>
