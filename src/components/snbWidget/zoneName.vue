<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import type {EitherDataOrId} from "@/assets/types/Codex";

const {t} = useI18n();
const props = defineProps<EitherDataOrId & { name?: string; locale?: string }>();

const getTitle = computed(() => {
  const key = String(props.id || props.name || props.data?.id || props.data?.name || '').trim();
  if (!key) return '-';

  const tKey1 = `snb.zones.${key}`;
  const tr1 = t(tKey1);
  if (tr1 !== tKey1) return tr1;

  return key;
});

defineExpose({name: getTitle});

defineOptions({
  name: "ZoneName"
});
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
