<template>
  <div>
    <label>Id</label>
    <input v-model="id" class="form-control"/>
    <button class="btn btn-primary" @click="getMessage()" v-text="'Get Message'" />
    <p class="text-left" style="color: grey; white-space: pre-line;" v-text="msg" />
  </div>
</template>
<script setup>
const ctx = useNuxtApp()
const id  = ref('abc123')
const msg = ref('^^Click the button')
let socket
const getMessage = async () => {
  msg.value = await socket.emitP('getMessage', { id: id.value })
}
onMounted(() => {
  socket = ctx.$nuxtSocket({
    channel: '/index'
  })
})


</script>
