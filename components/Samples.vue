<template>
  <div>
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
  </div>
</template>

<script>
import { mapState2Way } from '@/utils/esm'

export default {
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
