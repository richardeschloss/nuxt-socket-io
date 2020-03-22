<template>
  <div class="container">
    <h2 id="hdr">Dynamic API Examples</h2>
    <button @click="ioApi.getItems()">Get Items</button>
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
const ChatMessage = {
  date: new Date(),
  from: '',
  to: '',
  text: ''
}

export default {
  data() {
    return {
      ioData: {}
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
          sendMessage: {
            evts: {
              sending: false
            },
            resp: ChatMessage
          }
        }
      }
    })
  }
}
</script>
