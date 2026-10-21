<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";
import type {BotAccountOverview, BotOverviewChartPoint, BotOverviewDayPoint, BotOverviewSeries} from "@/assets/types/Bot";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import Loading from "@/components/Loading.vue";
import TimeView from "@/components/TimeView.vue";
import {VSparkline} from "vuetify/components/VSparkline";

const {t} = useI18n(),
    notice = useNoticeStore(),
    loading = ref(false),
    overview = ref<BotAccountOverview | null>(null)

// 群组曲线使用的低饱和色板，避免过于鲜艳抢眼
const LINE_COLORS = ['#4E6E81', '#6B8E7B', '#8A6E5C', '#5E6E8C', '#7B6F8E', '#6E7F5E', '#8C6A7B', '#5F7A8A']

/**
 * 用群 OpenID 计算稳定色号，保证同一群在各图表中颜色一致
 * @param groupOpenid 群 OpenID
 */
const colorOfGroup = (groupOpenid: string) => {
  let hash = 0
  for (let i = 0; i < groupOpenid.length; i++) {
    hash = (hash * 31 + groupOpenid.charCodeAt(i)) >>> 0
  }
  return LINE_COLORS[hash % LINE_COLORS.length]
}

defineOptions({
  name: 'AccountBotOverview'
})

/**
 * 把多群每日数据合并成一条按日期排序的总量曲线，用于卡片上的迷你走势
 * @param series 各群每日统计
 */
const mergeByDate = (series: BotOverviewSeries[] = []) => {
  const merged = new Map<string, number>()
  series.forEach(item => {
    item.days.forEach(day => {
      merged.set(day.date, (merged.get(day.date) || 0) + (Number(day.count) || 0))
    })
  })
  return [...merged.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({date, count}))
}

// 当前查看的群组，只展示单个群的统计
const selectedGroup = ref('')

const groupOptions = computed(() => {
  const map = new Map<string, string>()
  ;(overview.value?.messages?.series || []).forEach(item => map.set(item.groupOpenid, item.groupName))
  ;(overview.value?.signin?.series || []).forEach(item => {
    if (!map.has(item.groupOpenid)) map.set(item.groupOpenid, item.groupName)
  })
  return [...map.entries()].map(([value, title]) => ({title, value}))
})

/**
 * 只保留当前选中群组的曲线数据
 * @param series 全部群的每日统计
 */
const filterByGroup = (series: BotOverviewSeries[] = []) =>
    selectedGroup.value ? series.filter(item => item.groupOpenid === selectedGroup.value) : []

const activeSigninSeries = computed(() => filterByGroup(overview.value?.signin?.series || []))
const activeMessageSeries = computed(() => filterByGroup(overview.value?.messages?.series || []))

const activeSigninTotal = computed(() => activeSigninSeries.value.reduce(
    (sum, item) => sum + item.days.reduce((s, day) => s + (Number(day.count) || 0), 0), 0))

const signinSparkline = computed(() => mergeByDate(activeSigninSeries.value))
const messageSparkline = computed(() => mergeByDate(activeMessageSeries.value))

const activeSigninTop = computed(() => {
  const top = overview.value?.signin?.top || []
  return selectedGroup.value ? top.filter(item => item.groupOpenid === selectedGroup.value) : []
})

const activeMessageTypes = computed(() =>
    overview.value?.messages?.typesByGroup?.find(item => item.groupOpenid === selectedGroup.value)?.types)

const activeCommandDays = computed(() =>
    overview.value?.messages?.commandDailyByGroup?.find(item => item.groupOpenid === selectedGroup.value)?.days || [])

/**
 * 把逐日指令数据整理成分组柱状图，每天一组、每条指令一根柱
 */
