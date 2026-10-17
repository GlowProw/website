<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ time: string | number | Date | undefined | unknown | null }>();

// 格式化展示安全时间字符串
const formattedTime = computed(() => {
  if (!props.time) return '—';
  const raw = props.time;
  const val = typeof raw === 'string' && !isNaN(Number(raw)) && raw.trim() !== '' ? Number(raw) : raw;
  const d = new Date(val as any);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString();
});

defineOptions({
  name: 'Time'
});
</script>

<template>
  <span>{{ formattedTime }}</span>
</template>

<style scoped lang="less">

</style>
