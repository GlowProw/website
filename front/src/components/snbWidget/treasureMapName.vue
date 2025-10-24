<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {TreasureMap} from "glow-prow-data";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const
    props = defineProps<{ data?: TreasureMap, id?: string }>(),
    {t} = useI18n(),
    i18nReadName = useI18nReadName()
</script>

<template>
  {{ i18nReadName.treasureMap(id || data.id).name() || '-'}}
</template>

<style scoped lang="less">

</style>
