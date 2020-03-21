<template>
  <div class="container">
    <h2 id="hdr">Dynamic API Examples</h2>
    <button @click="ioApi.getItems()">Get Items</button>
    <button @click="ioApi.getItem()">Get Item 1</button>
    <div v-if="ioData.getItems">
      (Progress: {{ ioData.getItems.progress }})
      <label>Items: </label>
      <div v-for="item in ioData.getItems.resp" :key="item.id">
        {{ item.id }}
        <ul v-for="(v, k) in item" :key="k">
          <li>
            {{ k }}:
            {{ v }}
          </li>
        </ul>
      </div>
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
