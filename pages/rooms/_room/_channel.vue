<template>
  <div>
    <div class="channel">
      <div class="channel-content">
        <b-form-textarea
          v-model="chatMsgsTxt"
          class="channel-msgs-txt"
        ></b-form-textarea>
      </div>
      <div class="channel-users">
        <label>Users in channel:</label>
        <div v-for="channelUser in channelInfo.users" :key="channelUser">
          {{ channelUser }}
        </div>
      </div>
      <b-form-input
        v-model="inputMsg"
        class="input-msg"
        type="text"
        @keyup.enter="sendMsg"
      />
      <b-button class="submit-btn" type="button" @click="sendMsg()"
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
      chatMessage: '',
      inputMsg: '',
      msgRxd: '',
      joinMsg: {},
      leaveMsg: {},
    }
  },
  computed: {
    chatMsgsTxt() {
      const { chats } = this.channelInfo
      if (chats !== undefined && chats.length > 0) {
        const formatted = []
        chats.forEach(({ user, inputMsg, timestamp }) => {
          formatted.push(
            `${user}: ${inputMsg} (${new Date(timestamp).toLocaleString()}))`
          )
        })
        return formatted.join('\r\n')
      } else {
        return ''
      }
    },

    channel() {
      return this.$route.params.channel
    },

    namespace() {
      return this.channelInfo.namespace
    },

    room() {
      return this.$route.params.room
    },

    userMsg() {
      return {
        inputMsg: this.inputMsg,
        user: this.user,
        room: this.room,
        channel: this.channel,
        namespace: this.namespace
      }
    }
  },
  watch: {
    channel(newChannel, oldChannel) {
      const { room, user } = this
      this.leaveMsg = { room, channel: oldChannel, user }
      this.leaveChannel()

      this.joinMsg = { room, channel: newChannel, user }
      this.joinChannel()
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({ channel: '/channel' })
    this.joinMsg = { room: this.room, channel: this.channel, user: this.user }
    this.joinChannel()
  },
  methods: {
    appendChats(resp) {
      // console.log('msgRxd!! appendChats for user', this.user, resp.user, resp)
    },

    updateChats(resp) {
      // console.log('updateChats', resp)
    },
    updateChannelInfo(resp) {
      const { room, users, channel, chats, namespace } = resp
      const { channel: activeChannel, room: activeRoom } = this
      if (room === activeRoom && channel === activeChannel) {
        Object.assign(this.channelInfo, { users, chats, namespace })
      }
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
