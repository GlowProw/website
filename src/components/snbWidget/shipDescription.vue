<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id: string }>(),
    {ship} = useI18nReadName()

let getDescription = computed(() => {
  return `${ship(props.id).description() || '-'}`
})

defineOptions({
  name: "ShipDescription"
})
</script>

<template>
  <span>{{ getDescription }}</span>
</template>

<style scoped lang="less">

</style>