const commandChart = computed(() => {
  const days = activeCommandDays.value
  if (days.length === 0) return {bars: [], labels: [], commands: [], max: 0}

  const totals = new Map<string, number>()
  days.forEach(day => day.commands.forEach(item => {
    totals.set(item.command, (totals.get(item.command) || 0) + item.count)
  }))
  const names = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

  const width = 640
  const padX = 24
  const baseY = 190
  const chartHeight = 160
  const max = Math.max(1, ...days.flatMap(day => names.map(name =>
      Number(day.commands.find(item => item.command === name)?.count) || 0)))
  const slot = (width - padX * 2) / days.length
  const barWidth = Math.max(3, Math.min(16, (slot * 0.72) / Math.max(1, names.length)))

  const bars = days.flatMap((day, dayIndex) => names.map((name, nameIndex) => {
    const count = Number(day.commands.find(item => item.command === name)?.count) || 0
    const barHeight = (count / max) * chartHeight
    const x = padX + dayIndex * slot + (slot - barWidth * names.length) / 2 + nameIndex * barWidth
    return {
      key: `${day.date}-${name}`,
      date: day.date,
      command: name,
      count,
      x: Number(x.toFixed(1)),
      y: Number((baseY - barHeight).toFixed(1)),
      width: Number(barWidth.toFixed(1)),
      height: Number(barHeight.toFixed(1)),
      color: LINE_COLORS[nameIndex % LINE_COLORS.length]
    }
  }))

  const step = Math.max(1, Math.ceil(days.length / 8))
  const labels = days
      .map((day, index) => ({
        x: Number((padX + index * slot + slot / 2).toFixed(1)),
        text: day.date.slice(5),
        index
      }))
      .filter(item => item.index % step === 0)
  const commands = names.map((name, index) => ({name, color: LINE_COLORS[index % LINE_COLORS.length]}))

  return {bars, labels, commands, max}
})

const activePartialGroups = computed(() => {
  const list = overview.value?.messages?.partialModeGroups || []
  return selectedGroup.value ? list.filter(item => item.groupOpenid === selectedGroup.value) : []
})

// 群维度推送额度与总体使用比例
const groupQuotas = computed(() => overview.value?.groupQuotas || [])
const quotaTotals = computed(() => groupQuotas.value.reduce((acc, item) => {
  acc.used += Number(item.usedCount) || 0
  acc.limit += Number(item.limitCount) || 0
  return acc
}, {used: 0, limit: 0}))
const quotaPercent = computed(() => quotaTotals.value.limit > 0
    ? Math.min(100, (quotaTotals.value.used / quotaTotals.value.limit) * 100)
    : 0)

// 错误统计只取当前选中的群组
const activeErrors = computed(() =>
    (overview.value?.errors?.items || []).filter(item => item.groupOpenid === selectedGroup.value))
const activeErrorCount = computed(() => {
  const row = overview.value?.errors?.counts?.find(item => item.groupOpenid === selectedGroup.value)
  return Number(row?.count) || 0
})

/**
 * 错误类型对应的标签颜色
 * @param type 错误类型
 */
const errorChipColor = (type: string) => ({push: 'amber', command: 'blue', group: 'teal'}[type] || 'grey')

