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
import {Apis} from "@/assets/sripts/api";
import type {
  CollectionSeasonStat,
  CollectionStatsResult,
  CollectionTypeStat,
  CollectionWeekStat
} from "@/assets/types/Stats";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import Loading from "@/components/Loading.vue";
import BySeasonCardWidget from "@/components/BySeasonCardWidget.vue";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";
import SeasonName from "@/components/snbWidget/seasonName.vue";

type WeekRange = '12' | '26' | '52';

const {t, te} = useI18n(),
    collectionApi = Apis.collectionApi(),
    loading = ref(true),
    stats = ref<CollectionStatsResult | null>(null),
    range = ref<WeekRange>('12')

const seasons = Seasons;

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
 * 计算某个日期所在周的周一零点
 * @param date 基准日期
 */
const startOfWeek = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - weekday)
  return result
}

/**
 * 格式化为两位数字
 * @param value 数值
 */
const pad = (value: number): string => String(value).padStart(2, '0')

/**
 * 加载收藏统计原始记录
 */
const onLoad = async () => {
  loading.value = true
  try {
    const result = await collectionApi.getCollectionStats('all')
    stats.value = result.data.data as CollectionStatsResult
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
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
 * 已取得物品总数
 */
const totalCollected = computed(() => stats.value?.total || 0)

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
  const value = stats.value?.lastCollectedAt
  return value ? new Date(value).toLocaleString() : '-'
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
  for (const record of stats.value?.records || []) {
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

  for (const record of stats.value?.records || []) {
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
 * 按周聚合的新增与累计数量
 */
const weeks = computed<CollectionWeekStat[]>(() => {
  const count = Number(range.value)
  const records = stats.value?.records || []
  const times = records
      .map(record => new Date(record.createdTime).getTime())
      .filter(time => !Number.isNaN(time))

  const currentWeek = startOfWeek(new Date())
  const firstWeek = new Date(currentWeek)
  firstWeek.setDate(firstWeek.getDate() - (count - 1) * 7)

  let cumulative = times.filter(time => time < firstWeek.getTime()).length
  const result: CollectionWeekStat[] = []

  for (let i = 0; i < count; i++) {
    const start = new Date(firstWeek)
    start.setDate(start.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const added = times.filter(time => time >= start.getTime() && time < end.getTime()).length
    cumulative += added
    result.push({
      start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      label: `${pad(start.getMonth() + 1)}/${pad(start.getDate())}`,
      added,
      cumulative
    })
  }

  return result
})

/**
 * 新增折线图纵轴最大值，避免全零时无法计算坐标
 */
const addedMax = computed(() => Math.max(1, ...weeks.value.map(week => week.added)))

/**
 * 累计柱状图纵轴最大值
 */
const cumulativeMax = computed(() => Math.max(1, ...weeks.value.map(week => week.cumulative)))

/**
 * 折线图各数据点坐标
 */
const chartPoints = computed(() => {
  const width = 720, height = 180, padding = 12
  const step = weeks.value.length > 1 ? (width - padding * 2) / (weeks.value.length - 1) : 0
  return weeks.value.map((week, index) => ({
    x: padding + index * step,
    y: height - padding - (week.added / addedMax.value) * (height - padding * 2),
    week
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
 * 横轴标签显示间隔，避免周数过多时文字重叠
 */
const labelStep = computed(() => Math.ceil(weeks.value.length / 8))

/**
 * 切换统计时间范围
 * @param value 周数范围
 */
const onRangeChange = (value: unknown) => {
  range.value = String(value) as WeekRange
}

/**
 * 每周新增是否存在数据
 */
const hasAdded = computed(() => weeks.value.some(week => week.added > 0))

onMounted(onLoad)

const getSeasonData = (bySeasonName: string) => seasons[bySeasonName]

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
      <AffixBoxHasTitleView v-if="!stats">
        <div class="text-center opacity-60 py-12">
          {{ t('account.collectionStats.empty.title') }}
        </div>
        <template v-slot:title>
          {{ t('account.collectionStats.overview.title') }}
        </template>
      </AffixBoxHasTitleView>

      <template v-else>
        <AffixBoxHasTitleView class="mb-8">
          <v-row density="compact">
            <v-col cols="12" sm="6" md="3" v-for="card in [
              {
                key: 'collected',
                value: totalCollected.toLocaleString(),
                icon: 'mdi-check-decagram',
                color: 'amber'
              },
              {
                key: 'catalog',
                value: catalogCount.toLocaleString(),
                icon: 'mdi-bookshelf',
                color: 'blue'
              },
              {
                key: 'completion',
                value: `${completion}%`,
                icon: 'mdi-chart-donut',
                color: 'green'
              },
              {
                key: 'lastCollected',
                value: lastCollected,
                icon: 'mdi-clock-outline',
                color: 'purple'
              }
            ]" :key="card.key">
              <v-card border rounded="lg" variant="text" class="pa-5 h-100"
                      :style="`background-color: color-mix(in srgb, ${card.color} 16%, #000 72%)`">
                <div class="d-flex align-center ga-2 opacity-60 mb-2">
                  <v-icon :color="card.color" size="18">{{ card.icon }}</v-icon>
                  <span>{{ t(`account.collectionStats.overview.${card.key}`) }}</span>
                </div>
                <div class="text-h5 font-weight-bold" :class="`text-${card.color}`">{{ card.value }}</div>
              </v-card>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.collectionStats.overview.title') }}
          </template>
        </AffixBoxHasTitleView>

        <AffixBoxHasTitleView class="mb-8">
          <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <span class="opacity-60">{{ t('account.collectionStats.trend.range') }}:</span>
            <v-btn-toggle :model-value="range" density="compact" variant="tonal" color="amber"
                          @update:model-value="onRangeChange">
              <v-btn value="12">{{ t('account.collectionStats.trend.range12') }}</v-btn>
              <v-btn value="26">{{ t('account.collectionStats.trend.range26') }}</v-btn>
              <v-btn value="52">{{ t('account.collectionStats.trend.range52') }}</v-btn>
            </v-btn-toggle>
          </div>

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
              <span v-for="(week, index) in weeks" :key="week.start"
                    class="text-caption opacity-40 flex-grow-1 text-center"
                    :style="{visibility: index % labelStep === 0 || index === weeks.length - 1 ? 'visible' : 'hidden'}">
                {{ week.label }}
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
                <div v-for="week in weeks" :key="week.start"
                     class="cumulative-bar flex-grow-1"
                     :title="`${week.start} · +${week.added} / ${week.cumulative}`">
                  <div class="cumulative-bar__fill"
                       :style="{height: `${week.cumulative / cumulativeMax * 100}%`}"></div>
                </div>
              </div>
              <div class="d-flex mt-1">
                <span v-for="(week, index) in weeks" :key="week.start"
                      class="text-caption opacity-40 flex-grow-1 text-center"
                      :style="{visibility: index % labelStep === 0 || index === weeks.length - 1 ? 'visible' : 'hidden'}">
                  {{ week.label }}
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
