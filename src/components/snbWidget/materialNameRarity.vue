<script setup lang="ts">
import {Materials} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";

const props = withDefaults(
        defineProps<{ id: string }>(),
        {
          id: ''
        }
    ),
    materials = Materials,
    rarityColorConfig = rarity.color
</script>

<template>
  <span :style="`color: color-mix(in srgb, hsl(from ${rarityColorConfig[ materials[id]?.rarity || '' ]} h s l) 30%, #fff)`">
      <slot></slot>
  </span>
</template>

<style scoped lang="less"></style>
