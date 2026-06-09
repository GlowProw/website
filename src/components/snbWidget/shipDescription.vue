<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{ id: string }>(),
    {ship} = useI18nReadName(),
    {localLocale} = use_local_locale()

let getDescription = computed(() => {
  return `${ship(props.id).description(localLocale.value) || '-'}`
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
