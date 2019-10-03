<template>
  <div class="examples-container">
    <h2>Examples</h2>
    <br />
    <h3>Simulate a progress notification</h3>
    <br />

    <b-input-group prepend="Refresh Period" class="w-50 mt-3">
      <b-form-input v-model="refreshPeriod" type="text"></b-form-input>
    </b-input-group>
    <b-input-group class="mt-3">
      <b-button @click="getProgress()">Get Progress</b-button>
      <b-progress
        v-show="showProgress"
        class="w-25 examples-progress-bar"
        height="inherit"
        :value="progress"
        show-progress
        animated
      >
      </b-progress>
      <span v-show="congratulate" class="example-congratulations"
        >All done! Way to go champ!</span
      >
    </b-input-group>

    <nuxt-link to="/">Go Home</nuxt-link>
  </div>
</template>

<script>
export default {
  data() {
    return {
      progress: 0,
      refreshPeriod: 500,
      congratulate: false
    }
  },
  computed: {
    showProgress() {
      return this.progress > 0 && this.progress < 100
    }
  },
  mounted() {
    this.socket = this.$ioChannel('/examples', {})
  },
  methods: {
    getProgress() {
      this.socket
        .emit('getProgress', { period: this.refreshPeriod }, (resp) => {
          this.congratulate = true
          this.progress = 100
          this.socket.removeListener('progress')
        })
        .on('progress', (data) => {
          this.progress = data
        })
    }
  }
}
</script>

<style scoped>
.examples-container {
  margin: 0 auto;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 50%;
}
.examples-progress-bar,
.example-congratulations {
  margin-left: 5px;
}
</style>
