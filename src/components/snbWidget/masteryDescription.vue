<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{ id: string | undefined }>(),
    {mastery} = useI18nReadName(),
    {localLocale} = use_local_locale()

let getDescription = computed(() => {
  if (!props.id) return '';
  return `${mastery(props.id).description(localLocale.value) || '-'}`;
}),
isHasDescription = computed(() => !!getDescription.value && getDescription.value !== '-');

defineExpose({
  isHasDescription
})

defineOptions({
  name: "MasteryDescription"
})
</script>

<template>
  <span class="mastery-description">{{ getDescription }}</span>
</template>

<style scoped lang="less">
.mastery-description {
  white-space: pre-line;
}
</style>
