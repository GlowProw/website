<script setup lang="ts">
/**
 * 赛季统计
 * 汇总各赛季图鉴构成与全站收藏量，数据截至前一天
 */
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Apis} from "@/assets/sripts/api";
import type {PublicSeasonStats, PublicSeasonSummary} from "@/assets/types/Statistics";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import Loading from "@/components/Loading.vue";
import SeasonName from "@/components/snbWidget/seasonName.vue";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";
import SeasonItemsDialog from "@/components/SeasonItemsDialog.vue";
import usePageHotkeys from "@/assets/sripts/page_hotkeys";

const {t, te} = useI18n(),
    statsApi = Apis.publicStatsApi(),
    loading = ref(true),
    data = ref<PublicSeasonStats | null>(null),
    activeSeason = ref<PublicSeasonSummary | null>(null),
    isDetailOpen = ref(false)

/**
 * 打开赛季图鉴明细弹窗
 * @param season 赛季汇总
 */
const onOpenSeason = (season: PublicSeasonSummary) => {
  activeSeason.value = season
  isDetailOpen.value = true
}

/**
 * 明细弹窗关闭后卸载内容，避免保留多余请求数据
 * @param value 弹窗是否可见
 */
const onDetailVisibility = (value: boolean) => {
  isDetailOpen.value = value
  if (!value) activeSeason.value = null
}

/**
 * 加载赛季统计
 */
const onLoad = async () => {
  loading.value = true
  try {
    data.value = await statsApi.getSeason()
  } finally {
    loading.value = false
  }
}

onMounted(onLoad)

usePageHotkeys({
  statsRefresh: () => onLoad(),
})

/**
 * 图鉴种类名称，缺失翻译时回退原始标识
 * @param kind 图鉴种类
 */
const kindName = (kind: string): string => {
  const path = `account.collectionStats.kinds.${kind}`
  return te(path) ? t(path) : kind
}

/**
 * 赛季起始日期展示
 * @param startDate 起始日期
 */
const formatDate = (startDate: string | null): string => {
  if (!startDate) return '-'
  const date = new Date(startDate)
  if (Number.isNaN(date.getTime())) return startDate
  return date.toLocaleDateString()
}

/**
 * 赛季收藏量最大值，用于进度条比例
 */
const maxCollected = computed(() => Math.max(1, ...(data.value?.seasons || []).map(season => season.collected)))

/**
 * 顶部汇总卡片
 */
const summaryCards = computed(() => [
  {
    key: 'entries',
    title: t('statistics.season.summary.entries'),
    value: data.value?.totals.entries || 0,
    icon: 'mdi-bookshelf',
    color: 'amber'
  },
  {
    key: 'seasons',
    title: t('statistics.season.summary.seasons'),
    value: data.value?.totals.seasons || 0,
    icon: 'mdi-trophy-outline',
    color: 'blue'
  },
  {
    key: 'collections',
    title: t('statistics.season.summary.collections'),
    value: data.value?.totals.collections || 0,
    icon: 'mdi-check-decagram',
    color: 'green'
  },
])

defineOptions({
  name: 'StatisticsSeason'
})
</script>

