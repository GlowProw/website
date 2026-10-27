<script setup lang="ts">

import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";
import {computed, onMounted, ref, type Ref} from "vue";
import {useDisplay} from "vuetify";
import {apis, getAppUrl, formatHourInUserTimezone, getUserTimezone} from "@/assets/sripts/index";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import SmugglersReportShowItemWidget from "@/components/SmugglersReportShowItemWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import TimeView from "@/components/TimeView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";

import {useHead} from "@unhead/vue";
import {useRoute, useRouter} from "vue-router";
import UserAvatar from "@/components/UserAvatar.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),

    // 页面元信息 (meta)
    head: Ref<any> = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'description', content: t('smugglersReport.description')},
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `${t(route.meta.title as string)} | ${t('name')}`},
        {property: 'og:description', content: t('smugglersReport.description')},
        {property: 'og:site_name', content: t('name')},
        {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
        {name: 'twitter:card', content: 'summary'},
        {name: 'twitter:title', content: `${t(route.meta.title as string)} | ${t('name')}`},
        {name: 'twitter:description', content: t('smugglersReport.description')},
      ]
    })

useHead(head)

let smugglersData = ref<any>({}),
    commentData = ref<any[]>([]),
    browseLoading = ref(false),
    browsePagination = ref({
      page: 1,
      pageSize: 6
    })

// 最近已发布周报列表缓存与加载状态
const recentReportsList = ref<any[]>([])
const recentReportsLoading = ref(false)

// 当前用户生效时区
const userTz = computed(() => getUserTimezone())

/**
 * 页面挂载时拉取当前走私者周报与最近历史周报候选池
 */
onMounted(() => {
  getSmugglersData()
  loadRecentReports()
})

/**
 * 格式化时间精准到小时（按客户端生效时区）
 *
 * @param timeStr 时间字符串或时间戳
 * @returns 格式化后的时间 YYYY-MM-DD HH:00
 */
const formatHourTime = (timeStr?: string | number | Date) => {
  if (!timeStr) return 'N/A';
  return formatHourInUserTimezone(timeStr);
};

/**
 * 格式化周报起止简明日期区间
 *
 * @param start 起始时间
 * @param end 截止时间
 * @returns 简明月日范围展示
 */
const formatBriefDateRange = (start?: string | number | Date, end?: string | number | Date) => {
  if (!start) return '';
  const s = new Date(start);
  const sMonth = s.getMonth() + 1;
  const sDate = s.getDate();
  if (!end) return `${sMonth}/${sDate}`;
  const e = new Date(end);
  const eMonth = e.getMonth() + 1;
  const eDate = e.getDate();
  return `${sMonth}/${sDate} - ${eMonth}/${eDate}`;
};

/**
 * 拉取最近已发布的周报列表用于快捷切换与历史归档查询
 */
const loadRecentReports = async () => {
  try {
    recentReportsLoading.value = true;
    const res = await apis.smugglersApi().getReports({
      page: 1,
      pageSize: 30,
      status: 'published',
      sortBy: 'startTime',
      sortOrder: 'desc',
    });
    if (res?.data?.data && Array.isArray(res.data.data)) {
      recentReportsList.value = res.data.data;
    }
  } catch (e) {
    // 静默降级处理，避免影响主周报内容渲染
  } finally {
    recentReportsLoading.value = false;
  }
};

/**
 * 识别当前生效周报或最新发布的周报作为参照基准
 */
const activeOrLatestReport = computed(() => {
  if (!recentReportsList.value || recentReportsList.value.length === 0) return null;
  const currentActive = recentReportsList.value.find(r => r.periodState === 'current' || r.isActive);
  return currentActive || recentReportsList.value[0];
});

/**
 * 归整最多前 5 周的历史周报列表（排除未来与当前参照周报，最多取 5 篇）
 */
