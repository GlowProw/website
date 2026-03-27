<script setup lang="ts">
import {Ship} from "glow-prow-data";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ data?: Ship, id?: string }>(),
    {ship} = useI18nReadName()

let getTitle = computed(() => {
  return `${ship(props.id || props.data?.id).name() || '-'}`
})

defineOptions({
  name: "ShipName"
})
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
