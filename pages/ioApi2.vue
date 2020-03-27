<template>
  <div class="container">
    <h2>Dynamic Api (using Vuex)</h2>
    <div style="white-space:pre-wrap;" v-text="ioApi" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      ioApi: {},
      ioData: {}
    }
  },
  computed: {},
  mounted() {
    this.socket = this.$nuxtSocket({
      name: 'evolving',
      channel: '/dynamic',
      apiVersion: 'latest',
      teardown: false,
      persist: true
    })
  }
}
</script>
