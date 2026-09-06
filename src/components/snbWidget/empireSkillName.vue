<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id: string }>(),
    {locale: localLocale} = useI18nUtils(),
    {empireSkill} = useI18nReadName()

let getTitle = computed(() => {
  return `${empireSkill(props.id).name(localLocale.value) || '-'}`
})

defineOptions({
  name: "EmpireSkillName"
})
</script>

<template>
  <span>{{ getTitle }}</span>
</template>

<style scoped lang="less">
</style>
