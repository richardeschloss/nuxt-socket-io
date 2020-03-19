<template>
  <div class="container">
    <h2>Dynamic API Examples</h2>
    <div>API: {{ ioApi }}</div>
    <div>Data: {{ ioData }}</div>
    <!-- <div>API data: {{ apiData }}</div>
    <div>Just items: {{ items }}</div>
    <button @click="ioApi.getItems()">Get Items</button> -->
    <div v-if="ioData.getItem">
      <input v-model="ioData.getItem.msg.id" type="text" />
    </div>
    <div>ITEMS: {{ ioData.getItems ? ioData.getItems.resp : '' }}</div>
    <div>alt items: {{ items }}</div>
    <!-- <div v-text="ioAPI"></div> -->
    <!-- <div v-if="items">ITEMS: {{ JSON.stringify(items) }}</div> -->
    <!-- <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      ioApi: {},
      ioData: {},
      items: []
    }
  },
  computed: {
    // items() {
    //   console.log('data changed!')
    //   if (this.ioApi.getItems) {
    //     return this.ioApi.getItems.resp
    //   } else {
    //     return []
    //   }
    // }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/dynamic'
    })
  }
}
</script>
