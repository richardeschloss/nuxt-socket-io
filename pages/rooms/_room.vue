<template>
  <div v-if="ioApi.ready">
    <div id="notifications">
      <toaster :msg="userJoinedMsg" @toastExpired="ioData.userJoined = ''" />
      <toaster :msg="userLeftMsg" @toastExpired="ioData.userLeft = ''" />
    </div>
    <div class="row">
      <div class="col-md0">
        <channel-select :room="room" :channels="channels" />
      </div>
      <div class="col-md-11">
        <nuxt-child
          v-if="channels.includes($route.params.channel)"
          :user="user"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    user: {
      type: String,
      default: () => ''
    }
  },
  data () {
    return {
      ioApi: {},
      ioData: {},
      room: this.$route.params.room,
      channels: [],
      users: []
    }
  },
  computed: {
    userJoinedMsg () {
      return this.ioData.userJoined !== ''
        ? `User ${this.ioData.userJoined} joined room!`
        : ''
    },

    userLeftMsg () {
      return this.ioData.userLeft !== ''
        ? `User ${this.ioData.userLeft} left room!`
        : ''
    }
  },
  watch: {
    async 'ioApi.ready' (ready) {
      if (ready) {
        const { room, channels } = await this.ioApi.join({
          room: this.room,
          user: this.user
        })
        if (room === this.room) {
          this.channels = channels
        }
      }
    },
    'ioData.users' (users) {
      this.users = users
    }
  },
  mounted () {
    this.socket = this.$nuxtSocket({
      name: 'chatSvc',
      channel: '/room',
      serverAPI: true
    })
  }
}
</script>

<style scoped>
#notifications {
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 2%;
}
</style>
