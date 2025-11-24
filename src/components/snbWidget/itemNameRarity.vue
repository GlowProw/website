<script setup lang="ts">
import {Items} from "glow-prow-data/src/entity/Items";
import {rarity} from "@/assets/sripts/index";

const props = defineProps<{ id: string }>(),
    items = Items,
    rarityColorConfig = rarity.color

</script>

<template>
  <span :style="`color: color-mix(in srgb, hsl(from ${rarityColorConfig[items[id]?.rarity]} h s l) 30%, #fff)`">
      <slot></slot>
  </span>
</template>

<style scoped lang="less"></style>
