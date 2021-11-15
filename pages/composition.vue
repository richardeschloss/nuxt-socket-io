<template>
  <div class="container">
    Composition...
    <br>
    <input v-model="showIt" type="checkbox">
    <!-- <Composition1 v-if="showIt" /> -->
  </div>
</template>

<script>
export default {
  data () {
    return {
      showIt: true
    }
  }
}
</script>
