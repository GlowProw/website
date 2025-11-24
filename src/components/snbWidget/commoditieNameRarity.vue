<script setup lang="ts">
import {rarity} from "@/assets/sripts/index";
import {Commodities} from "glow-prow-data/src/entity/Commodities";

const props = withDefaults(
        defineProps<{ id: string }>(),
        {
          id: ''
        }
    ),
    commodities = Commodities,
    rarityColorConfig = rarity.color
</script>

<template>
  <span :style="`color: color-mix(in srgb, hsl(from ${rarityColorConfig[ commodities[id]?.rarity || '' ]} h s l) 30%, #fff)`">
      <slot></slot>
  </span>
</template>

<style scoped lang="less"></style>
