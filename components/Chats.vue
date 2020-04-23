<template>
  <div v-show-recent="chats ? chats.length : 0" class="chats-container">
    <div v-for="(chat, idx) in chats" :key="idx">
      <hr v-show="idx > 0" class="chat-separator" />
      <span class="chat-user"> {{ chat.user }} </span>
      <span class="chat-time">
        {{ new Date(chat.timestamp).toLocaleString() }}
      </span>
      <div class="chat-msg">{{ chat.inputMsg }}</div>
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
    chats: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style scoped>
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
</style>
