<template>
  <div class="examples-container">
    <h2>Examples</h2>
    <br />
    <h3>Simulate a progress notification</h3>
    <progress-bar></progress-bar>
    <h3>Emit registered Vuex changes back to IO Server</h3>
    <br />
    <samples></samples>
    <nuxt-link to="/">Go Home</nuxt-link>
  </div>
</template>

<script>
import ProgressBar from '@/components/ProgressBar.vue'
import Samples from '@/components/Samples.vue'

export default {
  components: {
    ProgressBar,
    Samples
  }
}
</script>

<style scoped>
.examples-container {
  margin: 0 auto;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 50%;
}
</style>
