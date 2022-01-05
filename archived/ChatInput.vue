<template>
  <div class="row">
    <div class="col-md-10 col-8">
      <input
        v-model="inputMsg"
        class="form-control"
        type="text"
        @keyup.enter="$emit('sendMsg')"
      >
    </div>
    <div class="col-md0 col-1">
      <button type="button" class="btn btn-default" @click="$emit('sendMsg')">
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
  computed: {
    inputMsg: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  }
}
</script>
