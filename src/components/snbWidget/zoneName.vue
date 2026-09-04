<script setup lang="ts">
import { computed } from "vue";
import { use_local_locale } from "@/assets/sripts/use_local_locale";
import { useI18n } from "vue-i18n";

type EitherDataOrId =
  | { data: any; id?: never }
  | { data?: never; id: string | number };

const { localLocale } = use_local_locale();
const { t } = useI18n();
const props = defineProps<EitherDataOrId & { name?: string; locale?: string }>();

const getTitle = computed(() => {
  const key = String(props.id || props.name || props.data?.id || props.data?.name || '').trim();
  if (!key) return '-';

  const tKey1 = `stateOfWar.zones.${key}`;
  const tr1 = t(tKey1);
  if (tr1 !== tKey1) return tr1;

  const tKey2 = `snb.zones.${key}`;
  const tr2 = t(tKey2);
  if (tr2 !== tKey2) return tr2;

  return key;
});

defineExpose({ name: getTitle });

defineOptions({
  name: "ZoneName"
});
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
