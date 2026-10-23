<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {
  Items,
  Ships,
  Materials,
  Cosmetics,
  Commodities,
  EmpireSkills,
  MapLocations,
  Masterys,
  Modifications,
  Npcs,
  Sets,
  TreasureMaps,
  Ultimates,
  Seasons
} from "glow-prow-data";
import type {
  CollectionDayStat,
  CollectionMetricCard,
  CollectionRecord,
  CollectionSeasonStat,
  CollectionTypeStat,
  StatsRange
} from "@/assets/types/Stats";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import Loading from "@/components/Loading.vue";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";
import SeasonName from "@/components/snbWidget/seasonName.vue";
import {VSparkline} from "vuetify/components/VSparkline";
import {useAuthStore} from "~/stores/userAccountStore";
import {useCollectionStore} from "~/stores/collectionStore";
import {useNoticeStore} from "~/stores/noticeStore";

const {t, te} = useI18n(),
    authStore = useAuthStore(),
    noticeStore = useNoticeStore(),
    collectionStore = useCollectionStore(),
    loading = ref(true),
    range = ref<StatsRange>('30'),
    syncDialog = ref(false),
    cardHoverIndexMap = ref<Record<string, number | null>>({}),
    syncing = computed(() => collectionStore.syncing)

const seasonData = Seasons;

/**
 * 展平专精赛季树，按节点 ID 建立索引
 */
function flattenMasterys(): Record<string, any> {
  const result: Record<string, any> = {}
  for (const tree of Object.values(Masterys)) {
    for (const node of Object.values((tree as any)?.nodes || {}) as any[]) {
      if (node?.id) result[node.id] = node
    }
  }
  return result
}

/**
 * 可收集的图鉴种类与对应数据集
 */
const collectionKinds: Array<{ key: string; entries: Record<string, any> }> = [
  {key: 'item', entries: Items as Record<string, any>},
  {key: 'ship', entries: Ships as Record<string, any>},
  {key: 'material', entries: Materials as Record<string, any>},
  {key: 'cosmetic', entries: Cosmetics as Record<string, any>},
  {key: 'commoditie', entries: Commodities as Record<string, any>},
  {key: 'empireSkill', entries: EmpireSkills as Record<string, any>},
  {key: 'mapLocation', entries: MapLocations as Record<string, any>},
  {key: 'mastery', entries: flattenMasterys()},
  {key: 'mod', entries: Modifications as Record<string, any>},
  {key: 'npc', entries: Npcs as Record<string, any>},
  {key: 'set', entries: Sets as Record<string, any>},
  {key: 'treasureMap', entries: TreasureMaps as Record<string, any>},
  {key: 'ultimate', entries: Ultimates as Record<string, any>},
]

const kindEntries = new Map(collectionKinds.map(kind => [kind.key, kind.entries]))

/**
 * 格式化为两位数字
 * @param value 数值
 */
const pad = (value: number): string => String(value).padStart(2, '0')

/**
 * 加载收藏数据，登录态读取账户记录，未登录仅展示本地标记
 */
