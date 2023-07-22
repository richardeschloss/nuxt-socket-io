<template>
  <div>
    <div class="row">
      <div class="col-md-10">
        <Chats :chats="chats" />
      </div>
      <div class="col-md-1 d-none d-sm-none d-md-block">
        <ChannelUsers :users="users" />
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <ChatInput
          @sendMsg="handleMsg"
          @sendMsgx="inputMsg !== '' ? ioApi.sendMsg(userMsg) : null"
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
      default: ''
    }
  },
  data () {
    return {
      ioApi: {},
      ioData: {},

      chats: [],
      inputMsg: '',
      users: []
    }
  },
  computed: {
    channel () {
      return this.$route.params.channel
    },

    room () {
      return this.$route.params.room
    },

    userMsg () {
      const { inputMsg, room, channel, user } = this
      return { inputMsg, user, room, channel }
    },

    userJoinedMsg () {
      return this.ioData.userJoined !== ''
        ? `User ${this.ioData.userJoined} joined channel!`
        : ''
    },

    userLeftMsg () {
      return this.ioData.userLeft !== ''
        ? `User ${this.ioData.userLeft} left channel!`
        : ''
    }
  },
  watch: {
    channel (n, o) {
      this.chats = []
      this.socket.close()
      this.socket = this.$nuxtSocket({
        // name: 'chatSvc',
        channel: '/channel',
        serverAPI: true
      })
    },

    async 'ioApi.ready' (ready) {
      if (ready) {
        const { room, channel, chats } = await this.ioApi.join({
          room: this.room,
          channel: this.channel,
          user: this.user
        })
        if (room === this.room && channel === this.channel) {
          this.chats = chats
        }
      }
    },

    'ioData.chat' (chat) {
      if (chat) {
        this.inputMsg = ''
        this.chats.push(chat)
      }
    },

    'ioData.users' (users) {
      this.users = users
    }
  },
  mounted () {
    this.socket = this.$nuxtSocket({
      // name: 'chatSvc',
      channel: '/channel',
      serverAPI: true
    })
  },
  methods: {
    handleMsg (inputMsg) {
      this.inputMsg = inputMsg
      if (this.inputMsg !== '') {
        this.ioApi.sendMsg(this.userMsg)
      }
    }
  }
}
</script>

<style scoped>
.row:nth-of-type(1) {
  height: 75vh;
}

.row:nth-of-type(1) > div {
  height: inherit;
}

.row:nth-of-type(2) {
  padding-top: 2%;
}
</style>
