<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title" v-text="'Emitbacks'" />
      <label>
        This control updates <code>someObj.id</code> defined in this component.
        When it changes, it updates examples/sampleObj in ioState.
        Because nuxt.config has "examples/sampleObj" as an emitback, the event "examples/sampleObj"
        will be sent when the examples/sampleObj state changes in ioState.
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
      <label><code>sample</code> tied to "examples/sample" in ioState will send "examples/sample" event back on change</label>
      <input v-model="sample" class="form-control" type="number" />
    </div>
    <div>
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
    },
    sample: {
      get() {
        return this.$ioState().value?.examples?.sample  
      },
      set (newVal) {
        this.$ioState().value.examples.sample = newVal
      }
    }
  },
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
    }
  }
}
</script>
