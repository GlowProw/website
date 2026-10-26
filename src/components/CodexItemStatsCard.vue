<script setup lang="ts">
/**
 * 单个图鉴条目的站内统计卡片
 * 展示全站取得率、最近 12 周的取得率走势，数据口径与事态栏目一致
 */
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {VSparkline} from "vuetify/components/VSparkline";
import {usePublicStatsApi} from "@/assets/sripts/api/public_stats_service";
import type {PublicCodexItemStats} from "@/assets/types/Statistics";

const props = defineProps<{
  targetType: string
  targetId: string
}>()

const {t} = useI18n(),
    api = usePublicStatsApi(),
    stats = ref<PublicCodexItemStats | null>(null),
    loading = ref(false),
    hoverIndex = ref<number | null>(null)

/**
 * 拉取当前条目的站内统计
 * @param targetType 图鉴类型
 * @param targetId 图鉴条目 ID
 */
const onLoad = async (targetType: string, targetId: string) => {
  if (!targetType || !targetId) {
    stats.value = null
    return
  }
  loading.value = true
  stats.value = await api.getCodexItem(targetType, targetId)
  loading.value = false
}

/**
 * 条目标识变化时重新请求
 */
watch(() => [props.targetType, props.targetId], ([targetType, targetId]) => {
  hoverIndex.value = null
  void onLoad(targetType, targetId)
}, {immediate: true})

/**
 * 每周取得率序列
 */
const series = computed(() => stats.value?.weekly.map(week => week.rate) || [])

/**
 * 悬浮时展示对应周，否则展示整体取得率
 */
const displayRate = computed(() => {
  const index = hoverIndex.value
  if (index !== null) return series.value[index] ?? 0
  return stats.value?.rate ?? 0
})

/**
 * 副标题：悬浮时展示周区间
 */
const displayDetail = computed(() => {
  const index = hoverIndex.value
  if (index !== null) {
    const week = stats.value?.weekly[index]
    return week ? `${week.weekStart.slice(5).replace('-', '/')} - ${week.weekEnd.slice(5).replace('-', '/')}` : ''
  }
  return ''
})

/**
 * 最近一周与 12 周前的取得率差值，单位为百分点
 */
const trendChange = computed(() => {
  const weeks = stats.value?.weekly || []
  if (weeks.length < 2) return null
  return Math.round((weeks[weeks.length - 1].rate - weeks[0].rate) * 10) / 10
})

/**
 * 走势差值的展示文案
 */
const trendText = computed(() => {
  if (trendChange.value === null) return '—'
  const sign = trendChange.value > 0 ? '+' : ''
  return `${sign}${trendChange.value}%`
})

/**
 * 走势差值的颜色
 */
const trendColor = computed(() => {
  if (!trendChange.value) return 'grey'
  return trendChange.value > 0 ? 'green' : 'red'
})

defineOptions({
  name: 'CodexItemStatsCard'
})
</script>

<template>
  <!-- 站内图鉴统计 S -->
  <div class="mb-3">
    <div class="d-flex font-weight-bold ga-2 mb-2">{{ t('statistics.codexItem.title') }}</div>

    <v-row align="center">
      <v-col cols="auto" class="text-caption">
        <p class="text-h5 font-weight-bold text-amber">{{ displayRate }}%</p>
        {{ t('statistics.codexItem.rate') }}
      </v-col>
      <v-col>
        <v-divider></v-divider>
      </v-col>
      <v-col cols="auto" class="text-caption opacity-60 mt-1" v-if="displayDetail">{{ displayDetail }}</v-col>
    </v-row>

    <template v-if="stats">
      <v-sparkline
          :model-value="series"
          color="amber"
          height="56"
          line-width="2"
          padding="2"
          min="0"
          smooth="4"
          interactive
          class="my-3"
          @update:current-index="hoverIndex = $event ?? null"
          @mouseleave="hoverIndex = null">
      </v-sparkline>

      <div class="d-flex justify-space-between text-caption">
        <div>
          {{ t('statistics.codexItem.trend') }}
          <span class="text-caption mt-2" :class="`text-${trendColor}`">
            {{ t('statistics.codexItem.change') }} {{ trendText }}
          </span>
        </div>
        <span>{{ t('statistics.common.asOf') }} {{ stats.asOf }}</span>
      </div>
    </template>
  </div>
  <!-- 站内图鉴统计 E -->
</template>