const historyWeeksPool = computed(() => {
  const base = activeOrLatestReport.value;
  if (!base || !recentReportsList.value) return [];
  const baseStart = new Date(base.startTime).getTime();
  const pastList = recentReportsList.value
    .filter(r => r.id !== base.id && new Date(r.startTime).getTime() < baseStart)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  return pastList.slice(0, 5).map((r, index) => ({
    ...r,
    weeksAgo: index + 1,
  }));
});

// 上周周报对象引用
const lastWeekReport = computed(() => historyWeeksPool.value[0] || null)

// 上上周周报对象引用
const twoWeeksAgoReport = computed(() => historyWeeksPool.value[1] || null)

/**
 * 计算属于本月且包含跨月规则限定的周报列表
 * 当发生跨月份时，跨月部分最多只保留最后 2 周周报，且总览严格限制在前 5 周历史以内
 */
const thisMonthReportsList = computed(() => {
  const base = activeOrLatestReport.value;
  if (!base || !recentReportsList.value) return [];
  const baseDate = new Date(base.startTime);
  const targetYear = baseDate.getFullYear();
  const targetMonth = baseDate.getMonth();

  // 筛选当月范围内的所有周报
  const inMonth = recentReportsList.value.filter(r => {
    const d = new Date(r.startTime);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  }).map(r => ({ ...r, isCrossMonth: false }));

  // 跨月候选池：属于非当月的历史周报
  const crossMonthPast = historyWeeksPool.value
    .filter(r => {
      const d = new Date(r.startTime);
      return d.getFullYear() !== targetYear || d.getMonth() !== targetMonth;
    })
    .map(r => ({ ...r, isCrossMonth: true }));

  // 跨月最多只取最后 2 周
  const limitedCrossMonth = crossMonthPast.slice(0, 2);

  const combined = [...inMonth];
  for (const r of limitedCrossMonth) {
    if (!combined.some(c => c.id === r.id)) {
      combined.push(r);
    }
  }
  return combined.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
});

// 是否包含跨月周报条目
const hasCrossMonthReports = computed(() => {
  return thisMonthReportsList.value.some(r => r.isCrossMonth);
});

/**
 * 判断指定周报是否为当前正处于查看状态的周报
 *
 * @param reportId 待判定的周报ID
 * @returns 是否选中
 */
const isReportSelected = (reportId?: number | string) => {
  if (!reportId || !smugglersData.value?.id) return false;
  return String(reportId) === String(smugglersData.value.id);
};

// 当前查看的是否为本周生效周报
const isCurrentActiveSelected = computed(() => {
  if (smugglersData.value?.periodState === 'current') return true;
  if (activeOrLatestReport.value && String(activeOrLatestReport.value.id) === String(smugglersData.value?.id)) return true;
  return false;
});

// 当前查看的是否为上周周报
const isLastWeekSelected = computed(() => {
  return !!lastWeekReport.value && isReportSelected(lastWeekReport.value.id);
});

// 当前查看的是否为上上周周报
const isTwoWeeksAgoSelected = computed(() => {
  return !!twoWeeksAgoReport.value && isReportSelected(twoWeeksAgoReport.value.id);
});

/**
 * 切换查看指定编号的周报并同步更新路由状态
 *
 * @param reportId 目标周报编号
 */
const onSelectReport = (reportId?: number | string) => {
  if (!reportId) return;
  getSmugglersData({ reportId });
  router.replace({ query: { ...route.query, id: String(reportId), period: undefined } });
};

/**
 * 快捷选择上周周报
 */
const onSelectLastWeek = () => {
  if (lastWeekReport.value) {
    onSelectReport(lastWeekReport.value.id);
  }
};

/**
 * 快捷选择上上周周报
 */
const onSelectTwoWeeksAgo = () => {
  if (twoWeeksAgoReport.value) {
    onSelectReport(twoWeeksAgoReport.value.id);
  }
};

/**
 * 获取符合当前时间或指定参数的周报
 *
 * @param params 可选参数，包括 period / reportId / date
 */
