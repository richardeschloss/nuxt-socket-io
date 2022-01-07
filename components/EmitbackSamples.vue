<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title" v-text="'Emitbacks (TBD: on hold for now)'" />
      <label>
        <del>This control updates <code>someObj.id</code> defined in this component.
        When it changes, it commits a Vuex mutation which updates examples/sampleObj in Vuex.
        Because nuxt.config has "examples/sampleObj" as an emitback, the event "examples/sampleObj"
        will be sent when the examples/sampleObj state changes in Vuex.</del>
      </label>
      {{ someObj }}
      <div>
        <input
          class="form-control"
          :value="someObj.id"
          type="number"
          min="0"
          style="width:25%; display: inline-block;"
          @input="changeObj($event)"
        >
      </div>
      <span>Msg: {{ someObj.msg }}</span>
    </div>
    <hr>
    <div>
      <label><del><code>sample</code> tied to "examples/sample" in Vuex will send "examples/sample" event back on change</del></label>
      <!-- <input v-model="sample" class="form-control" type="number"> -->
    </div>
    <div>
      <label><del><code>sample2</code> tied to "examples/sample2" will send mapped "sample2" event back on change</del></label>
      <!-- <input v-model="sample2" class="form-control" type="number"> -->
      <label><code>sample3</code> tied to this component will send mapped "sample3" event back on change</label>
      <input v-model="sample3" class="form-control" type="number">
      <label><code>myObj.sample4</code> tied to this component will send mapped "sample4" event back on change</label>
      <input v-model="myObj.sample4" class="form-control">
      <label><code>myObj.sample5</code> tied to this component won't send anything back because no entries exist for it</label>
      <input v-model="myObj.sample5" class="form-control">
    </div>
  </div>
</template>

<script>
// import { mapState } from 'vuex'
// import { mapState2Way } from '@/utils/state.js'

export default {
  data () {
    return {
      ackRxd: '',
      sample3: 123,
      myObj: {
        sample4: 'watch me (I should be emitted back)',
        sample5: 'watch me (I should *not* be emitted back)'
      },
      socket: null
    }
  },
  computed: {
    someObj() {
      return this.$ioState().value?.examples?.someObj || {}
    }
  },
  // computed: {
  //   ...mapState({ someObj: state => state.examples.someObj }),
  //   sample: mapState2Way({
  //     // [prop]: [mutation]
  //     'examples/sample': 'examples/SET_SAMPLE'
  //   }),
  //   sample2: { // Long-hand form of mapState2Way
  //     get () {
  //       return this.$store.state.examples.sample2
  //     },
  //     set (newVal) {
  //       this.$store.commit('examples/SET_SAMPLE2', newVal)
  //     }
  //   }
  // },
  mounted () {
    this.socket = this.$nuxtSocket({
      channel: '/examples'
    })
  },
  methods: {
    handleAck (ack) {
      this.ackRxd = ack
    },
    changeObj (evt) {
      const msgs = ['hi from object', 'hi again', 'another msg']
      const id = parseInt(evt.target.value)
      const msg = msgs[id % msgs.length]
      const newObj = { id, msg }
      this.$ioState().value.examples.someObj = newObj
      // this.$store.commit('examples/SET_SOMEOBJ', newObj)
    }
  }
}
</script>
