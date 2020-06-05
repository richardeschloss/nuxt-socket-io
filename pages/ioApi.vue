<template>
  <div class="container">
    <h2 id="hdr">Dynamic API Examples</h2>
    <h3>Server API Examples</h3>
    <div v-if="ioApi.ready" style="border: 1px solid; width:100%;">
      <span style="width: 40%; display:inline-block;">
        <label>IO server API (for "home" socket on "/dynamic" channel)</label>
        <div v-text="ioApi" style="white-space:pre-wrap;"></div>
      </span>
      <span style="width: 50%; display:inline-block; vertical-align:top;">
        <label>Actions Pane</label>
        <br />
        <button @click="ioApi.getItems()">Get Items</button>
        <br />
        Events:
        <div v-text="ioData.getItems.itemRxd" style="white-space:pre-wrap;" />
        <br />
        Items:
        <div v-text="ioData.getItems.resp" style="white-space:pre-wrap;" />
        <br />
        <input v-model="ioData.getItem.msg.id" placeholder="Item id" />
        <button @click="ioApi.getItem()">Get Item</button>
        Events: Msg Rxd: <span v-text="ioData.msgRxd" />
        <div v-text="ioData.getItem.resp" style="white-space:pre-wrap;" />
        <br />
        Warnings:
        <div>
          <input v-model.number="warnings.battery" type="number" />
        </div>
        <button @click="warningsEmit({ label: 'home/dynamic' })">
          Emit Warnings
        </button>
      </span>
    </div>
    <br />
    <h3>Peer-to-Peer Examples</h3>
    <div v-if="peerApi.ready" style="border: 1px solid; width:100%;">
      <span style="width: 40%; display:inline-block;">
        <label>Peer/Client API (for "home" socket on "/p2p" channel)</label>
        <div v-text="peerApi" style="white-space:pre-wrap;"></div>
      </span>
      <span style="width: 50%; display:inline-block; vertical-align:top;">
        <label>Actions Pane</label>
        <br />
        <button
          @click="
            peerApi.receiveMsg({
              from: 'me',
              to: 'peer',
              date: new Date(),
              text: 'Hi peer!'
            })
          "
        >
          Tell Peer to Receive message
        </button>
        <br />
        Peer's Response: <span v-text="peerData.receiveMsg.resp"></span>
      </span>
    </div>
  </div>
</template>

<script>
const ChatMsg = {
  date: new Date(),
  from: '',
  to: '',
  text: ''
}

const clientAPI = {
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

export default {
  data() {
    return {
      ioApi: {},
      ioData: {},
      peerApi: {},
      peerData: {},

      /* Client Data */
      warnings: {}
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/dynamic',
      serverAPI: {
        evt: 'getAPI',
        data: {
          from: 'ioApi_page'
        }
      },
      clientAPI
    })

    this.socket2 = this.$nuxtSocket({
      channel: '/p2p',
      ioApiProp: 'peerApi',
      ioDataProp: 'peerData',
      serverAPI: {},
      clientAPI
    })
  },
  methods: {
    receiveMsg(msg) {
      return Promise.resolve({
        status: 'ok'
      })
    }
  }
}
</script>
