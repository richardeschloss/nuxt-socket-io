<template>
  <div>
    <h3 v-if="roomInfo.user === user">
      Welcome to room {{ room }}, {{ user }}!
    </h3>
    <h3 v-else>Joining room...{{ room }}</h3>
    <p>
      Users in room: <b> {{ roomUsers }} </b>
    </p>
    <div class="room">
      <nav class="channel-select">
        <div class="sidebar-sticky">
          <ul class="nav flex-column">
            <li
              v-for="channel in channels"
              :key="channel"
              class="nav-item channel-container"
            >
              <nuxt-link
                class="nav-link"
                :class="channelActive(channel)"
                :to="channelRoute(channel)"
              >
                {{ channel }}
              </nuxt-link>
            </li>
          </ul>
        </div>
      </nav>
      <nuxt-child v-if="showChannel"></nuxt-child>
    </div>
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
    channelActive() {
      return (channel) =>
        channel === this.$route.params.channel ? 'active' : ''
    },

    channelRoute() {
      return (channel) => `/rooms/${this.room}/${channel}`
    },

    channels() {
      return this.roomInfo.channels ? this.roomInfo.channels : []
    },

    joinMsg() {
      const { room, user } = this
      return { room, user }
    },

    roomUsers() {
      return this.roomInfo.users ? this.roomInfo.users.join(', ') : []
    },

    showChannel() {
      return (
        this.channels.length > 0 &&
        this.channels.includes(this.$route.params.channel)
      )
    }
  },
  watch: {
    room(newVal) {
      this.joinRoom()
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({ channel: '/room' })
    if (this.joinMsg.room) this.joinRoom()
  },
  methods: {
    updateUsers(resp) {
      console.log('another user join / leave evt...', resp)
      console.log('users before', this.roomInfo.users.length)
      this.roomInfo.users = resp.users
      console.log('users after', this.roomInfo.users.length)
    }
  }
}
</script>

<style scoped>
.room {
  display: grid;
  grid-template: 80px repeat(5, 80px) / 1fr 5fr;
  grid-gap: 15px;
}

.channel-select {
  grid-row: span 5;
}

.channel-container {
  border-top: 1px solid;
  border-bottom: 1px solid;
  cursor: pointer;
}

.channel-container .active {
  background-color: lavender;
}
</style>
