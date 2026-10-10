<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name"
import {use_local_locale} from "@/assets/sripts/use_local_locale";
import type {EitherDataOrIdAndTier} from "@/assets/types/Codex";

const {localLocale} = use_local_locale()
const props = defineProps<EitherDataOrIdAndTier & { locale?: string }>()
const {item} = useI18nReadName()

let getTitle = computed(() => {
  return `${item(props.id || props.data?.id || '').name(props.locale || localLocale.value) || '-'}`
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
