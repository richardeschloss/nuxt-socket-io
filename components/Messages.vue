<template>
  <div>
    <label>If you can see text appear in the box, it worked!</label>
    <button @click="getMessage()">Get Message</button>
    <b-form-textarea
      v-model="messageRxd"
      placeholder="Waiting for you to click the 'Get Message' button..."
      rows="3"
      max-rows="6"
    ></b-form-textarea>
    <b-form-textarea
      v-model="chatMessages"
      placeholder="Formatted messages will appear here"
      rows="3"
      max-rows="6"
    ></b-form-textarea>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      messageRxd: ''
    }
  },
  computed: mapState(['chatMessages']),
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/index',
      reconnection: false
    })
  },
  methods: {
    getMessage() {
      return new Promise((resolve) => {
        this.socket.emit('getMessage', { id: 'abc123' }, (resp) => {
          this.messageRxd = resp
          resolve()
        })
      })
    }
  }
}
</script>

<style scoped>
.message-rxd-textbox {
  width: 500px;
  height: 500px;
}
</style>
