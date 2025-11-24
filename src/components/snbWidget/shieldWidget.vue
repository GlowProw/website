<script setup lang="ts">
const props = withDefaults(
    defineProps<{ size: number }>(),
    {
      size: 35
    }
)
</script>

<template>
  <v-card variant="text" class="text-no-wrap pointer-events-none shieid-card d-flex justify-center align-center" :width="size" :height="size">
    <template v-slot:image>
      <v-icon :size="size" style="position: absolute; top: 0;left: 0;color: black">mdi-shield</v-icon>
      <v-icon :size="size" style="font-weight: lighter">mdi-shield-outline</v-icon>
    </template>
    <div class="text-center font-weight-bold text">
      <slot></slot>
    </div>
  </v-card>
</template>

<style scoped lang="less">
.shieid-card .text {
  font-size: 13px;
}
</style>
