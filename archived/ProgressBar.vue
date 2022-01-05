<template>
  <div class="card ">
    <div class="card-body">
      <h5 class="card-title" v-text="'Listening for events'" />
      <div class="input-group mb-3">
        <div class="input-group-prepend">
          <span id="basic-addon1" class="input-group-text" v-text="'Refresh Period'" />
        </div>
        <input v-model="refreshInfo.period" type="text" class="form-control">
        <button class="btn btn-primary" @click="getProgress()" v-text="'Get Progress'" />
      </div>
      <div>
        <label>This component, via nuxt.config listeners, subscribed to the 'progress' event:</label>
        <div v-show="showProgress" class="progress" style="height: 30px;">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            :style="`width: ${progress}%;`"
            v-text="`${progress}%`"
          />
        </div>
      </div>
      <hr>
      <div>
        <label>Vuex Options in nuxt.config also has an entry for the progress event.
          When the progress event is received, the specified mutation "examples/SET_PROGRESS"
          will handle it, and this component will consume it from the Vuex state:
        </label>
        <div v-show="showProgress" class="progress" style="height: 30px;">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            :style="`width: ${progressVuex}%;`"
          >
            {{ progressVuex }}%
          </div>
        </div>
      </div>
      <div>
        <span
          v-show="congratulate"
          class=""
        >All done! Way to go champ!</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data () {
    return {
      progress: 0,
      congratulate: false,
      showProgress: false,
      refreshInfo: {
        period: 500
      },
      socket: null
    }
  },
  computed: mapState({
    progressVuex: state => state.examples.progress
  }),
  mounted () {
    this.socket = this.$nuxtSocket({
      channel: '/examples'
    })
  },
  methods: {
    handleDone (resp) {
      this.showProgress = false
      this.congratulate = true
      this.progress = 100
      this.$store.commit('examples/SET_PROGRESS', this.progress)
    },
    reset () {
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
