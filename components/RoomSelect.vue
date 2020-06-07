<template>
  <div>
    <div>
      <div v-show="rooms.includes($route.params.room)">
        Welcome to {{ selectedRoom }}, {{ user }}!
      </div>
      <input
        v-model="selectedRoom"
        @input="$router.push(`/rooms/${selectedRoom}`)"
        list="room-choices"
        placeholder="Join a room (click me!)"
        class="room-choice form-control"
      />
    </div>
    <datalist id="room-choices">
      <option
        v-for="room in rooms"
        :key="room"
        :value="room"
        class="room-choice"
      />
    </datalist>
  </div>
</template>

<script>
export default {
  props: {
    rooms: {
      type: Array,
      default: () => []
    },
    user: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      selectedRoom: this.$route.params.room
    }
  }
}
</script>

<style scoped>
.room-choice {
  display: inline-block;
  width: 50%;
  cursor: pointer;
  text-align: center;
}
</style>
