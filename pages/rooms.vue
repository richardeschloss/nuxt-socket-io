<template>
  <div class="container">
    <h2>Join Room:</h2>
    <ul>
      <li v-for="room in rooms" :key="room">
        <nuxt-link :to="roomRoute(room)">{{ room }} </nuxt-link>
      </li>
    </ul>
    <nuxt-child v-if="showRoom" :user="user"></nuxt-child>
  </div>
</template>

<script>
export default {
  data() {
    return {
      rooms: [],
      user: 'abc' // `user_${Date.now().toString().slice(7)}`,
    }
  },
  computed: {
    roomRoute() {
      return (room) => `/rooms/${room}`
    },

    showRoom() {
      return (
        this.rooms.length > 0 && this.rooms.includes(this.$route.params.room)
      )
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({ channel: '/rooms' })
    this.getRooms()
  }
}
</script>

<style></style>
