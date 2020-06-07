<template>
  <div class="row">
    <div class="col-md-10 col-8">
      <b-form-input
        v-model="inputMsg"
        @keyup.enter="$emit('sendMsg')"
        type="text"
      />
    </div>
    <div class="col-md0 col-1">
      <b-button @click="$emit('sendMsg')" type="button">Submit</b-button>
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
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  }
}
</script>
