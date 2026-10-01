<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = withDefaults(defineProps<{
  id: string,
  rawKey?: boolean,
}>(), {
  rawKey: false,
});

const i18nReadName = useI18nReadName();
const name = computed(() => {
  if (!props.id) return '';
  return i18nReadName.quest(props.id).name();
});

defineOptions({
  name: "QuestName"
});
</script>

<template>
  <span>{{ name || id }}</span>
</template>

<style scoped lang="less">
</style>
