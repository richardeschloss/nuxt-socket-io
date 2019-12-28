<template>
  <div>
    <b-input-group prepend="Refresh Period" class="w-50 mt-3 example-input">
      <b-form-input v-model="refreshInfo.period" type="text"></b-form-input>
      <b-button @click="getProgress()">Get Progress</b-button>
    </b-input-group>
    <div>
      <label>Event 'progress' listened locally in this script</label>
      <b-progress
        v-show="showProgress"
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
        v-show="showProgress"
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
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      progress: 0,
      congratulate: false,
      showProgress: false,
      refreshInfo: {
        period: 500
      }
    }
  },
  computed: mapState({
    progressVuex: (state) => state.examples.progress
  }),
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/examples'
    })
  },
  methods: {
    handleDone(resp) {
      this.showProgress = false
      this.congratulate = true
      this.progress = 100
      this.$store.commit('examples/SET_PROGRESS', this.progress)
    },
    reset() {
      this.showProgress = true
      this.congratulate = false
      this.progress = 0
      this.$store.commit('examples/SET_PROGRESS', this.progress)
    }
  }
}
</script>

<style scoped>
.examples-progress-bar,
.example-congratulations {
  margin-left: 5px;
}
</style>
