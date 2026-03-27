<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name"
import {Commodity} from "glow-prow-data";

const props = defineProps<{ data?: Commodity, id?: string, tier?: number }>(),
    {commoditie} = useI18nReadName()

let getTitle = computed(() => {
  return `${commoditie(props.id || props.data?.id).name() || '-'}`
})

defineOptions({
  name: "CommoditieName"
})
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
