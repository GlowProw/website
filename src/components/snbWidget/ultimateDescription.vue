<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id: string }>(),
    {ultimate} = useI18nReadName()

let getDescription = computed(() => {
  return `${ultimate(props.id).description() || '-'}`
})

defineOptions({
  name: "UltimateDescription"
})
</script>

<template>
  <span>{{ getDescription }}</span>
</template>

<style scoped lang="less">

</style>
