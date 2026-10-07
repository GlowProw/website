<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import * as d3 from "d3";

import {Apis} from "@/assets/sripts/api";
import type {StatsAssemblyTop, StatsOverview, StatsTrend} from "@/assets/sripts/api/stats_service";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n();
const statsApi = Apis.statsApi();

const loading = ref(true);
const overview = ref<StatsOverview | null>(null);
const trend = ref<StatsTrend | null>(null);
const topData = ref<StatsAssemblyTop | null>(null);

// 当前选中指标（概览里的 5 个统计项）
const currentMetric = ref<StatsTrend['metric']>('browse');
// 时间范围
const trendRange = ref<'7' | '30'>('7');

const loadingTrend = computed(() => !trend.value);
const loadingTop = computed(() => !topData.value);

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

// ===== d3 折线图渲染 =====
const chartRef = ref<SVGSVGElement | null>(null);
const chartWidth = 720;
const chartHeight = 220;
const margin = {top: 16, right: 16, bottom: 32, left: 44};
const tooltipRef = ref<HTMLDivElement | null>(null);

const renderedTrend = computed(() => trend.value?.points || []);

// 监听到 trend 变化后渲染
let renderTimer: any = null;

watch(trend, () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(async () => {
    await nextTick();
    renderChart();
  }, 30);
}, {immediate: true, deep: true});

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([loadOverview(), loadTrend(), loadTop()]);
  } catch (err) {
    console.warn('[DataCenter] load failed:', err);
  } finally {
    loading.value = false;
  }
});

const onMetricClick = async (m: StatsTrend['metric']) => {
  currentMetric.value = m;
  await loadTrend();
};

const loadOverview = async () => {
  overview.value = await statsApi.getOverview();
};

const loadTrend = async () => {
  trend.value = await statsApi.getTrend(currentMetric.value, trendRange.value);
};

const loadTop = async () => {
  topData.value = await statsApi.getAssemblyTop(20);
};

const onRangeChange = async (range: '7' | '30') => {
  trendRange.value = range;
  await loadTrend();
};

// watch 后渲染 —— 用 effect 风格
function renderChart() {
  const svg = chartRef.value;
  const tip = tooltipRef.value;
  if (!svg || !tip || renderedTrend.value.length === 0) return;

  d3.select(svg).selectAll('*').remove();

  const g = d3.select(svg)
      .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const w = chartWidth - margin.left - margin.right;
  const h = chartHeight - margin.top - margin.bottom;

  const xScale = d3.scalePoint()
      .domain(renderedTrend.value.map(p => p.date))
      .range([0, w])
      .padding(0.5);

  const maxVal = Math.max(1, ...renderedTrend.value.map(p => p.value));
  const yScale = d3.scaleLinear()
      .domain([0, maxVal])
      .range([h, 0])
      .nice();

  // x 轴
  const step = Math.max(1, Math.floor(renderedTrend.value.length / 7));
  const tickDates = d3.range(0, renderedTrend.value.length, step)
      .map(i => renderedTrend.value[i]?.date)
      .filter((d): d is string => !!d);
  const xAxis = g.append('g')
      .attr('transform', `translate(0, ${h})`)
      .call(d3.axisBottom(xScale).tickValues(tickDates))
      .attr('class', 'text-caption grey');
  xAxis.selectAll('text').attr('fill', '#888').attr('font-size', '10px');

  // y 轴
  g.append('g')
      .call(d3.axisLeft(yScale).ticks(4))
      .attr('class', 'text-caption grey')
      .selectAll('text').attr('fill', '#888').attr('font-size', '10px');

  // 折线
  const line = d3.line<{ date: string; value: number }>()
      .x(d => xScale(d.date)!)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

  g.append('path')
      .datum(renderedTrend.value)
      .attr('fill', 'none')
      .attr('stroke', '#ffb300')
      .attr('stroke-width', 2)
      .attr('d', line);

  // 圆点
  g.selectAll('.dot')
      .data(renderedTrend.value as Array<{ date: string; value: number }>)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date)!)
      .attr('cy', d => yScale(d.value))
      .attr('r', 3)
      .attr('fill', '#ffb300');

  // hover overlay（十字线 + tooltip）
  const bisect = d3.bisector((p: { date: string }) => p.date).left;

  // 十字线
  const crossLine = g.append('line')
      .attr('class', 'crossline')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0).attr('y2', h)
      .attr('display', 'none');

  const hoverDot = g.append('circle')
      .attr('r', 5)
      .attr('fill', '#ffb300')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('display', 'none');

  // overlay rect 捕获鼠标
  g.append('rect')
      .attr('width', w).attr('height', h)
      .attr('fill', 'transparent')
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const points = renderedTrend.value;
        let closest = 0;
        let minDist = Infinity;
        for (let i = 0; i < points.length; i++) {
          const dx = Math.abs(xScale(points[i].date)! - mx);
          if (dx < minDist) {
            minDist = dx;
            closest = i;
          }
        }
        const d = points[closest];
        const cx = xScale(d.date)!;
        const cy = yScale(d.value);

        crossLine.attr('display', null).attr('x1', cx).attr('x2', cx);
        hoverDot.attr('display', null).attr('cx', cx).attr('cy', cy);

        // tooltip
        tip.style.opacity = '1';
        const svgRect = svg.getBoundingClientRect();
        const parentRect = (svg.parentElement as HTMLElement).getBoundingClientRect();
        const left = svgRect.left - parentRect.left + cx + margin.left + 10;
        const top = svgRect.top - parentRect.top + cy + margin.top - 30;
        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
        tip.innerHTML = `<div style="font-size:11px;opacity:.7">${d.date}</div><div style="font-weight:bold;color:#ffb300">${d.value}</div>`;
      })
      .on('mouseleave', () => {
        crossLine.attr('display', 'none');
        hoverDot.attr('display', 'none');
        tip.style.opacity = '0';
      });
}

