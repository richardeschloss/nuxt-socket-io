<template>
  <div>
    <label>Users in channel:</label>
    <div v-for="user in users" :key="user">
      {{ user }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    users: {
      type: Array,
      default: () => []
    }
  }
}
</script>
