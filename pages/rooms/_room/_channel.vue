<template>
  <div>
    <div class="channel">
      <div class="channel-content">
        <div v-show-recent="chats ? chats.length : 0" class="chats-container">
          <div v-for="(chat, idx) in chats" :key="idx">
            <hr v-show="idx > 0" class="chat-separator" />
            <span class="chat-user"> {{ chat.user }} </span>
            <span class="chat-time">
              {{ new Date(chat.timestamp).toLocaleString() }}
            </span>
            <div class="chat-msg">{{ chat.inputMsg }}</div>
          </div>
          <div></div>
          <div></div>
        </div>
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
        @keyup.enter="sendMsg()"
      />
      <b-button class="submit-btn" type="button" @click="sendMsg()"
        >Submit</b-button
      >
    </div>
  </div>
</template>

<script>
export default {
  directives: {
    showRecent: {
      update(elm, binding) {
        const { value: chatsLength, oldValue: oldChatsLength } = binding
        if (chatsLength !== oldChatsLength) {
          setTimeout(() => {
            elm.scrollTop = elm.scrollHeight
          }, 250)
        }
      }
    }
  },
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
      msgRxd: {},
      joinMsg: {},
      leaveMsg: {}
    }
  },
  computed: {
    channel() {
      return this.$route.params.channel
    },

    chats() {
      return this.channelInfo.chats
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
      this.channelInfo.chats.push(resp)
      this.inputMsg = ''
    },

    updateChannelInfo(resp) {
      const { room, users, channel, namespace } = resp
      const { channel: activeChannel, room: activeRoom } = this
      if (room === activeRoom && channel === activeChannel) {
        Object.assign(this.channelInfo, { users, namespace })
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

.chats-container {
  border: 1px solid;
  border-radius: 10px;
  height: 100%;
  padding: 10px;
  background: #36393f;
  color: #f2ffed;
  overflow-y: scroll;
}

.chat-separator {
  background: #f2ffed5e;
}

.chat-user {
  font-weight: bold;
}

.chat-time {
  float: right;
  font-size: 0.75rem;
}

.input-msg {
  grid-row: 5;
}

.submit-btn {
  grid-row: 5;
  grid-column: 2;
}
</style>
