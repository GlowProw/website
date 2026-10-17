<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Apis} from "@/assets/sripts/api";
import type {StatsAssemblyTop, StatsOverview, StatsRange, StatsTrend, StatsVisitor} from "@/assets/types/Stats";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import Loading from "@/components/Loading.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import TimeView from "@/components/TimeView.vue";
import {VSparkline} from "vuetify/components/VSparkline";

const {t} = useI18n();
const statsApi = Apis.statsApi();

const loading = ref(true);
const overview = ref<StatsOverview | null>(null);
const trend = ref<StatsTrend | null>(null);
const topData = ref<StatsAssemblyTop | null>(null);

// 当前选中指标（折线图切换）
const currentMetric = ref<StatsTrend['metric']>('browse');
// 时间范围：同时驱动折线图与下方六项统计卡片
const trendRange = ref<StatsRange>('30');

const loadingTrend = computed(() => !trend.value);
const loadingTop = computed(() => !topData.value);

// 概览页最下方：自己访客最多的 6 个配装（含最近访客信息）
const topVisitorAssemblies = computed(() => (topData.value?.topViewed || []).slice(0, 6));

/**
 * 配装详情页链接
 */
const assemblyDetailLink = (uuid: string) => `/assembly/browse/${uuid}/detail`;

/**
 * 访客显示名：登录用户显示用户名，匿名访客显示脱敏标识
 */
const visitorName = (v: StatsVisitor): string =>
    v.isUser ? (v.username || `User #${v.userId}`) : `${t('basic.visitor.anonMasked')} (${v.anonMasked || ''}…)`;

const trendMetrics: Array<StatsTrend['metric']> = ['browse', 'space', 'like', 'comment', 'reply'];

const metricCards = computed(() => [
  {
    metric: 'browse' as const,
    title: t('account.dataCenter.overview.browse'),
    value: overview.value?.browseCount || 0,
    icon: 'mdi-eye',
    color: 'amber',
    clickable: true,
  },
  {
    metric: 'space' as const,
    title: t('account.dataCenter.overview.space'),
    value: overview.value?.spaceCount || 0,
    icon: 'mdi-account-circle-outline',
    color: 'blue',
    clickable: true,
  },
  {
    metric: 'like' as const,
    title: t('account.dataCenter.overview.like'),
    value: overview.value?.likeCount || 0,
    icon: 'mdi-heart',
    color: 'red',
    clickable: true,
  },
  {
    metric: 'comment' as const,
    title: t('account.dataCenter.overview.comment'),
    value: (overview.value?.commentCount || 0) + (overview.value?.replyCount || 0),
    icon: 'mdi-comment-text-outline',
    color: 'green',
    clickable: true,
  },
  {
    metric: 'message' as const,
    title: t('account.dataCenter.overview.unread'),
    value: overview.value?.messageUnread || 0,
    sub: overview.value?.conversationCount || 0,
    icon: 'mdi-message-text',
    color: 'purple',
    clickable: false,
    href: {name: 'AccountMessages'} as any,
  },
  {
    metric: 'assembly' as const,
    title: t('account.dataCenter.overview.assembly'),
    value: overview.value?.assemblyCount || 0,
    icon: 'mdi-package-variant-closed',
    color: 'teal',
    clickable: false,
    href: {name: 'AccountAssemblys'} as any,
  }
]);

// 各指标趋势数据映射
const trendMap = ref<Record<string, StatsTrend | null>>({});

// 各指标卡片当前悬浮的数据点索引
const cardHoverIndexMap = ref<Record<string, number | null>>({});

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([loadOverview(), loadTrends(), loadTop()]);
  } catch (err) {
    console.warn('[DataCenter] load failed:', err);
  } finally {
    loading.value = false;
  }
});

/**
 * 加载统计概览数据
 */
const loadOverview = async () => {
  overview.value = await statsApi.getOverview(trendRange.value);
};

/**
 * 加载所有指标的走势图表数据
 */
const loadTrends = async () => {
  const metrics: Array<StatsTrend['metric']> = ['browse', 'space', 'like', 'comment'];
  const results = await Promise.all(
    metrics.map(m => statsApi.getTrend(m, trendRange.value))
  );
  metrics.forEach((m, idx) => {
    trendMap.value[m] = results[idx];
  });
  trend.value = trendMap.value[currentMetric.value] || null;
};

