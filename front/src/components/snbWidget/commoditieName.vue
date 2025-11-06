<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name"
import {Commodity} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps<{ data?: Commodity, id?: string, tier?: number }>(),
    {asString, sanitizeString} = useI18nUtils(),
    {commoditie} = useI18nReadName()

let getTitle = computed(() => {
  return `${commoditie(props.id || props.data?.id).name() || '-'}`
})
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
