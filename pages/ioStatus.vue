<template>
  <div class="status-container">
    <nuxt-link to="/">
      Go Home
    </nuxt-link>
    <io-socket-status :status="socketStatus" />
    <hr>
    <io-socket-status :status="badStatus" />

    <hr>
    (No status here)
    <io-socket-status />
  </div>
</template>

<script>
export default {
  data () {
    return {
      socketStatus: {},
      badStatus: {},
      goodSocket: {},
      badSocket: {}
    }
  },
  mounted () {
    this.goodSocket = this.$nuxtSocket({
      channel: '/index',
      reconnection: false
    })

    this.badSocket = this.$nuxtSocket({
      name: 'badSocket',
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
