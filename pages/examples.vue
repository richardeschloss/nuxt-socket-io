<template>
  <div class="examples-container">
    <h2>Examples</h2>
    <br />
    <h3>Simulate a progress notification</h3>
    <progress-bar></progress-bar>
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
import { mapState2Way } from '@/utils/esm'
import ProgressBar from '@/components/ProgressBar.vue'

export default {
  components: {
    ProgressBar
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
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/examples'
    })
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
</style>