defineOptions({
  name: 'AccountDataCenter'
});
</script>

<template>
  <v-card variant="text">
    <v-row no-gutters>
      <v-col>
        <v-tabs v-model="currentMetric"
                color="amber">
          <v-tab v-for="m in trendMetrics" :key="m" :value="m" @click="onMetricClick(m)" class="text-subtitle-2 font-weight-medium">
            {{ t(`account.dataCenter.overview.${m}`) }}
          </v-tab>
        </v-tabs>
      </v-col>
      <v-col cols="auto">
        <!-- 时间范围选择 -->
        <div class="d-flex align-center ga-4">
          <p v-if="trend" class="text-caption opacity-40 ml-auto">
            {{ t('account.dataCenter.trend.updated') }}: {{ new Date(trend.updatedAt).toLocaleString() }}
          </p>

          <v-divider vertical inset></v-divider>

          <span class="text-caption opacity-60">{{ t('account.dataCenter.trend.range') }}:</span>
          <v-btn-toggle v-model="trendRange" density="compact" variant="tonal" color="amber">
            <v-btn value="7">{{ t('account.dataCenter.trend.range7') }}</v-btn>
            <v-btn value="30">{{ t('account.dataCenter.trend.range30') }}</v-btn>
          </v-btn-toggle>
        </div>
      </v-col>
    </v-row>
    <v-divider class="mb-3"></v-divider>

    <!-- 概览卡片区 -->
    <v-row dense class="mb-6">
      <v-col cols="6">
        <!-- 折线图 -->
        <div v-if="!loadingTrend" class="position-relative">
          <svg ref="chartRef" class="w-100"></svg>
          <div
              ref="tooltipRef"
              class="d3-tooltip"
              style="position:absolute;pointer-events:none;opacity:0;transition:opacity .15s;background:rgba(0,0,0,.8);color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;z-index:10;white-space:nowrap;"></div>
        </div>
        <div v-else class="text-center opacity-60 py-12">
          <Loading size="32"></Loading>
        </div>
      </v-col>
      <v-col cols="6">
        <v-row dense>
          <v-col cols="12" lg="6" v-for="card in metricCards" :key="card.metric">
            <v-card
                rounded="lg"
                class="px-4 py-2 d-flex"
                :class="card.clickable && currentMetric === card.metric ? 'border-amber' : ''"
                :to="card.href || undefined"
                :style="card.href ? 'cursor:pointer' : ''">
              <v-row>
                <v-col class="flex-1">
                  <div class="text-caption opacity-60 mb-1">{{ card.title }}</div>
                  <div class="text-caption opacity-40 mt-1">
                    <template v-if="card.sub !== undefined">
                      {{ t('account.dataCenter.overview.conversations') }}: {{ card.sub }}
                    </template>
                    <template v-else>
                      {{ t('account.dataCenter.overview.last30') }}
                    </template>
                  </div>
                </v-col>
                <v-col cols="auto" class="text-h4 font-weight-bold" :class="`text-${card.color}`">
                  {{ card.value.toLocaleString() }}
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <div v-if="!loadingTop" class="d-flex flex-column">
      <v-row>
        <v-col cols="12" md="6">
          <AffixBoxHasTitleView>
            <v-list density="compact" class="bg-transparent">
              <v-list-item v-for="(a, i) in topData?.topLiked || []" :key="'l'+a.uuid">
                <template v-slot:prepend>
                  <span class="text-amber w-6 mr-3 ml-n2">#{{ i + 1 }}</span>
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
                  <span class="text-amber w-6 mr-3 ml-n2">#{{ i + 1 }}</span>
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
      <Loading size="32"></Loading>
    </div>

    <!-- 更新时间戳 -->
    <div v-if="overview" class="text-right opacity-40 text-caption mt-4">
      {{ t('account.dataCenter.updatedAt') }}: {{ new Date(overview.updatedAt).toLocaleString() }}
    </div>
  </v-card>
</template>
