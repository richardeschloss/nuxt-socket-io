<template>
  <div class="row">
    <div class="col-md-10 col-8">
      <input
        v-model="inputMsg"
        class="form-control"
        type="text"
        @keyup.enter="sendMsg"
      >
    </div>
    <div class="col-md0 col-1">
      <button type="button" class="btn btn-secondary" @click="sendMsg">
        Submit
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: () => ''
    }
  },
  emits: ['sendMsg'],
  data() {
    return {
      inputMsg: ''
    }
  },
  methods: {
    sendMsg() {
      this.$emit('sendMsg', this.inputMsg)
      this.inputMsg = ''
    }
  }
}
</script>