/**
 * 加载热门配装排行榜数据
 */
const loadTop = async () => {
  topData.value = await statsApi.getAssemblyTop(20);
};

/**
 * 当前时间范围对应的文案 key（卡片副标题用）
 */
const rangeLabelKey = computed(() => {
  if (trendRange.value === '7') return 'account.dataCenter.trend.range7';
  if (trendRange.value === '90') return 'account.dataCenter.trend.range90';
  return 'account.dataCenter.trend.range30';
});

/**
 * 切换时间范围：折线图与六项统计同时刷新
 */
const onRangeChange = async (range: StatsRange) => {
  trendRange.value = range;
  await Promise.all([loadTrends(), loadOverview()]);
};

/**
 * 点击卡片切换图表指标
 * @param metric 指标名称
 */
const onSelectMetric = async (metric: string) => {
  if (['browse', 'space', 'like', 'comment'].includes(metric)) {
    currentMetric.value = metric as StatsTrend['metric'];
    trend.value = trendMap.value[currentMetric.value] || null;
  }
};

/**
 * 设置指定卡片当前悬浮的数据点索引
 * @param metric 指标名
 * @param index 数据点序号
 */
const onCardHover = (metric: string, index: number | null | undefined) => {
  cardHoverIndexMap.value[metric] = index !== undefined ? index : null;
};

/**
 * 获取指定卡片的 sparkline 数据点数值数组
 * @param metric 指标名
 */
const getCardSparklineValues = (metric: string): number[] => {
  const t = trendMap.value[metric];
  if (t?.points && t.points.length > 0) {
    return t.points.map(p => Number(p.value) || 0);
  }
  return [0, 0, 0, 0, 0, 0, 0];
};

/**
 * 获取指定卡片当前鼠标悬浮对应数值（若未悬浮返回 null）
 * @param metric 指标名
 */
const getCardHoverValue = (metric: string): string | null => {
  const idx = cardHoverIndexMap.value[metric];
  if (idx === null || idx === undefined) return null;
  const t = trendMap.value[metric];
  if (!t?.points || !t.points[idx]) return null;
  return Number(t.points[idx].value || 0).toLocaleString();
};

/**
 * 获取指定卡片当前鼠标悬浮对应日期（若未悬浮返回 null）
 * @param metric 指标名
 */
const getCardHoverDate = (metric: string): string | null => {
  const idx = cardHoverIndexMap.value[metric];
  if (idx === null || idx === undefined) return null;
  const t = trendMap.value[metric];
  if (!t?.points || !t.points[idx]) return null;
  return t.points[idx].date;
};

/**
 * 获取指标卡片对应的图表渐变配色
 * @param color 颜色标识
 */
const getCardGradient = (color: string): string[] => {
  switch (color) {
    case 'blue':
      return ['rgba(66, 165, 245, 0.45)', 'rgba(21, 101, 192, 0.05)'];
    case 'red':
      return ['rgba(239, 83, 80, 0.45)', 'rgba(198, 40, 40, 0.05)'];
    case 'green':
      return ['rgba(102, 187, 106, 0.45)', 'rgba(46, 125, 50, 0.05)'];
    case 'purple':
      return ['rgba(171, 71, 188, 0.45)', 'rgba(123, 31, 162, 0.05)'];
    case 'teal':
      return ['rgba(38, 166, 154, 0.45)', 'rgba(0, 121, 107, 0.05)'];
    case 'amber':
    default:
      return ['rgba(255, 193, 7, 0.45)', 'rgba(255, 143, 0, 0.05)'];
  }
};

/**
 * 提取 sparkline 数值数组
 */
const sparklineValues = computed<number[]>(() => {
  const points = trend.value?.points || [];
  return points.map(p => Number(p.value) || 0);
});

/**
 * 提取 sparkline 对应日期标签数组
 */
const sparklineLabels = computed<string[]>(() => {
  const points = trend.value?.points || [];
  return points.map(p => p.date);
});

/**
 * 针对当前指标动态适配渐变填充色系
 */
const sparklineGradient = computed<string[]>(() => {
  switch (currentMetric.value) {
    case 'space':
      return ['rgba(66, 165, 245, 0.35)', 'rgba(21, 101, 192, 0.05)'];
    case 'like':
      return ['rgba(239, 83, 80, 0.35)', 'rgba(198, 40, 40, 0.05)'];
    case 'comment':
    case 'reply':
      return ['rgba(102, 187, 106, 0.35)', 'rgba(46, 125, 50, 0.05)'];
    case 'browse':
    default:
      return ['rgba(255, 193, 7, 0.35)', 'rgba(255, 143, 0, 0.05)'];
  }
});

