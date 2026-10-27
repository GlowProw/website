<script setup lang="ts">
import { computed } from "vue";
import { activeTimezone, formatDateInUserTimezone } from "@/assets/sripts";

const props = defineProps<{ time: string | number | Date | undefined | unknown | null }>();

// 格式化展示安全时间字符串
const formattedTime = computed(() => {
  // 依赖 activeTimezone.value 保证在切换时区时响应式重算
  const _tz = activeTimezone.value;
  if (!props.time) return '—';
  const raw = props.time;
  const val = typeof raw === 'string' && !isNaN(Number(raw)) && raw.trim() !== '' ? Number(raw) : raw;
  const d = new Date(val as any);
  if (isNaN(d.getTime())) return '—';
  return formatDateInUserTimezone(d, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }, _tz);
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
