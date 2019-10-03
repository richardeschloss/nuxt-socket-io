<template>
  <div class="container">
    <div>
      <logo />
      <h1 class="title">
        nuxt-socket-io
      </h1>
      <h2 class="subtitle">
        Nuxt with basic socket.io examples
      </h2>
      <div class="links">
        <a href="https://nuxtjs.org/" target="_blank" class="button--green">
          Documentation
        </a>
        <a
          href="https://github.com/nuxt/nuxt.js"
          target="_blank"
          class="button--grey"
        >
          GitHub
        </a>
      </div>
    </div>
    <div>
      <label>If you can see text appear in the box, it worked!</label>
      <button @click="getMessage()">Get Message</button>
      <b-form-textarea
        v-model="messageRxd"
        placeholder="Waiting for you to click the 'Get Message' button..."
        rows="3"
        max-rows="6"
      ></b-form-textarea>
      <nuxt-link to="examples">Thirsty for more examples?</nuxt-link>
    </div>
  </div>
</template>

<script>
import Logo from '~/components/Logo.vue'

export default {
  components: {
    Logo
  },
  data() {
    return {
      messageRxd: ''
    }
  },
  mounted() {
    this.socket = this.$ioChannel('/index', {})
  },
  methods: {
    getMessage() {
      this.socket.emit('getMessage', { id: 'abc123' }, (resp) => {
        this.messageRxd = resp
      })
    }
  }
}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}

.message-rxd-textbox {
  width: 500px;
  height: 500px;
}
</style>
