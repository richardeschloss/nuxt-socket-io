<template>
  <div class="container">
    <h2 id="hdr">Dynamic API Examples</h2>
    <h3>Server API Examples</h3>
    <div v-if="ioApi.ready" style="border: 1px solid; width:100%;">
      <span style="width: 40%; display:inline-block;">
        <label>IO server API (for "home" socket on "/dynamic" channel)</label>
        <div style="white-space:pre-wrap;" v-text="ioApi"></div>
      </span>
      <span style="width: 50%; display:inline-block; vertical-align:top;">
        <label>Actions Pane</label>
        <br />
        <button @click="ioApi.getItems()">Get Items</button>
        <br />
        Events:
        <div style="white-space:pre-wrap;" v-text="ioData.getItems.itemRxd" />
        <br />
        Items:
        <div style="white-space:pre-wrap;" v-text="ioData.getItems.resp" />
        <br />
        <input v-model="ioData.getItem.msg.id" placeholder="Item id" />
        <button @click="ioApi.getItem()">Get Item</button>
        Events: Msg Rxd: <span v-text="ioData.msgRxd" />
        <div style="white-space:pre-wrap;" v-text="ioData.getItem.resp" />
      </span>
    </div>
  </div>
</template>

<script>
const ChatMessage = {
  date: new Date(),
  from: '',
  to: '',
  text: ''
}

export default {
  data() {
    return {
      ioApi: {},
      ioData: {}
    }
  },
  computed: {},
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/dynamic',
      apiVersion: 'latest', // TBD: 'ioPeer': true
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
  }
}
</script>
