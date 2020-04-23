<template>
  <div class="container">
    <room-select class="room-select" :rooms="rooms" :user="user" />
    <nuxt-child
      v-if="rooms.includes($route.params.room)"
      class="room"
      :user="user"
    />
  </div>
</template>

<script>
import RoomSelect from '@/components/RoomSelect'
export default {
  components: {
    RoomSelect
  },
  data() {
    return {
      ioApi: {},
      ioData: {},
      rooms: [],
      user: `user_${Date.now()
        .toString()
        .slice(7)}`
    }
  },
  watch: {
    async 'ioApi.ready'(n, o) {
      this.rooms = await this.ioApi.getRooms()
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      name: 'chatSvc',
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
