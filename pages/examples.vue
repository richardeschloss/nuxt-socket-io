<template>
  <div class="examples-container">
    <h2>Examples</h2>
    <br />
    <h3>Simulate a progress notification</h3>
    <br />

    <b-input-group prepend="Refresh Period" class="w-50 mt-3 example-input">
      <b-form-input v-model="refreshPeriod" type="text"></b-form-input>
      <b-button @click="getProgress()">Get Progress</b-button>
    </b-input-group>
    <div>
      <label>Event 'progress' listened locally in this script</label>
      <b-progress
        class="examples-progress-bar"
        height="inherit"
        :value="progress"
        show-progress
        animated
      >
      </b-progress>
    </div>
    <div>
      <label>Consume progress from Vuex 'progress' state:</label>
      <b-progress
        class="examples-progress-bar"
        height="inherit"
        :value="progressVuex"
        show-progress
        animated
      >
      </b-progress>
    </div>
    <div>
      <span v-show="congratulate" class="example-congratulations"
        >All done! Way to go champ!</span
      >
    </div>
    <nuxt-link to="/">Go Home</nuxt-link>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data() {
    return {
      progress: 0,
      refreshPeriod: 500,
      congratulate: false
    }
  },
  computed: mapState({
    progressVuex: (state) => state.examples.progress
  }),
  mounted(ctx) {
    const { $store: store } = this
    this.socket = this.$nuxtSocket({
      ioOpts: {
        channel: '/examples'
      },
      store
    })
  },
  methods: {
    getProgress() {
      this.socket
        .emit('getProgress', { period: this.refreshPeriod }, (resp) => {
          this.congratulate = true
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
.example-input {
  margin-bottom: 10px;
}
.examples-progress-bar,
.example-congratulations {
  margin-left: 5px;
}
</style>
