<script setup lang="ts">
defineProps<{size: number | string}>()
</script>

<template>
  <img src="@/assets/images/loading.gif" :width="size || '20px'" :height="size || '20px'"/>
</template>

<style scoped>

</style>
