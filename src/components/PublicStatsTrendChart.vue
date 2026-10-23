<script setup lang="ts">
/**
 * 公开统计趋势图
 * 同轴对比当前区间与上一区间的每日数值
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const props = defineProps<{
  points: Array<{ date: string; value: number; previousValue: number }>
  color?: string
}>()

const {t} = useI18n()

const width = 720,
    height = 220,
    padding = {top: 16, right: 16, bottom: 28, left: 40}

/**
 * 图表可用绘图区尺寸
 */
const chartWidth = computed(() => width - padding.left - padding.right)
const chartHeight = computed(() => height - padding.top - padding.bottom)

/**
 * 两组序列的最大值，至少为 1 避免除零
 */
const maxValue = computed(() => {
  const values = props.points.flatMap(point => [point.value, point.previousValue])
  return Math.max(1, ...values)
})

/**
 * 将数值与序号映射为 SVG 坐标
 * @param value 数值
 * @param index 序号
 */
const toPoint = (value: number, index: number): [number, number] => {
  const step = props.points.length > 1 ? chartWidth.value / (props.points.length - 1) : 0
  const x = padding.left + step * index
  const y = padding.top + chartHeight.value - (value / maxValue.value) * chartHeight.value
  return [x, y]
}

/**
 * 折线路径
 * @param key 序列字段
 */
const linePath = (key: 'value' | 'previousValue'): string => {
  return props.points
      .map((point, index) => {
        const [x, y] = toPoint(point[key], index)
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
}

/**
 * 当前序列的填充区域路径
 */
const areaPath = computed(() => {
  if (!props.points.length) return ''
  const [firstX] = toPoint(props.points[0].value, 0)
  const [lastX] = toPoint(props.points[props.points.length - 1].value, props.points.length - 1)
  const bottom = padding.top + chartHeight.value
  return `${linePath('value')} L${lastX.toFixed(2)} ${bottom} L${firstX.toFixed(2)} ${bottom} Z`
})

/**
 * 横轴刻度，最多显示 6 个日期
 */
const xTicks = computed(() => {
  const count = props.points.length
  if (!count) return []
  const step = Math.max(1, Math.ceil(count / 6))
  return props.points
      .map((point, index) => ({point, index}))
      .filter(item => item.index % step === 0 || item.index === count - 1)
})

/**
 * 横轴日期简写为 MM/DD
 */
const shortDate = (date: string): string => date.slice(5).replace('-', '/')

defineOptions({
  name: 'PublicStatsTrendChart'
})
</script>

<template>
  <div class="w-100">
    <div class="d-flex ga-4 mb-2 text-caption opacity-70">
      <span class="d-flex align-center ga-1">
        <span class="d-inline-block rounded-circle" style="width: 8px; height: 8px; background-color: var(--v-theme-amber, #ffc107)"></span>
        {{ t('statistics.common.currentPeriod') }}
      </span>
      <span class="d-flex align-center ga-1">
        <span class="d-inline-block rounded-circle bg-grey" style="width: 8px; height: 8px"></span>
        {{ t('statistics.common.previousPeriod') }}
      </span>
    </div>

    <svg :viewBox="`0 0 ${width} ${height}`" class="w-100" style="max-height: 260px">
      <!-- 网格线 S -->
      <g>
        <line v-for="i in 4" :key="`grid-${i}`"
              :x1="padding.left"
              :x2="width - padding.right"
              :y1="padding.top + chartHeight / 4 * (i - 1)"
              :y2="padding.top + chartHeight / 4 * (i - 1)"
              stroke="currentColor" stroke-width="1" opacity=".08"></line>
      </g>
      <!-- 网格线 E -->

      <!-- 上一区间折线 S -->
      <path :d="linePath('previousValue')" fill="none" stroke="currentColor" stroke-width="2" opacity=".28"
            stroke-linejoin="round" stroke-linecap="round"></path>
      <!-- 上一区间折线 E -->

      <!-- 当前区间面积与折线 S -->
      <path :d="areaPath" :fill="color || '#ffc107'" opacity=".12"></path>
      <path :d="linePath('value')" fill="none" :stroke="color || '#ffc107'" stroke-width="2"
            stroke-linejoin="round" stroke-linecap="round"></path>
      <!-- 当前区间面积与折线 E -->

      <!-- 横轴日期 S -->
      <g v-for="tick in xTicks" :key="`x-${tick.index}`">
        <text :x="toPoint(tick.point.value, tick.index)[0]"
              :y="height - 8"
              text-anchor="middle"
              font-size="11"
              fill="currentColor"
              opacity=".5">
          {{ shortDate(tick.point.date) }}
        </text>
      </g>
      <!-- 横轴日期 E -->
    </svg>
  </div>
</template>