const cards = computed(() => {
  const data = overview.value
  return [
    {
      key: 'groups',
      icon: 'mdi-account-group-outline',
      color: 'blue',
      title: t('account.bot.overview.groups'),
      value: data?.groups ?? 0,
      sub: t('account.bot.overview.groupsUnit'),
      sparkline: [] as BotOverviewDayPoint[]
    },
    {
      key: 'subscribedGroups',
      icon: 'mdi-bell-ring-outline',
      color: 'teal',
      title: t('account.bot.overview.subscribedGroups'),
      value: data?.subscriptionGroups ?? 0,
      sub: t('account.bot.overview.groupsUnit'),
      sparkline: [] as BotOverviewDayPoint[]
    },
    {
      key: 'monthSignin',
      icon: 'mdi-calendar-check-outline',
      color: '#ffc107',
      title: t('account.bot.overview.monthSignin'),
      value: activeSigninTotal.value,
      sub: data?.signin?.month || '-',
      sparkline: signinSparkline.value
    },
    {
      key: 'sent',
      icon: 'mdi-send-check-outline',
      color: 'green',
      title: t('account.bot.overview.sent'),
      value: data?.push.sent ?? 0,
      sub: t('account.bot.overview.timesUnit'),
      sparkline: [] as BotOverviewDayPoint[]
    },
    {
      key: 'failed',
      icon: 'mdi-alert-circle-outline',
      color: 'red',
      title: t('account.bot.overview.failed'),
      value: data?.push.failed ?? 0,
      sub: t('account.bot.overview.timesUnit'),
      sparkline: [] as BotOverviewDayPoint[]
    },
    {
      key: 'errors',
      icon: 'mdi-alert-decagram-outline',
      color: '#c07a5a',
      title: t('account.bot.overview.errorCount'),
      value: activeErrorCount.value,
      sub: t('account.bot.overview.errorDays'),
      sparkline: [] as BotOverviewDayPoint[]
    }
  ]
})

// 消息类型卡片还挂一张总量迷你走势，和统计卡片风格一致
const messageCardSparkline = computed(() => messageSparkline.value)

const messageTypes = computed(() => {
  const types = activeMessageTypes.value
  const order = ['text', 'image', 'video', 'forward', 'card', 'other']
  return order.map(key => ({
    key,
    label: t(`account.bot.overview.messageType.${key}`),
    value: Number((types as any)?.[key] || 0)
  }))
})

const messageTotal = computed(() => messageTypes.value.reduce((sum, item) => sum + item.value, 0))

/**
 * 把多群每日数据整理成可绘制的折线
 * @param series 各群的每日统计
 */
const buildChart = (series: BotOverviewSeries[] = []) => {
  const dates = [...new Set(series.flatMap(item => item.days.map(day => day.date)))].sort()
  if (dates.length === 0) return {dates, lines: [], max: 0}
  const max = Math.max(1, ...series.flatMap(item => item.days.map(day => Number(day.count) || 0)))
  const width = 640
  const height = 180
  const padding = 10
  const lines = series
      .filter(item => item.days.length > 0)
      .map(item => {
        const countMap = new Map<string, number>(item.days.map(day => [day.date, Number(day.count) || 0]))
        const data: BotOverviewChartPoint[] = dates.map((date, position) => {
          const count = countMap.get(date) || 0
          const x = dates.length === 1
              ? width / 2
              : padding + (position / (dates.length - 1)) * (width - padding * 2)
          const y = height - padding - (count / max) * (height - padding * 2)
          const tipWidth = 120
          return {
            date,
            count,
            x: Number(x.toFixed(1)),
            y: Number(y.toFixed(1)),
            tipX: Number(Math.min(width - tipWidth - 8, Math.max(8, x - tipWidth / 2)).toFixed(1)),
            tipY: Number(Math.max(6, y - 46).toFixed(1))
          }
        })
        const points = data.map(point => `${point.x},${point.y}`).join(' ')
        return {name: item.groupName, color: colorOfGroup(item.groupOpenid), points, data}
      })
  return {dates, lines, max}
}

const signinChart = computed(() => buildChart(activeSigninSeries.value))
const messageChart = computed(() => buildChart(activeMessageSeries.value))

/**
 * 载入概览数据
 */
const onLoad = async () => {
  loading.value = true
  try {
    const result = await apis.botApi().getOverview()
    overview.value = result.data?.data || null
    // 默认落在第一个群组，统计只看单个群
    selectedGroup.value = groupOptions.value[0]?.value || ''
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotOverview'})
  } finally {
    loading.value = false
  }
}

/**
 * 消息范围展示文案
 * @param setting 平台返回的消息范围
 */
const msgRangeLabel = (setting: string) => setting ? t(`account.bot.manage.msgRange.${setting}`) : '-'

