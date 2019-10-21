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
    <br />
    <h3>Emit registered Vuex changes back to IO Server</h3>
    <br />
    <div>
      <label
        >Sample Number (will send "examples/sample" event back on change)</label
      >
      <b-form-input v-model="sample" type="number"></b-form-input>
    </div>
    <div>
      <label
        >Sample Number2 (will send mapped "sample2" event back on change)</label
      >
      <b-form-input v-model="sample2" type="number"></b-form-input>
    </div>
    <nuxt-link to="/">Go Home</nuxt-link>
  </div>
</template>

<script>
import { mapState } from 'vuex'

function mapState2Way(map) {
  const [[prop, mutation]] = Object.entries(map)
  let stateProp = null
  return {
    get() {
      if (!stateProp) {
        const outProp = Object.assign({}, this.$store.state)
        stateProp = prop.split('/').reduce((obj, nestedProp) => {
          obj = obj[nestedProp]
          return obj
        }, outProp)
      }
      return stateProp
    },
    set(newVal) {
      this.$store.commit(mutation, newVal)
    }
  }
}

export default {
  data() {
    return {
      progress: 0,
      refreshPeriod: 500,
      congratulate: false,
      showProgress: false
    }
  },
  computed: {
    sample: mapState2Way({ 'examples/sample': 'examples/SET_SAMPLE' }),
    sample2: {
      get() {
        return this.$store.state.examples.sample2
      },
      set(newVal) {
        this.$store.commit('examples/SET_SAMPLE2', newVal)
      }
    },
    ...mapState({
      progressVuex: (state) => state.examples.progress
    })
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/examples'
    })
  },
  methods: {
    getProgress() {
      this.showProgress = true
      this.progress = 0
      this.$store.commit('examples/SET_PROGRESS', this.progress)
      this.socket
        .emit('getProgress', { period: this.refreshPeriod }, (resp) => {
          this.showProgress = false
          this.congratulate = true
          this.progress = resp
          this.$store.commit('examples/SET_PROGRESS', this.progress)
          // this.socket.removeListener('progress')
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