/**
 * 当前指标最高点数值
 */
const maxTrendValue = computed(() => {
  if (sparklineValues.value.length === 0) return 0;
  return Math.max(...sparklineValues.value);
});

/**
 * 最近一天（最末数据点）的日期
 */
const lastDate = computed(() => {
  const labels = sparklineLabels.value;
  return labels.length ? labels[labels.length - 1] : '';
});

/**
 * 最近一天（最末数据点）的数值
 */
const lastValue = computed(() => {
  const values = sparklineValues.value;
  return values.length ? values[values.length - 1].toLocaleString() : '0';
});

/**
 * 当前指标标题
 */
const currentMetricTitle = computed(() => {
  return t(`account.dataCenter.overview.${currentMetric.value}`);
});

/**
 * 稀疏化展示 sparkline 底部横坐标刻度，避免重叠拥挤
 * @param index 刻度序号
 */
const formatSparklineLabel = (index: number): string => {
  const total = sparklineLabels.value.length;
  if (total <= 7) return sparklineLabels.value[index] || '';
  const step = Math.max(1, Math.floor(total / 6));
  if (index % step === 0 || index === total - 1) {
    const raw = sparklineLabels.value[index] || '';
    // 仅保留 MM-DD
    return raw.length >= 5 ? raw.substring(raw.length - 5) : raw;
  }
  return '';
};

/**
 * 格式化后的底部日期标签
 */
const displaySparklineLabels = computed<string[]>(() => {
  return sparklineLabels.value.map((_, idx) => formatSparklineLabel(idx));
});

/**
 * 当前指标对应卡片配置
 */
const activeCard = computed(() => metricCards.value.find(c => c.metric === currentMetric.value));

/**
 * 图表左上角主题色彩
 */
const sparklineThemeColor = computed(() => activeCard.value?.color || 'amber');

/**
 * 图表左上角图标
 */
const activeMetricIcon = computed(() => activeCard.value?.icon || 'mdi-chart-line');

// 鼠标在 Sparkline 图表上悬浮的当前数据点索引
const currentHoverIndex = ref<number | null>(null);

/**
 * 鼠标悬浮点的详细数据（包含日期与对应数值）
 */
const hoverPointInfo = computed(() => {
  if (currentHoverIndex.value === null || currentHoverIndex.value === undefined) return null;
  const val = sparklineValues.value[currentHoverIndex.value];
  const date = sparklineLabels.value[currentHoverIndex.value];
  if (val === undefined) return null;
  return {value: val, date};
});

/**
 * 鼠标悬浮点的日期
 */
const hoveredDate = computed(() => {
  if (currentHoverIndex.value === null || currentHoverIndex.value === undefined) return null;
  return sparklineLabels.value[currentHoverIndex.value] ?? null;
});

/**
 * 鼠标悬浮点的数值
 */
const hoveredValue = computed(() => {
  if (currentHoverIndex.value === null || currentHoverIndex.value === undefined) return null;
  const val = sparklineValues.value[currentHoverIndex.value];
  return val !== undefined ? val.toLocaleString() : null;
});


defineOptions({
  name: 'AccountDataCenter'
});
</script>

