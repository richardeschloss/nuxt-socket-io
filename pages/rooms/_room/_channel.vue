<template>
  <div>
    <h4>Welcome to channel {{ channel }}</h4>
    ChannelInfo {{ channelInfo }}
    <div class="channel">
      <div class="channel-content">
        <b-form-textarea
          v-model="chatMsgsTxt"
          class="channel-msgs-txt"
        ></b-form-textarea>
      </div>
      <div class="channel-users">
        Users in channel:
        <div>user...</div>
        <div v-for="channelUser in channelInfo.users" :key="channelUser">
          {{ channelUser }}
        </div>
      </div>
      <b-form-input
        v-model="userMsg.inputMsg"
        class="input-msg"
        type="text"
        @keyup.enter="sendMessage"
      />
      <b-button class="submit-btn" type="button" @click="sendMessage()"
        >Submit</b-button
      >
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
      joinedChannel: {},
      channelInfo: {},
      userMsg: {
        inputMsg: '',
        user: this.user,
        room: this.room,
        channel: this.channel
      },
      msgRxd: ''
    }
  },
  computed: {
    chatMsgsTxt() {
      return ''
    },

    joinMsg() {
      const { room, channel, user } = this
      return { room, channel, user }
    },

    channel() {
      return this.$route.params.channel
    },

    room() {
      return this.$route.params.room
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({ channel: '/channel' })
    this.joinChannel()
  },
  methods: {
    updateChats(resp) {
      console.log('updateChats')
    },
    toastNotify(resp) {
      console.log('toastNotify')
    }
  }
}
</script>

<style scoped>
.channel {
  display: grid;
  grid-template: repeat(4, 80px) 45px / 5fr 1fr;
  grid-gap: 15px;
}

.channel-content {
  grid-row: span 4;
}

.channel-users {
  grid-column: 2;
}

.channel-msgs-txt {
  height: 100%;
}

.input-msg {
  grid-row: 5;
}

.submit-btn {
  grid-row: 5;
  grid-column: 2;
}
</style>
