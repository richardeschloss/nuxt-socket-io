<template>
  <div class="container">
    <div>
      <h2 class="join-room-hdr">Join Room:</h2>
      <input
        v-model="selectedRoom"
        list="room-choices"
        placeholder="Join a room (click me!)"
        class="room-choice form-control"
        @input="toRoom()"
      />
    </div>

    <datalist id="room-choices">
      <option
        v-for="room in rooms"
        :key="room"
        :value="room"
        class="room-choice"
      >
      </option>
    </datalist>
    <nuxt-child v-if="showRoom" :user="user"></nuxt-child>
  </div>
</template>

<script>
export default {
  data() {
    return {
      rooms: [],
      selectedRoom: '',
      user: 'abc' // `user_${Date.now().toString().slice(7)}`,
    }
  },
  computed: {
    showRoom() {
      return (
        this.rooms.length > 0 && this.rooms.includes(this.$route.params.room)
      )
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({ channel: '/rooms' })
    this.getRooms()
  },
  methods: {
    toRoom(room) {
      this.$router.push(`/rooms/${this.selectedRoom}`)
    }
  }
}
</script>

<style scoped>
.join-room-hdr {
  display: inline-block;
}

.room-choice {
  display: inline-block;
  width: 25%;
  cursor: pointer;
}
</style>
