<script setup lang="ts">
/**
 * 公开统计分组排行
 * 以横向进度条展示各分组占比，并给出与上一区间的变化
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const props = defineProps<{
  items: Array<{ key: string; value: number; previous: number; change: number; changeRate: number | null }>
  label: (key: string) => string
  color?: string
}>()

const {t} = useI18n()

/**
 * 分组最大值，用于计算进度条宽度
 */
const maxValue = computed(() => Math.max(1, ...props.items.map(item => item.value)))

/**
 * 变化文案
 * @param change 变化量
 * @param changeRate 变化率
 */
const changeText = (change: number, changeRate: number | null): string => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toLocaleString()} (${changeRate === null ? '—' : `${sign}${changeRate}%`})`
}

/**
 * 变化方向对应的颜色
 * @param change 变化量
 */
const changeColor = (change: number): string => {
  if (change > 0) return 'green'
  if (change < 0) return 'red'
  return 'grey'
}

defineOptions({
  name: 'PublicStatsBreakdownList'
})
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <div v-for="item in items" :key="item.key">
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="text-body-2">{{ label(item.key) }}</span>
        <span class="text-body-2 font-weight-bold">{{ item.value.toLocaleString() }}</span>
      </div>

      <v-progress-linear
          :model-value="item.value / maxValue * 100"
          :color="color || 'amber'"
          height="6"
          rounded
          bg-opacity=".08"></v-progress-linear>

      <div class="d-flex align-center justify-space-between mt-1 text-caption opacity-60">
        <span>{{ t('statistics.common.previousValue') }} {{ item.previous.toLocaleString() }}</span>
        <span :class="`text-${changeColor(item.change)}`">{{ changeText(item.change, item.changeRate) }}</span>
      </div>
    </div>

    <div v-if="!items.length" class="text-center opacity-40 py-6 text-caption">
      {{ t('statistics.common.noData') }}
    </div>
  </div>
</template>
