<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id: string }>(),
    {mapLocation} = useI18nReadName()

let getTitle = computed(() => {
  return `${mapLocation(props.id).name() || '-'}`
})

defineOptions({
  name: "MapLocationNameWidget"
})
</script>

<template>
  <span>{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
