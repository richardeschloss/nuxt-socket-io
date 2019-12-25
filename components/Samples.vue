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
      <b-form-input v-model="sample3" type="number"></b-form-input>
      <b-form-input v-model="myObj.sample4"></b-form-input>
      <b-form-input v-model="myObj.sample5"></b-form-input>
    </div>
  </div>
</template>

<script>
import { mapState2Way } from '@/utils/esm'

export default {
  data() {
    return {
      sample3: 123,
      myObj: {
        sample4: 'watch me (I should be emitted back)',
        sample5: 'not me'
      }
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
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/examples'
    })
  },
  methods: {
    handleAck(ack) {
      console.log('ack received', ack)
    }
  }
}
</script>
