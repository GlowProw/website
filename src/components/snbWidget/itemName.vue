<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name"
import {Item} from "glow-prow-data";

type EitherDataOrIdAndTier =
    | { data: Item; id?: never; tier?: never }
    | { data?: never; id: string; tier: number };

const props = defineProps<EitherDataOrIdAndTier>(),
    {item} = useI18nReadName()

let getTitle = computed(() => {
  return `${item(props.id || props.data?.id || '').name() || '-'}`
})

defineExpose({ name: getTitle })

defineOptions({
  name: "ItemName"
})
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