const getSmugglersData = async (params?: { period?: 'current' | 'previous' | 'next'; reportId?: number | string; date?: string }) => {
  try {
    browseLoading.value = true;
    const queryParams: any = {};
    if (params?.reportId) {
      queryParams.reportId = params.reportId;
    } else if (params?.period) {
      queryParams.period = params.period;
    } else if (route.query.id) {
      queryParams.reportId = route.query.id as string;
    } else if (route.query.period) {
      queryParams.period = route.query.period as any;
    } else {
      queryParams.period = 'current';
    }

    const result = await apis.smugglersApi().getRangeTimeReport(queryParams);
    const d = result?.data;

    if (d && d.data) {
      if (Array.isArray(d.data)) {
        smugglersData.value = d.data[0] || {};
      } else {
        smugglersData.value = d.data || {};
      }
    } else {
      smugglersData.value = {};
    }

    if (smugglersData.value && smugglersData.value.id) {
      await getSmugglersComment(smugglersData.value.id);
    } else {
      commentData.value = [];
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'SmugglersView'});
  } finally {
    browseLoading.value = false;
  }
};

/**
 * 切换到上一周周报
 */
const onGoPrevious = () => {
  if (smugglersData.value?.previousReportId) {
    onSelectReport(smugglersData.value.previousReportId);
  } else {
    getSmugglersData({ period: 'previous' });
  }
};

/**
 * 回到当前本周周报
 */
const onGoCurrent = () => {
  getSmugglersData({ period: 'current' });
  router.replace({ query: { ...route.query, id: undefined, period: 'current' } });
};

/**
 * 切换到下一周周报
 */
const onGoNext = () => {
  if (smugglersData.value?.nextReportId) {
    onSelectReport(smugglersData.value.nextReportId);
  } else {
    getSmugglersData({ period: 'next' });
  }
};

/**
 * 获取周报评论
 */
const getSmugglersComment = async (reportId: string) => {
  try {
    if (!reportId) return

    browseLoading.value = true

    const result = await apis.smugglersApi().getReportComments(reportId),
        d = result?.data;

    commentData.value = d?.data?.data || [];
  } catch (e) {
    handleApiError(e, notice, t, {component: 'SmugglersView'})
  } finally {
    browseLoading.value = false
  }
}

const display = useDisplay()

/**
 * 响应式计算瀑布流列数
 */
const columnCount = computed(() => {
  if (display.smAndDown.value) return 1
  if (display.mdAndDown.value) return 2
  return 3
})

/**
 * 将评论按轮流平衡方式分配至各列，自动补齐空白处
 */
const masonryColumns = computed(() => {
  const count = columnCount.value
  const cols: any[][] = Array.from({length: count}, () => [])
  if (!commentData.value || commentData.value.length === 0) return cols

  commentData.value.forEach((item, index) => {
    cols[index % count].push(item)
  })
  return cols
})
</script>

