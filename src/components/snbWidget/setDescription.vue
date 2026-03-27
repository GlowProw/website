<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id: string | undefined }>(),
    {set} = useI18nReadName()

let getDescription = computed(() => {
  return `${set(props.id).description() || '-'}`
})

defineOptions({
  name: "SetDescription",
})
</script>

<template>
  <span :title="getDescription">{{ getDescription }}</span>
</template>

<style scoped lang="less">

</style>
