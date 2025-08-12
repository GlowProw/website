<script setup lang="ts">
import {computed} from "vue";
import {number} from "@/assets/sripts/index";
import {Item} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18nUtil";

const props = defineProps<{ data: Item, id?: string, tier?: number }>(),
    {asString, sanitizeString} = useI18nUtils()

let getTitle = computed(() => {
  return asString([
    `snb.items.${props.id || props.data.id}.name`,
    `snb.items.${sanitizeString(props.id || props.data.id).cleaned}.name`
  ]) + ` ${number.intToRoman(props.tier || props.data.tier)}`
})
</script>

<template>
  {{ getTitle }}
</template>

<style scoped lang="less">

</style>
