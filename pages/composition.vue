<template>
  <div class="container">
    Composition...
    <br />
    <input v-model="showIt" type="checkbox" />
    <C1 v-if="showIt" />
  </div>
</template>

<script>
import C1 from '@/components/Composition1.vue'

export default {
  components: { C1 },
  data() {
    return {
      showIt: true
    }
  }
}
</script>
