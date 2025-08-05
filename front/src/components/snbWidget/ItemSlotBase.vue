<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: number | string, padding?: number | string }>(), {
  padding: 1,
  size: '80px'
})
</script>

<template>
  <span :class="`item-base-slot card-flavor pa-${padding}`" :style="`height: ${size}; width: ${size};min-height: ${size}; min-width: ${size}`">
    <slot></slot>
  </span>
</template>

<style scoped lang="less">
@import "@/assets/styles/flavor";

.item-base-slot {
  display: flex;
  background-image: @mask-image;
}
</style>
