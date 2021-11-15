<template>
  <transition name="fade-msg-event">
    <p v-show="msg && msg !== ''">
      {{ msg }}
    </p>
  </transition>
</template>

<script>
export default {
  props: {
    msg: {
      type: String,
      default: () => ''
    },
    expires: {
      type: Number,
      default: () => 1500
    }
  },
  watch: {
    msg (n, o) {
      if (n !== '') {
        setTimeout(() => {
          this.$emit('toastExpired', n)
        }, this.expires)
      }
    }
  }
}
</script>

<style scoped>
.fade-msg-event-enter-active,
.fade-msg-event-leave-active {
  transition: all 0.25s ease-in-out;
}
.fade-msg-event-enter,
.fade-msg-event-leave-to {
  opacity: 0;
}
</style>
