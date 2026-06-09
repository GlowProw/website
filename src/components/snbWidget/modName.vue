<script setup lang="ts">

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id: string, grade?: string }>(),
    {locale: localLocale} = useI18nUtils(),
    {modification} = useI18nReadName()

let getTitle = computed(() => {
  return `${modification(props.id).name(localLocale.value) || '-'}`
})

defineOptions({
  name:"ModName"
})
</script>

<template>
  <span :class="`grade-${grade}-title`">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
