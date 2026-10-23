<script setup lang="ts">
/**
 * 公开统计概览卡片
 * 卡片结构对齐账户数据中心的概览卡片，悬浮时展示当日数值
 */
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {VSparkline} from "vuetify/components/VSparkline";
import type {PublicStatsCardItem} from "@/assets/types/Statistics";

const props = defineProps<{
  card: PublicStatsCardItem
  dates: string[]
}>()

const {t} = useI18n(),
    hoverIndex = ref<number | null>(null)

/**
 * 悬浮时展示对应日期数值，否则展示汇总值
 */
const displayValue = computed(() => {
  const index = hoverIndex.value
  if (index === null) return props.card.value
  return props.card.series[index] ?? 0
})

/**
 * 卡片副标题：悬浮时展示日期，否则展示统计区间
 */
const displayDetail = computed(() => {
  const index = hoverIndex.value
  if (index === null) return props.card.detail
  return props.dates[index] || props.card.detail
})

/**
 * 与上一区间的变化文案
 */
const changeText = computed(() => {
  const {change, changeRate} = props.card
  const sign = change > 0 ? '+' : ''
  const rate = changeRate === null ? '—' : `${sign}${changeRate}%`
  return `${sign}${change.toLocaleString()} (${rate})`
})

/**
 * 变化方向对应的颜色
 */
const changeColor = computed(() => {
  if (props.card.change > 0) return 'green'
  if (props.card.change < 0) return 'red'
  return 'grey'
})

defineOptions({
  name: 'PublicStatsMetricCard'
})
</script>

<template>
  <v-card
      border
      rounded="lg"
      variant="text"
      min-height="160px"
      class="d-flex flex-column justify-center h-100"
      :style="`background-color: color-mix(in srgb, ${card.color} 20%, #000 70%)`">
    <div style="opacity: .05; font-size: 7.2rem; position: absolute; left: 0; bottom: 0">
      <v-icon :icon="card.icon" :color="card.color" class="mr-1"></v-icon>
    </div>

    <v-row>
      <v-col cols="5" class="px-6 py-3">
        <div class="opacity-60 mb-1">
          {{ card.title }}
        </div>

        <div class="text-h4 font-weight-bold" :class="`text-${card.color}`">
          {{ displayValue.toLocaleString() }}
        </div>

        <div class="opacity-40 mt-1">
          {{ displayDetail }}
        </div>

        <div class="mt-2 text-caption" :class="`text-${changeColor}`">
          {{ t('statistics.common.comparePrevious') }} {{ changeText }}
        </div>
      </v-col>

      <v-col>
        <v-sparkline
            :model-value="card.series"
            :color="card.color"
            height="200"
            line-width="2"
            marker-size="10"
            min="0"
            padding="10"
            smooth="0"
            interactive
            @update:current-index="hoverIndex = $event ?? null"
            @mouseleave="hoverIndex = null">
        </v-sparkline>
      </v-col>
    </v-row>
  </v-card>
</template>
