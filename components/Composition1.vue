<template>
  <div>
    Component using composition api
    <button @click="getMessage2('hello world')">Get Message</button>
    <div>{{ message2Rxd }}</div>
  </div>
</template>
<script>
// @ts-nocheck
import {
  defineComponent,
  useContext,
  onUnmounted,
  toRefs,
  reactive,
  watch
} from '@nuxtjs/composition-api'

export default defineComponent({
  setup(props, context) {
    const ctx = useContext()
    ctx.$data = toRefs(
      reactive({
        message2Rxd: 'this should change'
      })
    )
    ctx.$destroy = () => {
      // eslint-disable-next-line no-console
      console.log('run me too')
    }
    ctx.onUnmounted = onUnmounted
    ctx.$nuxtSocket({
      channel: '/index',
      reconnection: false
    })
    ctx.$nuxtSocket({
      channel: '/index',
      reconnection: false
    })
    ctx.getMessage2('see me??')
    ctx.$watch = (label, cb) => {
      // This stub will be enabled
      // in the plugin when '@nuxtjs/composition-api' reaches stable version:
      watch(ctx.$data[label], cb)
    }
    ctx.$watch('message2Rxd', (n, o) => {
      // eslint-disable-next-line no-console
      console.log('message2Rxd changed', n, o)
    })

    return {
      ...ctx.$data,
      getMessage2: ctx.getMessage2
    }
  }
})
</script>
