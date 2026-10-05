<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), {
  size: '20px'
})

defineOptions({
  name: 'Loading'
})
</script>

<template>
  <img src="@/assets/images/loading.gif" :width="size || '20px'" :height="size || '20px'"/>
</template>

<style scoped>

</style>
