<template>
  <div class="container index-container">
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
      <messages style="height: 500px; overflow-y: scroll;"></messages>
      <nuxt-link to="examples">Thirsty for more examples?</nuxt-link>
      <br />
      <nuxt-link to="rooms">Feeling Ready for...Chat Rooms?</nuxt-link>
      <br />
      <nuxt-link to="ioStatus">When in doubt, check the IO Status</nuxt-link>
    </div>
  </div>
</template>

<script>
import Logo from '@/components/Logo.vue'
import Messages from '@/components/Messages.vue'

export default {
  components: {
    Logo,
    Messages
  }
}
</script>

<style scoped>
.index-container {
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
</style>
