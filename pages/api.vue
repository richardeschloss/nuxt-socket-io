<template>
  <div>
    Dynamic API Examples
  </div>
</template>

<script>
export default {
  data() {
    return {
      ioApi: {}
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/dynamic'
    })
    this.getApi()
  },
  methods: {
    getApi() {
      this.socket.emit('api', {}, (api) => {
        if (this.ioApi.version && this.ioApi.version >= api.version) {
          console.log('already have latest api version')
          return
        }
        Object.assign(this.ioApi, { methods: [], schemas: {} }, api)
        if (!this.ioApi.data) {
          this.ioApi.data = {}
        }

        this.ioApi.methods.forEach((fn) => {
          if (this.ioApi.data[fn] === undefined) {
            this.ioApi.data[fn] = {
              params: { ...api.schemas[fn].params },
              out: { ...api.schemas[fn].out }
            }
          }
          this[fn] = (args, outLabel = 'out') => {
            const evt = fn
            const msg = args !== undefined ? args : this.ioApi.data[fn].params
            console.log('emitting', evt, msg)
            this.socket.emit(evt, msg, (resp) => {
              console.log({ evt, resp })
              this.ioApi.data[fn][outLabel] = resp
            })
          }
          console.log('created method for', fn)
          this[fn]()
        })
        console.log('api', this.ioApi)
      })
    }
  }
}
</script>