onMounted(onLoad)
</script>

<template>
  <v-card variant="text" class="position-relative">
    <v-overlay contained v-if="loading" class="text-center opacity-60 py-12">
      <Loading size="50"></Loading>
    </v-overlay>

    <v-row class="mb-3" align="center">
      <v-col cols="12" lg="auto">
        <div class="d-flex align-center ga-2">
          <span class="opacity-60">{{ t('account.bot.overview.groupFilter') }}:</span>
          <v-select
              v-model="selectedGroup"
              :items="groupOptions"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 220px;"></v-select>
        </div>
      </v-col>
      <v-spacer class="hidden-sm hidden-md"></v-spacer>
      <v-col cols="12" lg="auto">
        <span class="opacity-60">{{ t('account.bot.overview.messageTrendDesc') }}</span>
      </v-col>
    </v-row>

    <!-- 概览卡片区 S -->
    <v-row density="compact" class="mt-2 mb-5" :gap="15">
      <v-col cols="12" sm="4" md="4" lg="4" v-for="card in cards" :key="card.title">
        <v-card
            border
            rounded="lg"
            variant="text"
            min-height="150px"
            class="d-flex flex-column justify-center h-100"
            :style="`background-color: color-mix(in srgb, ${card.color} 20%, #000 70%)`">
          <div style="opacity: .05; font-size: 7.2rem; position: absolute; left: 0; bottom: 0">
            <v-icon :icon="card.icon" :color="card.color" class="mr-1"></v-icon>
          </div>

          <v-row>
            <v-col :cols="card.sparkline.length > 1 ? 5 : 12" class="px-6 py-3">
              <div class="opacity-60 mb-1 u">{{ card.title }}</div>
              <div class="text-h4 font-weight-bold" :style="{color: card.color}">
                {{ card.value.toLocaleString() }}
              </div>
              <div class="opacity-40 mt-1">{{ card.sub }}</div>
            </v-col>

            <v-col v-if="card.sparkline.length > 1 && false" class="d-flex align-center">
              <v-sparkline
                  :model-value="card.sparkline.map(item => item.count)"
                  :color="card.color"
                  height="90"
                  line-width="2"
                  padding="8"
                  smooth="8"
                  marker-size="6"
                  interactive
                  tooltip
                  auto-draw>
                <template v-slot:tooltip="{index}">
                  <template v-if="card.sparkline[index]">
                    {{ card.sparkline[index].date }} · {{ card.sparkline[index].count.toLocaleString() }}
                  </template>
                </template>
              </v-sparkline>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <!-- 概览卡片区 E -->

    <v-alert v-if="activePartialGroups.length > 0"
             variant="tonal" color="orange" density="compact" class="mb-5">
      <p class="mb-1 font-weight-bold">{{ t('account.bot.overview.fullModeTitle') }}</p>
      <p class="mb-0 text-caption">
        {{
          t('account.bot.overview.fullModeDesc', {
            groups: activePartialGroups.map(i => `${i.groupName}（${msgRangeLabel(i.recvMsgSetting)}）`).join('、')
          })
        }}
      </p>
    </v-alert>

    <v-row>
      <!-- 本月签到潮汐 S -->
      <v-col cols="12" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-0">{{ t('account.bot.overview.signinTrendDesc', {month: overview?.signin?.month || '-'}) }}</p>

          <svg v-if="signinChart.lines.length > 0" viewBox="0 0 640 180" class="line-chart mt-4">
            <line x1="2" y1="170" x2="630" y2="170" stroke="currentColor" stroke-opacity=".15"
                  vector-effect="non-scaling-stroke"></line>
            <line x1="2" y1="10" x2="2" y2="170" stroke="currentColor" stroke-opacity=".15"
                  vector-effect="non-scaling-stroke"></line>
            <polyline v-for="line in signinChart.lines" :key="line.name"
                      :points="line.points" fill="none" :stroke="line.color"
                      stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
                      vector-effect="non-scaling-stroke"></polyline>
            <template v-for="line in signinChart.lines" :key="line.name">
              <g v-for="point in line.data" :key="`${line.name}-${point.date}`" class="chart-point">
                <circle :cx="point.x" :cy="point.y" r="10" fill="transparent"></circle>
                <line :x1="point.x" y1="10" :x2="point.x" y2="170"
                      class="chart-hover" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="4 4"
                      vector-effect="non-scaling-stroke"></line>
                <circle :cx="point.x" :cy="point.y" r="4" fill="currentColor" class="chart-hover"></circle>
                <g :transform="`translate(${point.tipX}, ${point.tipY})`" class="chart-hover">
                  <rect width="120" height="42" rx="6" fill="#000" fill-opacity=".82"></rect>
                  <text x="10" y="17" font-size="10" fill="#fff" fill-opacity=".7">{{ point.date }}</text>
                  <text x="10" y="34" font-size="12" font-weight="600" fill="#fff">
                    {{ point.count.toLocaleString() }}
                  </text>
                </g>
              </g>
            </template>
          </svg>
          <p v-else class="text-center opacity-40 py-8 text-caption">{{ t('account.bot.overview.noData') }}</p>

          <div class="d-flex flex-wrap ga-3">
            <div v-for="line in signinChart.lines" :key="line.name" class="d-flex align-center ga-1 text-caption">
              <span class="legend-dot" :style="{background: line.color}"></span>
              {{ line.name }}
            </div>
          </div>

          <template v-slot:title>
            {{ t('account.bot.overview.signinTrend') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 本月签到潮汐 E -->

      <!-- 群消息潮汐 S-->
      <v-col cols="12" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-0">{{ t('account.bot.overview.messageTrendDesc') }}</p>

          <svg v-if="messageChart.lines.length > 0" viewBox="0 0 640 180" class="line-chart mt-4">
            <line x1="0" y1="170" x2="630" y2="170" stroke="currentColor" stroke-opacity=".15"
                  vector-effect="non-scaling-stroke"></line>
            <line x1="2" y1="9" x2="2" y2="170" stroke="currentColor" stroke-opacity=".15"
                  vector-effect="non-scaling-stroke"></line>
            <polyline v-for="line in messageChart.lines" :key="line.name"
                      :points="line.points" fill="none" :stroke="line.color"
                      stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
                      vector-effect="non-scaling-stroke"></polyline>
            <template v-for="line in messageChart.lines" :key="line.name">
              <g v-for="point in line.data" :key="`${line.name}-${point.date}`" class="chart-point">
                <circle :cx="point.x" :cy="point.y" r="10" fill="transparent"></circle>
                <line :x1="point.x" y1="10" :x2="point.x" y2="170"
                      class="chart-hover" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="4 4"
                      vector-effect="non-scaling-stroke"></line>
                <circle :cx="point.x" :cy="point.y" r="4" fill="currentColor" class="chart-hover"></circle>
                <g :transform="`translate(${point.tipX}, ${point.tipY})`" class="chart-hover">
                  <rect width="120" height="42" rx="6" fill="#000" fill-opacity=".82"></rect>
                  <text x="10" y="17" font-size="10" fill="#fff" fill-opacity=".7">{{ point.date }}</text>
                  <text x="10" y="34" font-size="12" font-weight="600" fill="#fff">
                    {{ point.count.toLocaleString() }}
                  </text>
                </g>
              </g>
            </template>
          </svg>
          <p v-else class="text-center opacity-40 py-8 text-caption">{{ t('account.bot.overview.messageEmpty') }}</p>

          <v-row class="d-flex flex-wrap ga-3">
            <v-col cols="6" v-for="line in messageChart.lines" :key="line.name" class="d-flex align-center ga-1 text-caption">
              <span class="legend-dot" :style="{background: line.color}"></span>
              {{ line.name }}
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.bot.overview.messageTrend') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 群消息潮汐 E -->

      <!-- 指令罗盘 S -->
      <v-col cols="12" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-3">{{ t('account.bot.overview.commandsDesc') }}</p>

          <template v-if="commandChart.bars.length > 0">
            <svg viewBox="0 0 640 210" class="bar-chart">
              <line x1="0" y1="190" x2="616" y2="190" stroke="currentColor" stroke-opacity=".15"></line>
              <rect v-for="bar in commandChart.bars" :key="bar.key"
                    :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height"
                    :fill="bar.color" rx="2">
                <title>{{ bar.date }} · {{ bar.command }}：{{ bar.count }}</title>
              </rect>
              <text v-for="label in commandChart.labels" :key="`${label.text}-${label.x}`"
                    :x="label.x" y="205" text-anchor="middle" font-size="10" fill="currentColor" opacity=".5">
                {{ label.text }}
              </text>
            </svg>
            <div class="d-flex flex-wrap ga-3 mt-2">
              <div v-for="item in commandChart.commands" :key="item.name" class="d-flex align-center ga-1 text-caption">
                <span class="legend-dot" :style="{background: item.color}"></span>
                /{{ item.name }}
              </div>
            </div>
          </template>
          <p v-else class="text-center opacity-40 py-4 text-caption">{{ t('account.bot.overview.noData') }}</p>

          <template v-slot:title>
            {{ t('account.bot.overview.commands') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 指令罗盘 E -->

      <!-- 消息类型 S -->
      <v-col cols="12" lg="6">
        <AffixBoxHasTitleView>
          <v-row class="d-flex align-center justify-space-between mb-4">
            <v-col>
              <v-sparkline
                  v-if="messageCardSparkline.length > 1"
                  :model-value="messageCardSparkline.map(item => item.count)"
                  color="amber"
                  height="48"
                  line-width="1"
                  padding="4"
                  smooth="8"
                  marker-size="6"
                  interactive
                  tooltip
                  auto-draw
                  class="flex-1 mr-3">
                <template v-slot:tooltip="{index}">
                  <template v-if="messageCardSparkline[index]">
                    {{ messageCardSparkline[index].date }} · {{ messageCardSparkline[index].count.toLocaleString() }}
                  </template>
                </template>
              </v-sparkline>
            </v-col>
            <v-col cols="auto" class="text-caption opacity-60 u">{{ t('account.bot.overview.messageTotal', {total: messageTotal}) }}</v-col>
          </v-row>

          <v-row v-if="messageTotal > 0" dense>
            <v-col cols="6" v-for="item in messageTypes" :key="item.key">
              <div class="d-flex justify-space-between text-caption">
                <span class="mb-1">{{ item.label }}</span>
                <span class="opacity-60">{{ item.value }}</span>
              </div>
              <v-progress-linear height="4" rounded color="amber"
                                 :model-value="(item.value / messageTotal) * 100"></v-progress-linear>
            </v-col>
          </v-row>
          <p v-else class="text-center opacity-40 py-4 text-caption">{{ t('account.bot.overview.messageEmpty') }}</p>

          <template v-slot:title>
            {{ t('account.bot.overview.messageTypes') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 消息类型 E -->
    </v-row>

    <v-row>
      <v-col cols="12" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-2">{{ t('account.bot.overview.signinTopDesc') }}</p>
          <v-list v-if="activeSigninTop.length > 0" density="compact" class="bg-transparent">
            <v-list-item v-for="(item, index) in activeSigninTop" :key="`${item.groupOpenid}-${item.openid}`">
              <template v-slot:prepend>
                <span class="text-amber-accent-1 w-6 mr-3 ml-n2">#{{ index + 1 }}</span>
              </template>
              <v-list-item-title class="u">{{ item.username || item.openid }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ item.groupName }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-chip size="x-small" color="blue" variant="tonal" class="mr-1">{{ item.platform }}</v-chip>
                <v-chip size="x-small" color="amber" variant="tonal">{{ item.days }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-center opacity-40 py-4 text-caption">{{ t('account.bot.overview.noData') }}</p>

          <template v-slot:title>
            {{ t('account.bot.overview.signinTop') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>

      <!-- 今日主动推送额度 S -->
      <v-col cols="12" lg="6">
        <AffixBoxHasTitleView class="mt-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <p class="text-caption opacity-60 mb-0">
              {{
                t('account.bot.overview.quotaTotal', {
                  used: quotaTotals.used,
                  limit: quotaTotals.limit
                })
              }}
            </p>
            <span class="text-caption opacity-70">{{ Math.round(quotaPercent) }}%</span>
          </div>

          <v-progress-linear
              height="10"
              rounded
              color="amber"
              :model-value="quotaPercent"></v-progress-linear>

          <v-row class="quota-list mt-8">
            <v-col cols="6" v-for="item in groupQuotas" :key="item.groupOpenid" class="quota-row">
              <div class="d-flex align-center justify-space-between text-caption mb-1">
                <span class="text-truncate mr-3">{{ item.groupName }}</span>
                <span class="opacity-70 text-no-wrap">{{ item.usedCount }} / {{ item.limitCount }}</span>
              </div>
              <v-progress-linear
                  height="4"
                  rounded
                  color="teal"
                  :model-value="item.limitCount ? Math.min(100, (item.usedCount / item.limitCount) * 100) : 0"></v-progress-linear>
            </v-col>
            <p v-if="groupQuotas.length === 0" class="text-caption opacity-40 mb-0">
              {{ t('account.bot.overview.noData') }}
            </p>
          </v-row>

          <template v-slot:title>
            {{ t('account.bot.overview.quotaTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 今日主动推送额度 E -->
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12">
        <AffixBoxHasTitleView>
          <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
            <p class="text-caption opacity-60 mb-0">{{ t('account.bot.overview.errorLogDesc') }}</p>
            <v-chip size="small" color="red" variant="tonal">
              {{ activeErrorCount }} {{ t('account.bot.overview.timesUnit') }}
            </v-chip>
          </div>

          <v-list v-if="activeErrors.length > 0" density="compact" class="bg-transparent error-list">
            <v-list-item v-for="item in activeErrors" :key="item.id">
              <template v-slot:prepend>
                <v-chip size="x-small" :color="errorChipColor(item.errorType)" variant="tonal" class="mr-3">
                  {{ t(`account.bot.overview.errorType.${item.errorType}`) }}
                </v-chip>
              </template>
              <v-list-item-title class="d-flex align-center flex-wrap ga-2">
                <span class="text-caption opacity-70"><TimeView :time="item.createdTime"></TimeView></span>
                <span v-if="item.command" class="text-caption">/{{ item.command }}</span>
                <span class="text-caption">{{ item.message }}</span>
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ item.groupName }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <p v-else class="text-center opacity-40 py-4 text-caption mb-0">
            {{ t('account.bot.overview.errorLogEmpty') }}
          </p>

          <template v-slot:title>
            {{ t('account.bot.overview.errorLogTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped lang="less">
.line-chart {
  width: 100%;
  height: 180px;
}

.bar-chart {
  width: 100%;
  height: 210px;
}

.chart-point {
  .chart-hover {
    opacity: 0;
    pointer-events: none;
    transition: opacity .12s ease;
  }

  &:hover .chart-hover {
    opacity: 1;
  }
}

// 群额度列表限高，避免群多时把页面撑得过长
.quota-list {
  max-height: 240px;
  overflow-y: auto;

  .quota-row:not(:first-child) {
    margin-top: 12px;
  }
}

// 错误日志限高，保留最近记录可滚动查看
.error-list {
  max-height: 320px;
  overflow-y: auto;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
</style>
