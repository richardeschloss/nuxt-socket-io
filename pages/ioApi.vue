<template>
  <div class="container">
    <h2 id="hdr">Dynamic API Examples</h2>
    <div>Data: {{ ioData }}</div>
    <button @click="ioApi.getItems()">Get Items</button>
    <button @click="ioApi.getItem()">Get Item 1</button>
    <div
      v-if="
        ioData.getItems &&
          ioData.getItems.resp &&
          ioData.getItems.resp.length > 0
      "
    >
      RESP id: <input v-model="ioData.getItems.resp[0].id" type="text" />
      <br />
      Val:
      <div id="idVal" v-text="ioData.getItems.resp[0].id"></div>
      <br />
      Item1 id:
      <input v-model="ioData.getItem.msg.id" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      ioData: {}
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/dynamic'
    })
  }
}
</script>
