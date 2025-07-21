<script setup lang="ts">
defineProps<{ size: number | string }>()
</script>

<template>
  <div class="v-item-slot card-flavor pa-3" :style="`height: ${size}; width: ${size};min-height: ${size}; min-width: ${size}`">
    <slot></slot>
  </div>
</template>

<style scoped lang="less">
.v-item-slot {
  display: flex;
}
</style>
