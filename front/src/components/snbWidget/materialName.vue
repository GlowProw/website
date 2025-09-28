<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {rarity} from "@/assets/sripts/index";
import {Materials} from "glow-prow-data";

const {t} = useI18n(),
    materials = Materials,
    props = withDefaults(
        defineProps<{ id: string | undefined, isRarity?: boolean }>(),
        {
          isRarity: true
        }
    ),
    // 稀有度
    materialColorConfig = rarity.color
</script>

<template>
  <span :title="t(`snb.materials.${id}.name`)" :style="isRarity ? `color: color-mix(in srgb, hsl(from ${materialColorConfig[materials[id]?.rarity]} h s l) 30%, #fff)` : ''"
        v-tooltip="t(`snb.materials.${id}.name`)"
        v-if="id">{{ t(`snb.materials.${id}.name`) }}</span>
</template>

<style scoped lang="less">
.a {
  color: hal();
}
</style>
