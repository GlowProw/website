<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{
  id: string,
}>();

const i18nReadName = useI18nReadName();
const description = computed(() => {
  if (!props.id) return '';
  return i18nReadName.quest(props.id).description();
});

defineOptions({
  name: "QuestDescription"
});
</script>

<template>
  <span class="text-pre-wrap">{{ description }}</span>
</template>

<style scoped lang="less">
</style>
