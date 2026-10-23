<script setup lang="ts">
/**
 * 图鉴统计
 * 展示全站图鉴收藏量与收藏人数，并与上一等长区间对比
 */
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Apis} from "@/assets/sripts/api";
import type {PublicCodexStats, PublicStatsCardItem, PublicStatsRange} from "@/assets/types/Statistics";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import Loading from "@/components/Loading.vue";
import PublicStatsBreakdownList from "@/components/PublicStatsBreakdownList.vue";
import PublicStatsMetricCard from "@/components/PublicStatsMetricCard.vue";
import PublicStatsTrendChart from "@/components/PublicStatsTrendChart.vue";

const {t, te} = useI18n(),
    statsApi = Apis.publicStatsApi(),
    loading = ref(true),
    range = ref<PublicStatsRange>('30'),
    data = ref<PublicCodexStats | null>(null)

/**
 * 加载图鉴统计
 */
const onLoad = async () => {
  loading.value = true
  try {
    data.value = await statsApi.getCodex(range.value)
  } finally {
    loading.value = false
  }
}

onMounted(onLoad)

/**
 * 切换统计区间
 * @param value 区间
 */
const onRangeChange = async (value: PublicStatsRange) => {
  range.value = value
  await onLoad()
}

/**
 * 图鉴种类名称，缺失翻译时回退原始标识
 * @param kind 图鉴种类
 */
const kindName = (kind: string): string => {
  const path = `account.collectionStats.kinds.${kind}`
  return te(path) ? t(path) : kind
}

/**
 * 当前区间文案
 */
const rangeLabel = computed(() => t(`statistics.range.${range.value}`))

/**
 * 统计区间展示文案
 */
const periodLabel = computed(() => {
  if (!data.value) return ''
  return `${data.value.period.start} ~ ${data.value.period.end}`
})

/**
 * 每日日期，供卡片悬浮提示使用
 */
const dates = computed(() => (data.value?.daily || []).map(point => point.date))

/**
 * 每日当前区间数值
 */
const dailyValues = computed(() => (data.value?.daily || []).map(point => point.value))

/**
 * 概览卡片
 */
const cards = computed<PublicStatsCardItem[]>(() => {
  const metrics = data.value?.metrics
  return [
    {
      key: 'collections',
      title: t('statistics.codex.metrics.collections'),
      value: metrics?.collections.value || 0,
      icon: 'mdi-check-decagram',
      color: 'amber',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.collections.change || 0,
      changeRate: metrics?.collections.changeRate ?? null
    },
    {
      key: 'collectors',
      title: t('statistics.codex.metrics.collectors'),
      value: metrics?.collectors.value || 0,
      icon: 'mdi-account-multiple-outline',
      color: 'blue',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.collectors.change || 0,
      changeRate: metrics?.collectors.changeRate ?? null
    },
    {
      key: 'dailyAverage',
      title: t('statistics.codex.metrics.dailyAverage'),
      value: metrics?.dailyAverage.value || 0,
      icon: 'mdi-chart-timeline-variant',
      color: 'green',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.dailyAverage.change || 0,
      changeRate: metrics?.dailyAverage.changeRate ?? null
    },
    {
      key: 'coveredTypes',
      title: t('statistics.codex.metrics.coveredTypes'),
      value: metrics?.coveredTypes.value || 0,
      icon: 'mdi-shape-outline',
      color: 'purple',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.coveredTypes.change || 0,
      changeRate: metrics?.coveredTypes.changeRate ?? null
    },
  ]
})

defineOptions({
  name: 'StatisticsCodex'
})
</script>

<template>
  <v-card variant="text">
    <v-row class="mb-3">
      <v-col cols="12" lg="auto">
        <div class="d-flex align-center ga-2">
          <span class="opacity-60">{{ t('statistics.common.range') }}:</span>
          <v-btn-toggle :model-value="range" density="compact" variant="tonal" color="amber"
                        @update:model-value="onRangeChange">
            <v-btn value="7">{{ t('statistics.range.7') }}</v-btn>
            <v-btn value="30">{{ t('statistics.range.30') }}</v-btn>
            <v-btn value="90">{{ t('statistics.range.90') }}</v-btn>
          </v-btn-toggle>
        </div>
      </v-col>
      <v-spacer class="hidden-sm hidden-md"></v-spacer>
      <v-col cols="12" lg="auto" class="text-lg-right">
        <div class="opacity-60">{{ t('statistics.common.period') }}: {{ periodLabel }}</div>
        <div v-if="data" class="opacity-60">
          {{ t('statistics.common.updated') }}: {{ new Date(data.updatedAt).toLocaleString() }}
        </div>
      </v-col>
    </v-row>

    <Loading v-if="loading" size="50"></Loading>

    <template v-else>
      <!-- 概览卡片区 S -->
      <v-row density="compact" class="mt-2 mb-5" :gap="15">
        <v-col cols="12" sm="6" md="4" lg="4" v-for="card in cards" :key="card.key">
          <PublicStatsMetricCard :card="card" :dates="dates"></PublicStatsMetricCard>
        </v-col>
      </v-row>
      <!-- 概览卡片区 E -->

      <v-row>
        <v-col cols="12" lg="8">
          <AffixBoxHasTitleView>
            <template v-slot:title>
              <v-icon size="18" color="amber" class="mb-2">mdi-chart-line</v-icon>
              {{ t('statistics.codex.trend') }}
            </template>

            <PublicStatsTrendChart :points="data?.daily || []" color="#ffc107"></PublicStatsTrendChart>
          </AffixBoxHasTitleView>
        </v-col>

        <v-col cols="12" lg="4">
          <AffixBoxHasTitleView>
            <template v-slot:title>
              <v-icon size="18" color="blue" class="mb-2">mdi-shape-outline</v-icon>
              {{ t('statistics.codex.byType') }}
            </template>

            <PublicStatsBreakdownList :items="data?.byType || []" :label="kindName" color="blue"></PublicStatsBreakdownList>
          </AffixBoxHasTitleView>
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>
