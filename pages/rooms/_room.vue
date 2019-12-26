<template>
  <div>
    <h3 v-if="roomInfo.user === user">
      Welcome to room {{ room }}, {{ user }}!
    </h3>
    <h3 v-else>Joining room...{{ room }}</h3>

    <p>Room info: {{ roomInfo }}</p>
    <p>ROOM</p>
    <div class="room">
      <nav class="channel-select">
        <div class="sidebar-sticky">
          <ul class="nav flex-column">
            <li
              v-for="channel in channels"
              :key="channel"
              class="nav-item channel-container"
            >
              <a
                class="nav-link"
                :class="channel.active"
                @click="joinChannel(channel)"
                >{{ channel }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    Channel here??
    <nuxt-child></nuxt-child>
  </div>
</template>

<script>
export default {
  props: {
    user: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      room: this.$route.params.room,
      joined: false,
      joinedRoom: {},
      roomInfo: {}
    }
  },
  computed: {
    channels() {
      return this.roomInfo.room ? this.roomInfo.room.channels : []
    },

    joinMsg() {
      const { room, user } = this
      return { room, user }
    }
  },
  watch: {
    room() {
      this.joinRoom()
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({ channel: '/room' })
    this.joinRoom()
  },
  methods: {
    toastNotify(resp) {
      console.log('another user joined...')
    }
  }
}
</script>

<style scoped>
.room {
  display: grid;
  grid-template: 80px repeat(5, 80px) [header-start content-row-start] / 1fr 4fr 1fr [channel-nav content-col-start right-pane];
  grid-row-gap: 5px;
}

.room-header {
  grid-column: span 3;
}

.channel-select {
  grid-row: span 5;
}

.channel-content {
  grid-row: span 4;
  grid-column: 2;
}

.channel-msgs-txt {
  width: 95%;
  height: 100%;
}

.channel-container {
  border-top: 1px solid;
  border-bottom: 1px solid;
  cursor: pointer;
}

.channel-container .active {
  background-color: lavender;
}

.room-users {
  grid-column: 3;
}

.input-msg {
  grid-column: 2;
}

.submit-btn {
  grid-column: span 1;
}
</style>
