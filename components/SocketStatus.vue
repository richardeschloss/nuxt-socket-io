<template>
  <div v-if="$parent.socketStatus">
    <label>Socket.io Client Status</label>
    <b-table striped hover :items="statusTbl"></b-table>
  </div>
</template>

<script>
export default {
  computed: {
    statusTbl() {
      const { socketStatus } = this.$parent
      const items = Object.entries(socketStatus).reduce((arr, [item, info]) => {
        if (info !== undefined && info !== '') {
          arr.push({ item, info })
        }
        return arr
      }, [])

      return items
    }
  }
}
</script>
