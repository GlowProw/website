<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {Item} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps<{ data: Item | Ship }>(),
    {t} = useI18n(),
    {sanitizeString} = useI18nUtils()
</script>

<template>
  {{ t(`snb.items.${sanitizeString(props.data.id).cleaned}.description.${props.data.tier}`) }}
</template>

<style scoped lang="less">

</style>
