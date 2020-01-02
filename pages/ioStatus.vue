<template>
  <div class="status-container">
    <nuxt-link to="/">Go Home</nuxt-link>
    <socket-status :status="socketStatus"></socket-status>
    <hr />
    <socket-status :status="badStatus"></socket-status>
  </div>
</template>

<script>
import SocketStatus from '@/components/SocketStatus.vue'

export default {
  components: {
    SocketStatus
  },
  data() {
    return {
      socketStatus: {},
      badStatus: {}
    }
  },
  mounted() {
    this.goodSocket = this.$nuxtSocket({
      channel: '/index',
      reconnection: false
    })

    this.badSocket = this.$nuxtSocket({
      name: 'test',
      channel: '/index',
      reconnection: true,
      statusProp: 'badStatus'
    })
  }
}
</script>

<style scoped>
.status-container {
  margin: 0 auto;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 50%;
}
</style>
