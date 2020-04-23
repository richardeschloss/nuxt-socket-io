<template>
  <div>
    <div>
      <label>
        Sample Object (will send "examples/sampleObj" when object changes)
      </label>
      <div>
        <b-form-input
          :value="someObj.id"
          type="number"
          min="0"
          style="width:25%; display: inline-block;"
          @input="changeObj($event)"
        ></b-form-input>
      </div>
      <span>Msg: {{ someObj.msg }}</span>
    </div>
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
import { mapState } from 'vuex'
import { mapState2Way } from '@/utils/esm'

export default {
  data() {
    return {
      ackRxd: '',
      sample3: 123,
      myObj: {
        sample4: 'watch me (I should be emitted back)',
        sample5: 'not me'
      }
    }
  },
  computed: {
    ...mapState({ someObj: (state) => state.examples.someObj }),
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
      this.ackRxd = ack
    },
    changeObj(evt) {
      const msgs = ['hi from object', 'hi again', 'another msg']
      const id = parseInt(evt)
      const msg = msgs[id % msgs.length]
      const newObj = { id, msg }
      this.$store.commit('examples/SET_SOMEOBJ', newObj)
    }
  }
}
</script>
