<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{ id: string | undefined, format?: 'name' | 'shortName' | 'fullName', locale?: string }>(),
    {season} = useI18nReadName(),
    {localLocale} = use_local_locale()

let getTitle = computed(() => {
  if (!props.id) return '-'
  const s = season(props.id)
  const loc = props.locale || localLocale.value
  if (props.format === 'shortName') {
    return s.shortName(loc) || '-'
  } else if (props.format === 'fullName') {
    return s.fullName(loc) || '-'
  }
  return s.name(loc) || '-'
})

defineExpose({ name: getTitle })

defineOptions({
  name: "SeasonName"
})
</script>

<template>
  <span :title="getTitle" v-if="id">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