const onLoad = async () => {
  loading.value = true
  try {
    if (authStore.isLogin) await collectionStore.onLoadAccount(true)
  } finally {
    loading.value = false
  }

  if (authStore.isLogin && collectionStore.pendingLocalCount > 0) syncDialog.value = true
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
 * 合并账户记录与本地标记，同一条目以本地时间为准
 */
const mergedRecords = computed<CollectionRecord[]>(() => {
  const merged = new Map<string, CollectionRecord>()

  const pushRecord = (targetType: string, targetId: string, time: number) => {
    if (!targetType || !targetId) return
    merged.set(`${targetType}:${targetId}`, {
      targetType,
      targetId,
      createdTime: new Date(time || Date.now()).toISOString()
    })
  }

  for (const [kind, records] of Object.entries(collectionStore.accountMap)) {
    for (const [id, time] of Object.entries(records)) pushRecord(kind, id, time)
  }

  for (const [kind, records] of Object.entries(collectionStore.localMap)) {
    for (const [id, time] of Object.entries(records)) pushRecord(kind, id, time)
  }

  return Array.from(merged.values())
})

/**
 * 已取得物品总数
 */
const totalCollected = computed(() => mergedRecords.value.length)

/**
 * 图鉴可收集条目总数，按全部图鉴种类汇总
 */
const catalogCount = computed(() =>
    collectionKinds.reduce((sum, kind) =>
        sum + Object.values(kind.entries).filter(entry => !entry?.unobtainable).length, 0)
)

/**
 * 收集完成度百分比
 */
const completion = computed(() => {
  if (!catalogCount.value) return 0
  return Math.min(100, Math.round(totalCollected.value / catalogCount.value * 100))
})

/**
 * 最近一次取得时间
 */
const lastCollected = computed(() => {
  const times = mergedRecords.value
      .map(record => new Date(record.createdTime).getTime())
      .filter(time => !Number.isNaN(time) && time > 0)
  if (!times.length) return '-'
  return new Date(Math.max(...times)).toLocaleString()
})

/**
 * 按图鉴种类聚合的收集进度
 */
const kindStats = computed<CollectionTypeStat[]>(() => {
  const available = new Map<string, number>()
  collectionKinds.forEach(kind => {
    available.set(kind.key, Object.values(kind.entries).filter(entry => !entry?.unobtainable).length)
  })

  const collected = new Map<string, Set<string>>()
  for (const record of mergedRecords.value) {
    if (!record.targetType || !kindEntries.get(record.targetType)?.[record.targetId]) continue
    if (!collected.has(record.targetType)) collected.set(record.targetType, new Set())
    collected.get(record.targetType)!.add(record.targetId)
  }

  return collectionKinds
      .map(kind => {
        const count = available.get(kind.key) || 0
        const got = Math.min(collected.get(kind.key)?.size || 0, count)
        return {
          type: kind.key,
          collected: got,
          available: count,
          percent: count ? Math.round(got / count * 100) : 0
        }
      })
      .sort((a, b) => b.available - a.available)
})

/**
 * 按赛季聚合的收集数量，仅统计带赛季归属的图鉴条目
 */
const seasonStats = computed<CollectionSeasonStat[]>(() => {
  const buckets = new Map<string, {start: number; collected: number; types: Map<string, number>}>()

  for (const record of mergedRecords.value) {
    const entity = kindEntries.get(record.targetType)?.[record.targetId]
    const season = entity?.bySeason?.id
    if (!season) continue

    const start = entity.bySeason?.startDate ? new Date(entity.bySeason.startDate).getTime() : 0
    if (!buckets.has(season)) {
      buckets.set(season, {start, collected: 0, types: new Map()})
    }

    const bucket = buckets.get(season)!
    bucket.collected += 1
    bucket.types.set(record.targetType, (bucket.types.get(record.targetType) || 0) + 1)
  }

  return Array.from(buckets.entries())
      .map(([season, bucket]) => ({
        season,
        collected: bucket.collected,
        types: Array.from(bucket.types.entries())
            .map(([type, count]) => ({type, count}))
            .sort((a, b) => b.count - a.count),
        start: bucket.start
      }))
      .sort((a, b) => b.start - a.start)
      .map(item => ({season: item.season, collected: item.collected, types: item.types}))
})

/**
 * 按日聚合的新增与累计数量，区间以今天为最后一天
 */
const daily = computed<CollectionDayStat[]>(() => {
  const count = Number(range.value)
  const times = mergedRecords.value
      .map(record => new Date(record.createdTime).getTime())
      .filter(time => !Number.isNaN(time))

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  firstDay.setDate(firstDay.getDate() - (count - 1))

  let cumulative = times.filter(time => time < firstDay.getTime()).length
  const result: CollectionDayStat[] = []

  for (let i = 0; i < count; i++) {
    const start = new Date(firstDay)
    start.setDate(start.getDate() + i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const added = times.filter(time => time >= start.getTime() && time < end.getTime()).length
    cumulative += added
    result.push({
      date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      label: `${pad(start.getMonth() + 1)}/${pad(start.getDate())}`,
      added,
      cumulative
    })
  }

  return result
})

/**
 * 当前时间范围对应的文案 key
 */
const rangeLabel = computed(() => t(`account.collectionStats.trend.range${range.value}`))

/**
 * 概览指标卡片，指标构成与数据中心保持一致
 */
const metricCards = computed<CollectionMetricCard[]>(() => [
  {
    key: 'collected',
    title: t('account.collectionStats.overview.collected'),
    value: totalCollected.value,
    icon: 'mdi-check-decagram',
    color: 'amber',
    series: daily.value.map(day => day.added),
    unit: t('account.collectionStats.trend.addedUnit'),
    detail: rangeLabel.value
  },
  {
    key: 'catalog',
    title: t('account.collectionStats.overview.catalog'),
    value: catalogCount.value,
    icon: 'mdi-bookshelf',
    color: 'blue',
    series: daily.value.map(day => day.cumulative),
    unit: t('account.collectionStats.trend.totalUnit'),
    detail: rangeLabel.value
  },
  {
    key: 'completion',
    title: t('account.collectionStats.overview.completion'),
    value: `${completion.value}%`,
    icon: 'mdi-chart-donut',
    color: 'green',
    series: daily.value.map(day => Math.round(day.cumulative / Math.max(1, catalogCount.value) * 100)),
    unit: '%',
    detail: rangeLabel.value
  },
  {
    key: 'lastCollected',
    title: t('account.collectionStats.overview.lastCollected'),
    value: lastCollected.value,
    icon: 'mdi-clock-outline',
    color: 'purple',
    series: daily.value.map(day => day.added),
    unit: t('account.collectionStats.trend.addedUnit'),
    detail: t('account.collectionStats.overview.lastCollectedHint')
  }
])

/**
 * 新增折线图纵轴最大值，避免全零时无法计算坐标
 */
const addedMax = computed(() => Math.max(1, ...daily.value.map(day => day.added)))

/**
 * 累计柱状图纵轴最大值
 */
const cumulativeMax = computed(() => Math.max(1, ...daily.value.map(day => day.cumulative)))

/**
 * 折线图各数据点坐标
 */
const chartPoints = computed(() => {
  const width = 720, height = 180, padding = 12
  const step = daily.value.length > 1 ? (width - padding * 2) / (daily.value.length - 1) : 0
  return daily.value.map((day, index) => ({
    x: padding + index * step,
    y: height - padding - (day.added / addedMax.value) * (height - padding * 2),
    day
  }))
})

/**
 * 新增折线路径
 */
const linePath = computed(() => chartPoints.value
    .map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' '))

/**
 * 新增面积填充路径
 */
const areaPath = computed(() => {
  const points = chartPoints.value
  if (!points.length) return ''
  return `M${points[0].x.toFixed(2)},180 ` +
      points.map(point => `L${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ') +
      ` L${points[points.length - 1].x.toFixed(2)},180 Z`
})

/**
 * 横轴标签显示间隔，避免天数过多时文字重叠
 */
const labelStep = computed(() => Math.ceil(daily.value.length / 8))

/**
 * 每周新增是否存在数据
 */
const hasAdded = computed(() => daily.value.some(day => day.added > 0))

/**
 * 记录卡片当前悬浮的数据点
 * @param key 指标名
 * @param index 数据点序号
 */
const onCardHover = (key: string, index: number | null | undefined) => {
  cardHoverIndexMap.value[key] = index !== undefined ? index : null
}

/**
 * 获取卡片悬浮位置的数据点，未悬浮时返回 null
 * @param card 指标卡片
 */
const getCardHoverPoint = (card: CollectionMetricCard) => {
  const index = cardHoverIndexMap.value[card.key]
  if (index === null || index === undefined) return null

  const day = daily.value[index]
  if (!day || card.series[index] === undefined) return null

  return {
    day,
    value: card.series[index]
  }
}

/**
 * 双向同步本地标记与账户收藏
 */
const onSync = async () => {
  try {
    const result = await collectionStore.onSync()
    if (result.uploaded || result.downloaded) {
      noticeStore.success(t('account.collectionStats.sync.result', {
        upload: result.uploaded,
        download: result.downloaded
      }))
    } else {
      noticeStore.info(t('account.collectionStats.sync.none'))
    }
    syncDialog.value = false
  } catch {
    noticeStore.error(t('account.collectionStats.sync.failed'))
  }
}

onMounted(onLoad)

const getSeasonData = (bySeasonName: string) => seasonData[bySeasonName]

defineOptions({
  name: 'AccountCollectionStats'
})
</script>

<template>
  <div>
    <div v-if="loading" class="text-center opacity-60 py-12">
      <Loading size="50"></Loading>
    </div>

    <template v-else>
      <AffixBoxHasTitleView v-if="!mergedRecords.length" class="mb-8">
        <div class="text-center opacity-60 py-12">
          {{ t('account.collectionStats.empty.title') }}
        </div>
        <template v-slot:title>
          {{ t('account.collectionStats.overview.title') }}
        </template>
      </AffixBoxHasTitleView>

      <template v-else>
        <!-- 概览卡片区 S -->
        <v-card variant="text">
          <v-row class="mb-3">
            <v-col cols="12" lg="auto">
              <div class="d-flex align-center ga-2">
                <span class="opacity-60">{{ t('account.collectionStats.trend.range') }}:</span>
                <v-btn-toggle v-model="range" density="compact" variant="tonal" color="amber">
                  <v-btn value="7">{{ t('account.collectionStats.trend.range7') }}</v-btn>
                  <v-btn value="30">{{ t('account.collectionStats.trend.range30') }}</v-btn>
                  <v-btn value="90">{{ t('account.collectionStats.trend.range90') }}</v-btn>
                </v-btn-toggle>
              </div>
            </v-col>
            <v-spacer class="hidden-sm hidden-md"></v-spacer>
            <v-col cols="12" lg="auto">
              <span class="opacity-60 ml-auto">
                {{ t('account.collectionStats.overview.localMarks', {count: collectionStore.localCount}) }}
              </span>
            </v-col>
          </v-row>

          <v-row density="compact" class="mt-2 mb-5" :gap="15">
            <v-col cols="12" sm="6" md="4" lg="4" v-for="card in metricCards" :key="card.key">
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
                  <v-col cols="5" class="px-6 py-3">
                    <div class="opacity-60 mb-1 d-flex align-center ga-1">
                      <span class="u singe-line">{{ card.title }}</span>
                      <v-btn v-if="card.key === 'collected'"
                             density="compact"
                             variant="text"
                             border
                             size="smail"
                             color="amber"
                             :loading="syncing"
                             @click.stop="onSync">
                        {{ t('account.collectionStats.overview.sync') }}
                      </v-btn>
                    </div>

                    <div class="text-h4 font-weight-bold singe-line" :class="`text-${card.color}`">
                      <template v-if="getCardHoverPoint(card)">
                        {{ getCardHoverPoint(card)?.value.toLocaleString() }}{{ card.unit }}
                      </template>
                      <template v-else>
                        {{ typeof card.value === 'number' ? card.value.toLocaleString() : card.value }}
                      </template>
                    </div>
                    <div class="opacity-40 mt-1">
                      <template v-if="getCardHoverPoint(card)">
                        {{ getCardHoverPoint(card)?.day.date }}
                      </template>
                      <template v-else>
                        {{ card.detail }}
                      </template>
                    </div>
                  </v-col>

                  <v-col>
                    <v-sparkline
                        :model-value="card.series.length ? card.series : [0, 0, 0, 0, 0, 0, 0]"
                        :color="card.color"
                        height="200"
                        line-width="2"
                        marker-size="10"
                        min="0"
                        padding="10"
                        smooth="0"
                        interactive
                        @update:current-index="onCardHover(card.key, $event)"
                        @mouseleave="onCardHover(card.key, null)"></v-sparkline>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
        <!-- 概览卡片区 E -->

        <AffixBoxHasTitleView class="mb-8">
          <v-row>
            <v-col cols="12" lg="6">
              <div class="d-flex align-center ga-2 mb-2">
                <v-icon size="16" color="amber">mdi-chart-line</v-icon>
                <span class="font-weight-bold">{{ t('account.collectionStats.trend.added') }}</span>
                <span class="text-caption opacity-40">{{ t('account.collectionStats.trend.addedUnit') }}</span>
              </div>

              <div v-if="hasAdded" class="trend-chart mb-5">
                <svg viewBox="0 0 720 180" preserveAspectRatio="none" class="w-100">
                  <defs>
                    <linearGradient id="collectionAddedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="rgba(255, 193, 7, .45)"/>
                      <stop offset="100%" stop-color="rgba(255, 193, 7, 0)"/>
                    </linearGradient>
                  </defs>
                  <line v-for="ratio in [.25, .5, .75]" :key="ratio" x1="0" :y1="180 * ratio" x2="720"
                        :y2="180 * ratio" stroke="rgba(255,255,255,.08)" stroke-width="1"
                        vector-effect="non-scaling-stroke"/>
                  <path :d="areaPath" fill="url(#collectionAddedGradient)"/>
                  <path :d="linePath" fill="none" stroke="#ffc107" stroke-width="2"
                        vector-effect="non-scaling-stroke"/>
                </svg>
                <div class="d-flex mt-1">
              <span v-for="(day, index) in daily" :key="day.date"
                    class="text-caption opacity-40 flex-grow-1 text-center"
                    :style="{visibility: index % labelStep === 0 || index === daily.length - 1 ? 'visible' : 'hidden'}">
                {{ day.label }}
              </span>
                </div>
                <div class="text-caption opacity-40 mt-1">
                  {{ t('account.collectionStats.trend.addedMax') }}: {{ addedMax }}
                </div>
              </div>
              <div v-else class="text-center opacity-40 py-6 text-caption">
                {{ t('account.collectionStats.trend.noData') }}
              </div>
            </v-col>
            <v-col cols="12" lg="6">
              <div class="d-flex align-center ga-2 mb-4">
                <v-icon size="16" color="blue">mdi-chart-bar</v-icon>
                <span class="font-weight-bold">{{ t('account.collectionStats.trend.cumulative') }}</span>
                <span class="text-caption opacity-40">{{ t('account.collectionStats.trend.totalUnit') }}</span>
              </div>

              <div class="cumulative-chart d-flex align-end ga-1">
                <div v-for="day in daily" :key="day.date"
                     class="cumulative-bar flex-grow-1"
                     :title="`${day.date} · +${day.added} / ${day.cumulative}`">
                  <div class="cumulative-bar__fill"
                       :style="{height: `${day.cumulative / cumulativeMax * 100}%`}"></div>
                </div>
              </div>
              <div class="d-flex mt-1">
                <span v-for="(day, index) in daily" :key="day.date"
                      class="text-caption opacity-40 flex-grow-1 text-center"
                      :style="{visibility: index % labelStep === 0 || index === daily.length - 1 ? 'visible' : 'hidden'}">
                  {{ day.label }}
                </span>
              </div>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.collectionStats.trend.title') }}
          </template>
        </AffixBoxHasTitleView>

        <AffixBoxHasTitleView class="mb-8">
          <v-row density="compact">
            <v-col cols="12" sm="6" md="4" v-for="item in kindStats" :key="item.type">
              <v-card rounded="lg" variant="flat" class="pa-4 h-100">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="font-weight-bold">{{ kindName(item.type) }}</span>
                  <v-chip size="x-small" variant="tonal" color="amber">
                    {{ item.collected }} / {{ item.available }}
                  </v-chip>
                </div>
                <v-progress-linear :model-value="item.percent" color="amber" height="6" rounded>
                </v-progress-linear>
                <div class="text-caption opacity-40 mt-2">{{ item.percent }}%</div>
              </v-card>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.collectionStats.types.title') }}
          </template>
        </AffixBoxHasTitleView>

        <AffixBoxHasTitleView>
          <v-row density="compact">
            <v-col cols="12" sm="6" md="4" v-for="season in seasonStats" :key="season.season">
              <v-card border rounded="lg" variant="text" class="h-100">
                <SeasonViewWidget :data="getSeasonData(season.season)"></SeasonViewWidget>

                <v-card-text class="pa-4">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <p class="font-weight-bold"><SeasonName :id="season.season" /></p>
                    <v-chip size="small" variant="tonal" color="blue">
                      {{ t('account.collectionStats.seasons.items', {count: season.collected}) }}
                    </v-chip>
                  </div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip v-for="type in season.types" :key="type.type"
                            size="x-small"
                            color="grey">
                      {{ kindName(type.type) }} · {{ type.count }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.collectionStats.seasons.title') }}
          </template>
        </AffixBoxHasTitleView>
      </template>
    </template>

    <!-- 匿名标记同步提醒 S -->
    <v-dialog v-model="syncDialog" max-width="500">
      <v-card border rounded="lg">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="amber" icon="mdi-star-circle-outline"></v-icon>
          {{ t('account.collectionStats.syncDialog.title') }}
        </v-card-title>
        <v-card-text>
          <p>{{ t('account.collectionStats.syncDialog.text', {count: collectionStore.pendingLocalCount}) }}</p>
          <p class="text-caption opacity-40 mt-2">{{ t('account.collectionStats.syncDialog.keep') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="syncDialog = false">{{ t('account.collectionStats.syncDialog.later') }}</v-btn>
          <v-btn color="amber" variant="flat" :loading="syncing" @click="onSync">
            {{ t('account.collectionStats.syncDialog.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 匿名标记同步提醒 E -->
  </div>
</template>

<style scoped lang="less">
.trend-chart {
  svg {
    height: 180px;
    overflow: visible;
  }
}

.cumulative-chart {
  height: 180px;
}

.cumulative-bar {
  height: 100%;
  display: flex;
  align-items: flex-end;
  background-color: rgba(255, 255, 255, .03);
  border-radius: 2px;

  &__fill {
    width: 100%;
    min-height: 1px;
    background: linear-gradient(180deg, #42a5f5, rgba(66, 165, 245, .35));
    border-radius: 2px;
    transition: height .25s ease;
  }
}
</style>