<template>
  <v-card height="200px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-breadcrumbs density="compact" class="ma-0 pa-0">
        <v-container>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('smugglersReport.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-trophy-award" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <v-container>
    <v-row>
      <v-col cols="12" lg="3">
        <ItemSlotBase size="99px">
          <NpcIconWidget id="smugglersNetwork-sainteAnne"></NpcIconWidget>
        </ItemSlotBase>

        <v-row>
          <v-col cols="12" sm="6" lg="12">
            <div class="mt-10">
              <p class="text-amber mb-2 text-h5">{{ t('smugglersReport.title') }}</p>
              <q class="opacity-60 quote">
                {{ t('smugglersReport.description') }}
              </q>
            </div>
          </v-col>

          <!-- 周报数据信息 S -->
          <template v-if="smugglersData.id">
            <v-col cols="12" sm="6" lg="12">
              <div class="mt-6">
                <!-- 周期状态徽章 S -->
                <div class="mb-3 d-flex align-center ga-2 flex-wrap">
                  <v-chip
                      v-if="smugglersData.periodState === 'current'"
                      color="amber"
                      variant="flat"
                      size="small"
                      prepend-icon="mdi-clock-check-outline"
                      class="font-weight-bold">
                    {{ t('smugglersReport.view.currentWeek') }}
                  </v-chip>
                  <v-chip
                      v-else-if="smugglersData.periodState === 'previous'"
                      color="grey-lighten-1"
                      variant="tonal"
                      size="small"
                      prepend-icon="mdi-history"
                      class="font-weight-bold">
                    {{ t('smugglersReport.view.previousWeek') }}
                  </v-chip>
                  <v-chip
                      v-else-if="smugglersData.periodState === 'next'"
                      color="info"
                      variant="tonal"
                      size="small"
                      prepend-icon="mdi-calendar-clock"
                      class="font-weight-bold">
                    {{ t('smugglersReport.view.nextWeek') }}
                  </v-chip>
                </div>
                <!-- 周期状态徽章 E -->

                <!-- 历史与快速周报导航 S -->
                <div class="mb-4">
                  <!-- 常用快捷切换按钮组 S -->
                  <div class="d-flex align-center ga-1 flex-wrap mb-2">
                    <v-btn
                        size="x-small"
                        variant="text"
                        density="comfortable"
                        color="amber"
                        icon="mdi-chevron-left"
                        :disabled="browseLoading || !smugglersData.hasPrevious"
                        @click="onGoPrevious" />

                    <v-btn
                        size="x-small"
                        :variant="isCurrentActiveSelected ? 'flat' : 'tonal'"
                        color="amber"
                        :disabled="browseLoading"
                        @click="onGoCurrent">
                      {{ t('smugglersReport.view.currentWeekBtn') }}
                    </v-btn>

                    <v-btn
                        size="x-small"
                        :variant="isLastWeekSelected ? 'flat' : 'outlined'"
                        color="amber"
                        :disabled="browseLoading || !lastWeekReport"
                        @click="onSelectLastWeek">
                      {{ t('smugglersReport.view.lastWeek') }}
                    </v-btn>

                    <v-btn
                        size="x-small"
                        :variant="isTwoWeeksAgoSelected ? 'flat' : 'outlined'"
                        color="amber"
                        :disabled="browseLoading || !twoWeeksAgoReport"
                        @click="onSelectTwoWeeksAgo">
                      {{ t('smugglersReport.view.twoWeeksAgo') }}
                    </v-btn>

                    <v-btn
                        size="x-small"
                        variant="text"
                        density="comfortable"
                        color="amber"
                        icon="mdi-chevron-right"
                        :disabled="browseLoading || !smugglersData.hasNext"
                        @click="onGoNext" />
                  </div>
                  <!-- 常用快捷切换按钮组 E -->

                  <!-- 本月周报与历史周报菜单选择器 S -->
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <v-menu location="bottom start" :close-on-content-click="true">
                      <template v-slot:activator="{ props }">
                        <v-btn
                            v-bind="props"
                            size="x-small"
                            variant="outlined"
                            color="amber"
                            prepend-icon="mdi-calendar-month-outline"
                            append-icon="mdi-chevron-down"
                            :loading="recentReportsLoading">
                          {{ t('smugglersReport.view.thisMonthReports') }} ({{ thisMonthReportsList.length }})
                        </v-btn>
                      </template>
                      <v-card min-width="280" max-width="360" class="border border-amber-darken-3 bg-grey-darken-4">
                        <v-card-title class="text-caption text-amber px-3 py-2 d-flex align-center justify-space-between">
                          <span>{{ t('smugglersReport.view.thisMonthReports') }}</span>
                          <span v-if="hasCrossMonthReports" class="text-caption opacity-60">
                            {{ t('smugglersReport.view.crossMonthNotice') }}
                          </span>
                        </v-card-title>
                        <v-divider opacity=".1" />
                        <v-list density="compact" class="py-0">
                          <template v-if="thisMonthReportsList.length > 0">
                            <v-list-item
                                v-for="item in thisMonthReportsList"
                                :key="item.id"
                                :active="isReportSelected(item.id)"
                                active-color="amber"
                                @click="onSelectReport(item.id)">
                              <template v-slot:prepend>
                                <v-icon
                                    :icon="isReportSelected(item.id) ? 'mdi-check-circle' : 'mdi-file-document-outline'"
                                    size="small"
                                    class="mr-2"
                                    :color="isReportSelected(item.id) ? 'amber' : 'grey'" />
                              </template>
                              <v-list-item-title class="text-body-2 font-weight-medium">
                                {{ item.title }}
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-caption opacity-70">
                                {{ formatBriefDateRange(item.startTime, item.endTime) }}
                                <span v-if="item.isCrossMonth" class="text-amber-lighten-3 ml-1">
                                  ({{ t('smugglersReport.view.crossMonthNotice') }})
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </template>
                          <v-list-item v-else>
                            <v-list-item-title class="text-caption opacity-60 text-center py-2">
                              {{ t('smugglersReport.view.noReportInPeriod') }}
                            </v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-card>
                    </v-menu>

                    <v-menu location="bottom start" :close-on-content-click="true">
                      <template v-slot:activator="{ props }">
                        <v-btn
                            v-bind="props"
                            size="x-small"
                            variant="outlined"
                            color="grey-lighten-1"
                            prepend-icon="mdi-history"
                            append-icon="mdi-chevron-down"
                            :loading="recentReportsLoading">
                          {{ t('smugglersReport.view.historyMenu') }} ({{ historyWeeksPool.length }})
                        </v-btn>
                      </template>
                      <v-card min-width="280" max-width="360" class="border border-grey-darken-2 bg-grey-darken-4">
                        <v-card-title class="text-caption text-amber px-3 py-2 d-flex align-center justify-space-between">
                          <span>{{ t('smugglersReport.view.historyMenu') }}</span>
                          <span class="text-caption opacity-60">
                            {{ t('smugglersReport.view.historyLimitTip') }}
                          </span>
                        </v-card-title>
                        <v-divider opacity=".1" />
                        <v-list density="compact" class="py-0">
                          <template v-if="historyWeeksPool.length > 0">
                            <v-list-item
                                v-for="item in historyWeeksPool"
                                :key="item.id"
                                :active="isReportSelected(item.id)"
                                active-color="amber"
                                @click="onSelectReport(item.id)">
                              <template v-slot:prepend>
                                <v-icon
                                    :icon="isReportSelected(item.id) ? 'mdi-check-circle' : 'mdi-history'"
                                    size="small"
                                    class="mr-2"
                                    :color="isReportSelected(item.id) ? 'amber' : 'grey'" />
                              </template>
                              <v-list-item-title class="text-body-2 font-weight-medium d-flex align-center justify-space-between">
                                <span>{{ item.title }}</span>
                                <v-chip size="x-small" variant="tonal" color="amber" class="ml-2">
                                  {{ item.weeksAgo === 1 ? t('smugglersReport.view.lastWeek') : (item.weeksAgo === 2 ? t('smugglersReport.view.twoWeeksAgo') : t('smugglersReport.view.weeksAgoLabel', { count: item.weeksAgo })) }}
                                </v-chip>
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-caption opacity-70">
                                {{ formatBriefDateRange(item.startTime, item.endTime) }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </template>
                          <v-list-item v-else>
                            <v-list-item-title class="text-caption opacity-60 text-center py-2">
                              {{ t('smugglersReport.view.noHistoryReports') }}
                            </v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-card>
                    </v-menu>
                  </div>
                  <!-- 本月周报与历史周报菜单选择器 E -->
                </div>
                <!-- 历史与快速周报导航 E -->

                <div class="opacity-80 text-body-2">
                  <p><b class="d-block mb-2 text-h6">{{ smugglersData.title ?? 'N/A' }}</b></p>
                  <p class="mb-1">
                    <span class="opacity-60">{{ t('smugglersReport.view.startTime') }}:</span>
                    <span class="font-monospace ml-2">{{ formatHourTime(smugglersData.startTime) }}</span>
                    <span class="opacity-40 text-caption ml-1">({{ userTz }})</span>
                  </p>
                  <p class="mb-1">
                    <span class="opacity-60">{{ t('smugglersReport.view.endTime') }}:</span>
                    <span class="font-monospace ml-2">{{ formatHourTime(smugglersData.endTime) }}</span>
                    <span class="opacity-40 text-caption ml-1">({{ userTz }})</span>
                  </p>
                  <div class="text-caption text-amber-lighten-2 mt-2">
                    {{ t('smugglersReport.view.gameUpdateTimeTip') }}
                  </div>
                </div>
              </div>
            </v-col>
          </template>
          <template v-else-if="!browseLoading">
            <v-col cols="12">
              <v-alert type="info" variant="tonal" density="compact" class="mt-4">
                {{ t('smugglersReport.view.noReportInPeriod') }}
              </v-alert>
              <v-btn size="small" color="amber" variant="tonal" class="mt-3" @click="onGoCurrent">
                {{ t('smugglersReport.view.goToCurrent') }}
              </v-btn>
            </v-col>
          </template>
          <!-- 周报数据信息 E -->
        </v-row>
      </v-col>
      <v-col cols="12" lg="9">
        <AffixBoxHasTitleView>
          <v-card variant="text" min-height="450">
            <div v-if="browseLoading" class="d-flex justify-center align-center" style="min-height: 450px;">
              <Loading size="50"></Loading>
            </div>
            <SmugglersReportShowItemWidget v-else :data="smugglersData.content"></SmugglersReportShowItemWidget>
          </v-card>
          <template v-slot:title>{{ t('smugglersReport.view.smuggledItems') }}</template>
        </AffixBoxHasTitleView>
      </v-col>
    </v-row>
  </v-container>
  <v-divider></v-divider>
  <v-container>
    <v-row>
      <v-col>
        <p class="text-h5 text-amber">{{ t('smugglersReport.view.connoisseurs') }}</p>
        <p class="opacity-60 text-caption mt-1 mb-3">{{ t('smugglersReport.view.connoisseursDesc') }}</p>
      </v-col>
      <v-col cols="auto">
        <v-btn to="/account/smugglersReport" target="_blank">
          {{ t('smugglersReport.view.becomeConnoisseur') }}
        </v-btn>
      </v-col>
    </v-row>


    <!-- 鉴赏家评论瀑布流 S -->
    <div v-if="browseLoading" class="d-flex justify-center align-center py-10">
      <Loading size="50"></Loading>
    </div>
    <template v-else>
      <div v-if="commentData.length > 0" class="d-flex ga-4 w-100 align-start flex-wrap">
        <div
            v-for="(col, colIndex) in masonryColumns.filter(c => c.length > 0)"
            :key="colIndex"
            class="d-flex flex-column ga-4 flex-1-1"
            style="min-width: 280px; flex: 1;">
          <v-card
              v-for="(i, index) in col"
              :key="i.id || index"
              tile
              variant="text"
              class="pa-2">
            <v-row no-gutters>
              <v-col cols="auto">
                <AccountCardWidget :id="i.userId">
                  <ItemSlotBase size="50px">
                    <UserAvatar :src="i.userAvatar || ''" class="bg-black" size="50px"></UserAvatar>
                  </ItemSlotBase>
                </AccountCardWidget>
              </v-col>
              <v-col class="ml-3 min-w-0">
                <AccountCardWidget :id="i.userId">
                  <b class="u">{{ i.username }}</b>
                </AccountCardWidget>

                <div class="opacity-60">
                  <TimeView :time="i.createdTime"></TimeView>
                </div>

                <Textarea
                    readonly
                    class="opacity-60 mt-2"
                    :value="i.content"
                    v-if="i.content"
                    min-height="30">
                </Textarea>
              </v-col>
            </v-row>
          </v-card>
        </div>
      </div>
      <EmptyView v-else></EmptyView>
    </template>
    <!-- 鉴赏家评论瀑布流 E -->
  </v-container>
</template>

<style scoped lang="less">
.quote {
  line-height: 1.8;
  quotes: "\"" "\"";
}
</style>
