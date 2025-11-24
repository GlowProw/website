<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {TreasureMap} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {computed} from "vue";

const
    props = defineProps<{ data: TreasureMap }>(),
    {t} = useI18n(),
    {sanitizeString} = useI18nUtils()

let title = computed(() => {
  const data = props.data;
  return `${t(`codex.treasureMap.names.${data?.category}`, {
    location: data?.territory?.id ? t(`snb.territories.${data?.territory?.id}.name`) : sanitizeString(data?.id)?.cleaned?.replaceAll('-', '\t')
  })} (${t(`codex.treasureMap.categorys.${data?.category}`)})`
})
</script>

<template>
  <span :title="title">{{ title }}</span>
</template>

<style scoped lang="less">

</style>
