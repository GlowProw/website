<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{ id: string | undefined, locale?: string }>(),
    {worldEvent} = useI18nReadName(),
    {localLocale} = use_local_locale()

let getTitle = computed(() => {
  if (!props.id) return '-'
  return `${worldEvent(props.id).name(props.locale || localLocale.value) || '-'}`
})

defineExpose({ name: getTitle })

defineOptions({
  name: "WorldEventName"
})
</script>

<template>
  <span :title="getTitle" v-if="id">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
