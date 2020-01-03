<template>
  <div v-if="status.connectUrl">
    <label class="status-label"
      ><b>Status for:</b> {{ status.connectUrl }}</label
    >
    <div
      v-for="entry in statusTbl"
      :key="entry.item"
      class="status-grid striped"
    >
      <span class="col-key">{{ entry.item }}</span>
      <span class="col-val">{{ entry.info }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    status: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  computed: {
    statusTbl() {
      const { status } = this
      let err
      const items = Object.entries(status).reduce((arr, [item, info]) => {
        if (item !== 'connectUrl' && info !== undefined && info !== '') {
          if (item.match(/Error|Failed/)) {
            err = true
          }
          arr.push({ item, info })
        }
        return arr
      }, [])

      if (!err) {
        items.unshift({ item: 'status', info: 'OK' })
      }

      return items
    }
  }
}
</script>

<style scoped>
.status-label {
  width: 100%;
  text-align: left;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.status-grid:hover {
  color: #212529;
  background-color: rgba(0, 0, 0, 0.075);
}

.striped:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.col-key {
  grid-column: 1;
  font-weight: bold;
  text-align: right;
  padding: 0.75rem;
  border-top: 1px solid #dee2e6;
}

.col-val {
  grid-column: 2;
  text-align: left;
  padding: 0.75rem;
  border-top: 1px solid #dee2e6;
}
</style>
