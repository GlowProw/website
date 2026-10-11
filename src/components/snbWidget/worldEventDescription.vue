<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{ id: string | undefined, locale?: string }>(),
    {worldEvent} = useI18nReadName(),
    {localLocale} = use_local_locale()

const getDescription = computed(() => {
  if (!props.id) return '';
  return worldEvent(props.id).description(props.locale || localLocale.value);
}),
isHasDescription = computed(() => !!getDescription.value)

defineExpose({
  isHasDescription
})

defineOptions({
  name: "WorldEventDescription",
})
</script>

<template>
  <span :title="getDescription" v-if="isHasDescription">{{ getDescription }}</span>
</template>

<style scoped lang="less">
span {
  white-space: pre-line;
}
</style>
