<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id?: string, name?: string }>(),
    {locale: localLocale} = useI18nUtils(),
    {mastery} = useI18nReadName()

let getTitle = computed(() => {
  const key = props.id || props.name || ''
  return mastery(key).name(localLocale.value) || key || '-'
})

defineOptions({
  name: "MasteryName"
})
</script>

<template>
  <span>{{ getTitle }}</span>
</template>

<style scoped lang="less">
</style>
