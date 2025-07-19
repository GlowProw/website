<script setup lang="ts">
defineProps<{size: number}>()
</script>

<template>
  <img src="../assets/images/loading.gif" :width="size || 20" :height="size || 20"/>
</template>

<style scoped>

</style>