<template>
  <v-card variant="text">
    <v-row class="mb-3">
      <v-col cols="12" lg="auto">
        <span class="opacity-60">{{ t('statistics.common.asOf') }}: {{ data?.asOf || '-' }}</span>
      </v-col>
      <v-spacer class="hidden-sm hidden-md"></v-spacer>
      <v-col cols="12" lg="auto">
        <span v-if="data" class="opacity-60 ml-auto">
          {{ t('statistics.common.updated') }}: {{ new Date(data.updatedAt).toLocaleString() }}
        </span>
      </v-col>
    </v-row>

    <!-- 汇总卡片区 S -->
    <v-row density="compact" class="mt-2 mb-5" :gap="15">
      <v-col cols="12" sm="6" md="4" lg="4" v-for="card in summaryCards" :key="card.key">
        <v-card
            border
            rounded="lg"
            variant="text"
            min-height="140px"
            class="d-flex flex-column justify-center h-100"
            :style="`background-color: color-mix(in srgb, ${card.color} 20%, #000 70%)`">
          <div style="opacity: .05; font-size: 7.2rem; position: absolute; left: 0; bottom: 0">
            <v-icon :icon="card.icon" :color="card.color" class="mr-1"></v-icon>
          </div>

          <div class="px-6 py-4">
            <div class="opacity-60 mb-1">{{ card.title }}</div>
            <div class="text-h4 font-weight-bold" :class="`text-${card.color}`">
              {{ card.value.toLocaleString() }}
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <!-- 汇总卡片区 E -->

    <!-- 赛季明细 S -->
    <AffixBoxHasTitleView>
      <template v-slot:title>
        {{ t('statistics.season.bySeason') }}
      </template>

      <Loading v-if="loading" size="50"></Loading>

      <v-row v-else>
        <v-col cols="12" md="6" lg="4" v-for="season in data?.seasons || []" :key="season.season">
          <div class="season-card-wrapper">
            <v-card density="compact" variant="text">
              <v-card variant="text" height="200">
                <SeasonViewWidget :data="{id: season.season}"></SeasonViewWidget>

                <!-- 悬浮查看入口 -->
                <div class="season-card-hover" @click="onOpenSeason(season)">
                  <v-btn color="amber" variant="flat" class="px-6" elevation="24">
                    {{ t('statistics.season.view') }}
                  </v-btn>
                </div>
              </v-card>

              <v-card-item class="pa-0 ma-0">
                <v-card-title class="u my-2 font-weight-bold"><SeasonName :id="season.season"></SeasonName></v-card-title>
                <v-card-subtitle class="opacity-60 mb-2">
                  {{ t('statistics.season.startDate') }}: {{ formatDate(season.startDate) }}
                </v-card-subtitle>
                <template v-slot:append>
                  <div class="text-right">
                    <div class="text-body-2">
                      {{ t('statistics.season.entriesCount') }}: <b>{{ season.entries.toLocaleString() }}</b>
                    </div>
                    <div class="text-caption opacity-60">
                      <u class="u">{{ t('statistics.season.collectedCount') }}: {{ season.collected.toLocaleString() }}</u>
                    </div>
                  </div>
                </template>
              </v-card-item>

              <v-card-text class="pa-0 ma-0">
                <v-progress-linear
                    :model-value="season.collected / maxCollected * 100"
                    color="amber"
                    height="6"
                    rounded
                    bg-opacity=".08"
                    class="mb-3"></v-progress-linear>

                <v-row class="d-flex flex-wrap ga-2">
                  <v-col cols="12" v-for="item in season.byType" :key="item.targetType">
                    <v-row align="center">
                      <v-col cols="auto">
                        {{ kindName(item.targetType) }}
                      </v-col>
                      <v-col>
                        <v-divider></v-divider>
                      </v-col>
                      <v-col cols="auto">
                        <u class="u">{{ item.count.toLocaleString() }}</u>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </v-col>

        <v-col cols="12" v-if="!data?.seasons.length" class="text-center opacity-40 py-6 text-caption">
          {{ t('statistics.common.noData') }}
        </v-col>
      </v-row>
    </AffixBoxHasTitleView>
    <!-- 赛季明细 E -->

    <SeasonItemsDialog
        v-if="activeSeason"
        :model-value="isDetailOpen"
        :season="activeSeason"
        @update:model-value="onDetailVisibility"/>
  </v-card>
</template>

<style scoped lang="less">
.season-card-wrapper {
  position: relative;
  height: 100%;
}

.season-card-hover {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s ease;
}

.season-card-wrapper:hover .season-card-hover {
  opacity: 1;
  pointer-events: auto;
}
</style>
