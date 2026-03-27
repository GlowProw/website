<script setup lang="ts">
import {TreasureMap} from "glow-prow-data";
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ data: TreasureMap }>(),
    {treasureMap} = useI18nReadName()

let getTitle = computed(() => {
  return `${treasureMap(props?.data?.id).name(props.data?.category) || '-'}`
})

defineOptions({
  name: "TreasureMapName"
})
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
