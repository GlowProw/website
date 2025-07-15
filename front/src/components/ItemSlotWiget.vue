<script setup lang="ts">
defineProps<{ data: string }>()
</script>

<template>
<div>
  <img :src="`src/assets/items/${data.id}.png`">
  <code>({{data.tier}})</code>
</div>
</template>

<style scoped>

</style>
