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

// 周报本地内存缓存（按 reportId 或 period 缓存）
const reportCache = new Map<string, any>()

// 当前用户生效时区
const userTz = computed(() => getUserTimezone())

// 是否允许回到本周（当查看非本周周报时显示）
const canGoCurrent = computed(() => {
  if (smugglersData.value?.isActive) return false;
  return smugglersData.value?.periodState !== 'current';
});

// 是否存在上一周周报（数据没有则为 false）
const hasPreviousReport = computed(() => {
  return !!smugglersData.value?.hasPrevious && !!smugglersData.value?.previousReportId;
});

// 是否存在下一周周报（数据没有则为 false）
const hasNextReport = computed(() => {
  return !!smugglersData.value?.hasNext && !!smugglersData.value?.nextReportId;
});

/**
 * 页面挂载时拉取当前走私者周报
 */
onMounted(() => {
  getSmugglersData()
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
 * 获取符合当前时间或指定参数的周报（优先命中本地内存缓存）
 *
 * @param params 可选参数，包括 period / reportId / date
 */
const getSmugglersData = async (params?: { period?: 'current' | 'previous' | 'next'; reportId?: number | string; date?: string }) => {
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

  const cacheKey = String(queryParams.reportId || queryParams.period || 'current');

  // 若前端缓存已存在，直接赋值渲染
  if (reportCache.has(cacheKey)) {
    smugglersData.value = reportCache.get(cacheKey);
    if (smugglersData.value?.id) {
      getSmugglersComment(smugglersData.value.id);
    }
    return;
  }

  try {
    browseLoading.value = true;
    const result = await apis.smugglersApi().getRangeTimeReport(queryParams);
    const d = result?.data;

    if (d && d.data) {
      if (Array.isArray(d.data)) {
        smugglersData.value = d.data[0] || {};
      } else {
        smugglersData.value = d.data || {};
      }

      // 写入前端内存缓存
      if (smugglersData.value?.id) {
        reportCache.set(String(smugglersData.value.id), smugglersData.value);
        if (queryParams.period) {
          reportCache.set(queryParams.period, smugglersData.value);
        }
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
    const prevId = smugglersData.value.previousReportId;
    getSmugglersData({ reportId: prevId });
    router.replace({ query: { ...route.query, id: String(prevId), period: undefined } });
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
    const nextId = smugglersData.value.nextReportId;
    getSmugglersData({ reportId: nextId });
    router.replace({ query: { ...route.query, id: String(nextId), period: undefined } });
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

                <!-- 上周/本周/下周 快速切换器 S -->
                <div class="d-flex align-center ga-2 mb-4 flex-wrap">
                  <!-- 上周 -->
                  <v-btn
                      v-if="hasPreviousReport"
                      size="small"
                      variant="outlined"
                      color="amber"
                      prepend-icon="mdi-chevron-left"
                      :loading="browseLoading"
                      @click="onGoPrevious">
                    {{ t('smugglersReport.view.goToPrevious') }}
                  </v-btn>

                  <!-- 本周 -->
                  <v-btn
                      v-if="canGoCurrent"
                      size="small"
                      variant="tonal"
                      color="amber"
                      prepend-icon="mdi-calendar-today"
                      :loading="browseLoading"
                      @click="onGoCurrent">
                    {{ t('smugglersReport.view.goToCurrent') }}
                  </v-btn>

                  <!-- 下周 -->
                  <v-btn
                      v-if="hasNextReport"
                      size="small"
                      variant="outlined"
                      color="amber"
                      append-icon="mdi-chevron-right"
                      :loading="browseLoading"
                      @click="onGoNext">
                    {{ t('smugglersReport.view.goToNext') }}
                  </v-btn>
                </div>
                <!-- 上周/本周/下周 快速切换器 E -->

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
