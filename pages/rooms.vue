<template>
  <div class="container">
    <RoomSelect :rooms="rooms" :user="user" class="room-select" />
    <NuxtPage v-if="rooms.includes($route.params.room)" class="room" :user="user" />
  </div>
</template>

<script>
export default {
  data () {
    return {
      ioApi: {},
      ioData: {},
      rooms: [],
      user: ''
    }
  },
  watch: {
    async 'ioApi.ready' (n, o) {
      this.rooms = await this.ioApi.getRooms()
    }
  },
  mounted () {
    this.user = `user_${Date.now()
      .toString()
      .slice(7)}`
    this.socket = this.$nuxtSocket({
      // name: 'chatSvc',
      channel: '/rooms',
      serverAPI: true
    })
  }
}
</script>

<style scoped>
.room-select {
  width: 100%;
  text-align: center;
}

.room-select > div {
  padding-top: 1%;
}

.room {
  padding-top: 1%;
}
</style>
