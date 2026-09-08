<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{ id: string | undefined }>(),
    {material} = useI18nReadName(),
    {localLocale} = use_local_locale()

const getDescription = computed(() => {
  if (!props.id) return '';
  return material(props.id).description(localLocale.value);
}),
isHasDescription = computed(() => !!getDescription.value)

defineExpose({
  isHasDescription
})

defineOptions({
  name: "MaterialDescription",
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
