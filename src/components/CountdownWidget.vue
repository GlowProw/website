<script lang="ts">
export default {
  name: 'CountdownWidget',
};
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  target?: string | number | Date | null;
  startAt?: string | number | Date | null;
  status?: string;
  interval?: number;
  showPrefix?: boolean;
  showSeconds?: boolean;
  tag?: string;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  target: null,
  startAt: null,
  status: '',
  interval: 1000,
  showPrefix: true,
  showSeconds: false,
  tag: 'span',
  className: '',
});

const emit = defineEmits<{
  (e: 'end'): void;
  (e: 'start'): void;
}>();

const { t, te } = useI18n();

const now = ref(Date.now());
let timerId: ReturnType<typeof setInterval> | null = null;

const startTick = () => {
  if (timerId) clearInterval(timerId);
  now.value = Date.now();
  timerId = setInterval(() => {
    now.value = Date.now();
  }, Math.max(props.interval, 500));
};

const stopTick = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

watch(() => props.interval, () => {
  startTick();
});

onMounted(() => {
  startTick();
});

onUnmounted(() => {
  stopTick();
});

// 解析目标时间与开始时间
const targetTime = computed(() => {
  if (!props.target) return 0;
  return new Date(props.target).getTime();
});

const startTime = computed(() => {
  if (!props.startAt) return 0;
  return new Date(props.startAt).getTime();
});

// 计算状态
const isUpcoming = computed(() => {
  if (props.status === 'upcoming') return true;
  if (props.status === 'active' || props.status === 'ended') return false;
  return startTime.value > 0 && now.value < startTime.value;
});

const isEnded = computed(() => {
  if (props.status === 'ended') return true;
  if (!targetTime.value) return false;
  return now.value >= targetTime.value;
});

const isActive = computed(() => {
  if (props.status === 'active') return true;
  if (props.status === 'upcoming' || props.status === 'ended') return false;
  return !isUpcoming.value && !isEnded.value;
});

// 毫秒差计算
const diffMs = computed(() => {
  if (isUpcoming.value && startTime.value > 0) {
    return Math.max(0, startTime.value - now.value);
  }
  if (targetTime.value > 0) {
    return Math.max(0, targetTime.value - now.value);
  }
  return 0;
});

// 时间分量拆解
const days = computed(() => Math.floor(diffMs.value / (1000 * 60 * 60 * 24)));
const hours = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
const minutes = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60)) / (1000 * 60)));
const seconds = computed(() => Math.floor((diffMs.value % (1000 * 60)) / 1000));

// 状态变化事件监听
watch(isEnded, (ended, prev) => {
  if (ended && !prev) {
    emit('end');
  }
});

watch(isUpcoming, (upcoming, prev) => {
  if (!upcoming && prev) {
    emit('start');
  }
});

// 格式化展示文案
const formattedText = computed(() => {
  if (!targetTime.value && !startTime.value) return '';

  if (isEnded.value) {
    return t('drop.countdown.ended', '已截止');
  }

  if (isUpcoming.value) {
    const d = days.value;
    const h = hours.value;
    const m = minutes.value;
    if (d > 0) {
      return t('drop.countdown.upcomingDaysHours', { days: d, hours: h }, `还有 ${d} 天 ${h} 小时开启`);
    }
    if (h > 0) {
      return t('drop.countdown.upcomingHoursMinutes', { hours: h, minutes: m }, `还有 ${h} 小时 ${m} 分钟开启`);
    }
    return t('drop.countdown.startingSoon', '即将开启');
  }

  // Active 阶段
  const d = days.value;
  const h = hours.value;
  const m = minutes.value;
  const s = seconds.value;

  if (diffMs.value <= 60000 && !props.showSeconds) {
    return t('drop.countdown.endingSoon', '即将截止');
  }

  if (d > 0) {
    return t('drop.countdown.daysHours', { days: d, hours: h }, `剩余 ${d} 天 ${h} 小时`);
  }
  if (h > 0) {
    return t('drop.countdown.hoursMinutes', { hours: h, minutes: m }, `剩余 ${h} 小时 ${m} 分钟`);
  }
  if (props.showSeconds && m < 10) {
    return t('drop.countdown.minutesSeconds', { minutes: m, seconds: s }, `剩余 ${m} 分钟 ${s} 秒`);
  }
  return t('drop.countdown.minutesOnly', { minutes: Math.max(m, 1) }, `剩余 ${Math.max(m, 1)} 分钟`);
});
</script>

<template>
  <component :is="tag" :class="['countdown-widget', className]">
    <slot
      :days="days"
      :hours="hours"
      :minutes="minutes"
      :seconds="seconds"
      :diff-ms="diffMs"
      :is-ended="isEnded"
      :is-upcoming="isUpcoming"
      :is-active="isActive"
      :formatted-text="formattedText"
    >
      {{ formattedText }}
    </slot>
  </component>
</template>

<style scoped>
.countdown-widget {
  display: inline-flex;
  align-items: center;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