<template>
  <v-card variant="text">
    <v-row class="mb-3">
      <v-col cols="12" lg="auto">
        <div class="d-flex align-center ga-2">
          <span class="opacity-60">{{ t('account.dataCenter.trend.range') }}:</span>
          <v-btn-toggle v-model="trendRange" density="compact" variant="tonal" color="amber"
                        @update:model-value="onRangeChange">
            <v-btn value="7">{{ t('account.dataCenter.trend.range7') }}</v-btn>
            <v-btn value="30">{{ t('account.dataCenter.trend.range30') }}</v-btn>
            <v-btn value="90">{{ t('account.dataCenter.trend.range90') }}</v-btn>
          </v-btn-toggle>
        </div>
      </v-col>
      <v-spacer class="hidden-sm hidden-md"></v-spacer>
      <v-col cols="12" lg="auto">
        <span v-if="trend" class="opacity-60 ml-auto">
          {{ t('account.dataCenter.trend.updated') }}: {{ new Date(trend.updatedAt).toLocaleString() }}
        </span>
      </v-col>
    </v-row>

    <!-- 概览卡片区 S -->
    <v-row density="compact" class="mt-2 mb-4">
      <v-col cols="12" sm="6" md="4" lg="4" v-for="card in metricCards" :key="card.metric">
        <v-card
            rounded="lg"
            variant="text"
            class="d-flex flex-column justify-center cursor-pointer transition-swing h-100 bg-black"
            :class="[
              card.clickable && currentMetric === card.metric ? 'border-amber ring-1' : '',
              card.clickable ? 'hover-elevate' : ''
            ]"
            :to="card.href || undefined"
            :style="card.clickable || card.href ? 'cursor:pointer' : ''"
            @click="card.clickable && onSelectMetric(card.metric)">
          <div style="opacity: .07; font-size: 7rem; position: absolute; left: 0; bottom: 0">
            <v-icon :icon="card.icon" :color="card.color" class="mr-1"></v-icon>
          </div>

          <v-row>
            <v-col cols="5" class="px-6 py-3">
              <div class="opacity-60 mb-1 u">
                {{ card.title }}
              </div>

              <div class="d-flex align-baseline justify-space-between">
                <div class="text-h5 font-weight-bold" :class="`text-${card.color}`">
                  <template v-if="getCardHoverValue(card.metric) !== null">
                    {{ getCardHoverValue(card.metric) }}
                  </template>
                  <template v-else>
                    {{ card.value.toLocaleString() }}
                  </template>
                </div>
              </div>
              <div class="opacity-40 mt-1">
                <template v-if="getCardHoverDate(card.metric)">
                  {{ getCardHoverDate(card.metric) }}
                </template>
                <template v-else-if="card.sub !== undefined">
                  {{ t(rangeLabelKey) }} <br/>
                  {{ t('account.dataCenter.overview.conversations') }}: {{ card.sub }}
                </template>
                <template v-else>
                  {{ t(rangeLabelKey) }}
                </template>
              </div>
            </v-col>

            <v-col>
              <v-sparkline
                  :model-value="getCardSparklineValues(card.metric)"
                  :color="card.color"
                  height="160"
                  line-width="2"
                  marker-size="10"
                  min="0"
                  padding="10"
                  smooth="0"
                  interactive
                  @update:current-index="onCardHover(card.metric, $event)"
                  @mouseleave="onCardHover(card.metric, null)"
              ></v-sparkline>
            </v-col>
          </v-row>

        </v-card>
      </v-col>
    </v-row>
    <!-- 概览卡片区 E -->

    <div v-if="!loadingTop" class="d-flex flex-column">
      <v-row>
        <v-col cols="12" md="6">
          <AffixBoxHasTitleView>
            <v-list density="compact" class="bg-transparent">
              <v-list-item v-for="(a, i) in topData?.topLiked || []" :key="'l'+a.uuid">
                <template v-slot:prepend>
                  <span class="text-amber-accent-1 w-6 mr-3 ml-n2">#{{ i + 1 }}</span>
                </template>
                <v-list-item-title class="u">{{ a.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip size="x-small" color="red" variant="tonal">{{ a.likeCount }}</v-chip>
                </template>
              </v-list-item>
              <div v-if="!topData?.topLiked?.length" class="text-center opacity-40 py-4 text-caption">
                {{ t('account.dataCenter.analysis.noData') }}
              </div>
            </v-list>

            <template v-slot:title>
              <v-icon size="18" color="red" class="mb-2">mdi-heart</v-icon>
              {{ t('account.dataCenter.analysis.topLiked') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>

        <v-col cols="12" md="6">
          <AffixBoxHasTitleView>
            <v-list density="compact" class="bg-transparent">
              <v-list-item v-for="(a, i) in topData?.topViewed || []" :key="'v'+a.uuid">
                <template v-slot:prepend>
                  <span class="text-amber-accent-1 w-6 mr-3 ml-n2">#{{ i + 1 }}</span>
                </template>
                <v-list-item-title class="u">{{ a.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip size="x-small" color="blue" variant="tonal">{{ a.viewCount }}</v-chip>
                </template>
              </v-list-item>
              <div v-if="!topData?.topViewed?.length" class="text-center opacity-40 py-4 text-caption">
                {{ t('account.dataCenter.analysis.noData') }}
              </div>
            </v-list>

            <template v-slot:title>
              <v-icon size="18" color="blue" class="mb-2">mdi-eye</v-icon>
              {{ t('account.dataCenter.analysis.topViewed') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </v-row>
    </div>
    <div v-else class="text-center opacity-60 py-12">
      <Loading size="50"></Loading>
    </div>

    <!-- 配装 + 访客数 + 最近访客 -->
    <div v-if="!loadingTop" class="mt-6">
      <AffixBoxHasTitleView>
        <v-row density="compact">
          <HorizontalScrollList :is-indicator="false">
            <template v-for="(a, i) in topVisitorAssemblies" :key="'tv'+a.uuid">
              <div class="text-amber text-h6">#{{ i + 1 }}</div>

              <v-card  width="400" class="pa-4 ma-1 d-flex flex-column ga-3">
                <v-card-title class="d-flex align-center ga-2 mx-n4 mt-n4 py-6 bg-black">
                  <router-link
                      :to="assemblyDetailLink(a.uuid)"
                      target="_blank"
                      class="u text-truncate flex-1">
                    {{ a.name }}
                  </router-link>
                </v-card-title>
                
                <v-row>
                  <v-col>
                    <div class="d-flex align-center ga-2 flex-wrap mt-3">
                      <template v-if="a.recentVisitors && a.recentVisitors.length">
                        <v-tooltip v-for="(v, vi) in a.recentVisitors" :key="v.identity + vi" location="top">
                          <template v-slot:activator="{ props: tipProps }">
                            <v-avatar v-if="v.isUser && v.avatar"
                                      v-bind="tipProps" size="28" color="rgba(255,255,255,0.08)" class="cursor-pointer">
                              <v-img :src="v.avatar || ''"></v-img>
                            </v-avatar>
                            <v-avatar v-else-if="v.isUser"
                                      v-bind="tipProps" size="28" color="amber-darken-2" class="cursor-pointer">
                              <v-icon>mdi-account-circle</v-icon>
                            </v-avatar>
                            <v-avatar v-else
                                      v-bind="tipProps" size="28" color="grey-darken-1" class="cursor-pointer">
                              <v-icon>mdi-incognito</v-icon>
                            </v-avatar>
                          </template>
                          <div>
                            <div>{{ visitorName(v) }}</div>
                            <div class="text-caption opacity-70">{{ new Date(v.browseTime).toLocaleString() }}</div>
                          </div>
                        </v-tooltip>
                      </template>
                      <span v-else class="text-caption opacity-40">{{ t('account.dataCenter.analysis.noVisitors') }}</span>
                    </div>
                  </v-col>
                </v-row>

                <v-row density="compact" align="center">
                  <v-col cols="auto">
                    <v-icon start >mdi-eye</v-icon>
                  </v-col>
                  <v-col>
                    <v-divider></v-divider>
                  </v-col>
                  <v-col cols="auto">
                    <p class="u">{{ a.viewCount || 0 }}</p>
                  </v-col>
                </v-row>

                <v-row density="compact" align="center" class="mt-0">
                  <v-col cols="auto">
                    <v-icon start  color="red">mdi-heart</v-icon>
                  </v-col>
                  <v-col>
                    <v-divider></v-divider>
                  </v-col>
                  <v-col cols="auto">
                    <p class="u">{{ a.likeCount || 0 }}</p>
                  </v-col>
                </v-row>

                <v-row density="compact" align="center" class="mt-0">
                  <v-col cols="auto">
                    <v-icon start  color="green">mdi-comment-text-outline</v-icon>
                  </v-col>
                  <v-col>
                    <v-divider></v-divider>
                  </v-col>
                  <v-col cols="auto">
                    <p class="u">{{ a.commentCount || 0 }}</p>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </HorizontalScrollList>
        </v-row>

        <div v-if="!topVisitorAssemblies.length" class="text-center opacity-40 py-4 text-caption">
          {{ t('account.dataCenter.analysis.noData') }}
        </div>

        <template v-slot:title>
          {{ t('account.dataCenter.analysis.topVisitors') }}
        </template>
      </AffixBoxHasTitleView>
    </div>
  </v-card>
</template>

<style scoped lang="less">
.bg-surface-variant-opacity {
  background-color: rgba(255, 255, 255, 0.03);
}
</style>
