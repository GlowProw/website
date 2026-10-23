<script setup lang="ts">
/**
 * 签到统计
 * 展示全站签到量、签到人数与平台分布，并与上一等长区间对比
 */
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {storeToRefs} from "pinia";
import {Apis} from "@/assets/sripts/api";
import {useAuthStore} from "~/stores/userAccountStore";
import type {PublicSigninStats, PublicStatsCardItem, PublicStatsRange} from "@/assets/types/Statistics";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import Loading from "@/components/Loading.vue";
import PublicStatsBreakdownList from "@/components/PublicStatsBreakdownList.vue";
import PublicStatsMetricCard from "@/components/PublicStatsMetricCard.vue";
import PublicStatsTrendChart from "@/components/PublicStatsTrendChart.vue";

const {t, te} = useI18n(),
    route = useRoute(),
    authStore = useAuthStore(),
    {isLogin} = storeToRefs(authStore),
    statsApi = Apis.publicStatsApi(),
    loading = ref(true),
    range = ref<PublicStatsRange>('30'),
    data = ref<PublicSigninStats | null>(null)

/**
 * 加载签到统计
 */
const onLoad = async () => {
  if (!isLogin.value) {
    loading.value = false
    data.value = null
    return
  }
  loading.value = true
  try {
    data.value = await statsApi.getSignin(range.value)
  } finally {
    loading.value = false
  }
}

onMounted(onLoad)

// 登录状态变化时重新加载，登录后无需手动刷新页面
watch(isLogin, () => {
  onLoad()
})

/**
 * 登录页地址，登录后回到当前页
 */
const signinTarget = computed(() => ({
  name: 'signin',
  params: {lang: route.params.lang},
  query: {backUrl: route.fullPath}
}))

/**
 * 切换统计区间
 * @param value 区间
 */
const onRangeChange = async (value: PublicStatsRange) => {
  range.value = value
  await onLoad()
}

/**
 * 平台名称，缺失翻译时回退原始标识
 * @param platform 平台标识
 */
const platformName = (platform: string): string => {
  const path = `statistics.signin.platforms.${platform}`
  return te(path) ? t(path) : platform
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
      key: 'signins',
      title: t('statistics.signin.metrics.signins'),
      value: metrics?.signins.value || 0,
      icon: 'mdi-calendar-check-outline',
      color: 'amber',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.signins.change || 0,
      changeRate: metrics?.signins.changeRate ?? null
    },
    {
      key: 'users',
      title: t('statistics.signin.metrics.users'),
      value: metrics?.users.value || 0,
      icon: 'mdi-account-multiple-outline',
      color: 'blue',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.users.change || 0,
      changeRate: metrics?.users.changeRate ?? null
    },
    {
      key: 'dailyAverage',
      title: t('statistics.signin.metrics.dailyAverage'),
      value: metrics?.dailyAverage.value || 0,
      icon: 'mdi-chart-timeline-variant',
      color: 'green',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.dailyAverage.change || 0,
      changeRate: metrics?.dailyAverage.changeRate ?? null
    },
    {
      key: 'makeup',
      title: t('statistics.signin.metrics.makeup'),
      value: metrics?.makeup.value || 0,
      icon: 'mdi-calendar-refresh-outline',
      color: 'purple',
      series: dailyValues.value,
      detail: rangeLabel.value,
      change: metrics?.makeup.change || 0,
      changeRate: metrics?.makeup.changeRate ?? null
    },
  ]
})

defineOptions({
  name: 'StatisticsSignin'
})
</script>

<template>
  <v-card variant="text">
    <!-- 未登录提示 S -->
    <div v-if="!isLogin" class="d-flex flex-column align-center justify-center text-center py-16">
      <v-icon icon="mdi-lock-outline" size="64" color="amber" class="mb-4"></v-icon>
      <div class="text-h6">{{ t('statistics.signin.needLoginTitle') }}</div>
      <p class="opacity-60 mt-2 mb-6">{{ t('statistics.signin.needLoginDesc') }}</p>
      <v-btn color="amber" variant="flat" :to="signinTarget">
        {{ t('statistics.signin.needLoginAction') }}
      </v-btn>
    </div>
    <!-- 未登录提示 E -->

    <template v-else>
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
              {{ t('statistics.signin.trend') }}
            </template>

            <PublicStatsTrendChart :points="data?.daily || []" color="#ffc107"></PublicStatsTrendChart>
          </AffixBoxHasTitleView>
        </v-col>

        <v-col cols="12" lg="4">
          <AffixBoxHasTitleView>
            <template v-slot:title>
              <v-icon size="18" color="blue" class="mb-2">mdi-monitor-multiple</v-icon>
              {{ t('statistics.signin.byPlatform') }}
            </template>

            <PublicStatsBreakdownList :items="data?.byPlatform || []" :label="platformName"
                                      color="blue"></PublicStatsBreakdownList>
          </AffixBoxHasTitleView>
        </v-col>
      </v-row>
    </template>
    </template>
  </v-card>
</template>
