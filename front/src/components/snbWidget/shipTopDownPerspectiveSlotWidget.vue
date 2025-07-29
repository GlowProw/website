<script setup lang="ts">
const props = withDefaults(defineProps<{activate: boolean}>(), {
  activate: false
})
</script>

<template>
  <div class="ship-perspective-slot" :class="[activate ? 'activate' : '']"></div>
</template>

<style scoped lang="less">
.ship-perspective-slot {
  background-color: #000;
  width: 10px;
  height: 10px;
  outline: 2px solid #000;
  border: 1px solid hsl(from var(--main-color) h s calc(l * 0.3));
}

.activate {
  background-color: var(--main-color);
}
</style>
