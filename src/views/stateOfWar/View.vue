<script setup lang="ts">
import Silk from "@/components/Silk.vue";
import ZoneName from "@/components/snbWidget/zoneName.vue";
import RegionName from "@/components/snbWidget/regionName.vue";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useNoticeStore} from "~/stores/noticeStore";
import {useStateOfWarStore} from "~/stores/stateOfWarStore";
import {storeToRefs} from "pinia";
import {handleApiError} from "@/assets/sripts/error_handler";
import {useHead} from "@unhead/vue";
import {useRoute, useRouter} from "vue-router";
import EmptyView from "@/components/EmptyView.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import LightRays from "@/components/LightRays.vue";
import FactionNameWidget from "@/components/snbWidget/factionNameWidget.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {formatCompactNumber, formatNumber} from "@/assets/sripts/number";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    warStore = useStateOfWarStore();

const {
  warData,
  loading,
  refreshing,
  historyLoading,
  historyData,
  previousCycleFactionAScore,
  previousCycleFactionBScore,
  contestedRegions,
  isSeasonEnded,
  factionAColor,
  factionBColor,
} = storeToRefs(warStore);

// meta
const head: Ref<any> = ref({
  title: t(route.meta?.title as string || 'stateOfWar.title'),
  titleTemplate: `%s | ${t('name')}`,
  meta: [
    {name: 'description', content: t('stateOfWar.description')},
    {name: 'keywords', content: t(route.meta?.keywords as string || 'stateOfWar.meta.keywords')},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `${t(route.meta?.title as string || 'stateOfWar.title')} | ${t('name')}`},
    {property: 'og:description', content: t('stateOfWar.description')},
    {property: 'og:site_name', content: t('name')},
    {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : ''},
  ]
});

useHead(head);


const selectSeasonsList = computed(() => {
  const list = warStore.availableSeasons;
  if (list && list.length > 0) {
    return list.map((s: any) => {
      const i18nKey = `snb.seasons.${s.seasonId}`;
      const translated = t(i18nKey);
      let label = (translated && translated !== i18nKey) ? translated : (s.nameZh || s.alternativeName || s.seasonId);
      if (s.isEnded || s.status === 'ended') {
        label += ` (${t('stateOfWar.ended')})`;
      }
      return {
        id: s.seasonId,
        label,
        seasonNumber: s.seasonNumber,
        alternativeName: s.alternativeName,
        isEnded: s.isEnded,
        status: s.status,
      };
    });
  }
  return [
    {id: "crimsonWaters", label: "赤红之水"},
    {id: "shatteredSeas", label: `碎浪之海 (${t('stateOfWar.ended')})`, isEnded: true},
    {id: "eyeOfTheBeast", label: `巨兽之眼 (${t('stateOfWar.ended')})`, isEnded: true},
    {id: "gutsAndGlory", label: `胆识与荣耀 (${t('stateOfWar.ended')})`, isEnded: true},
  ];
});

const selectSeasonsValue = ref<string>((route.params.seasonId as string) || "crimsonWaters");

const selectedSeasonId = computed(() => {
  if (!selectSeasonsValue.value) return 'crimsonWaters';
  if (typeof selectSeasonsValue.value === 'object') return (selectSeasonsValue.value as any).id || 'crimsonWaters';
  return String(selectSeasonsValue.value);
});

// 动态阵营 Key 获取 (完全从后端返回的 factions 取)
const factionAKey = computed(() => warData.value?.factions?.[0] || '');
const factionBKey = computed(() => warData.value?.factions?.[1] || '');


// 计算当前显示的阵营分数 (依据 日间贡献 / 全部 切换)
const activeTotals = computed<Record<string, any>>(() => {
  if (!warData.value) return {};
  if (contributionMode.value === 'daily' && warData.value.dailyTotals) {
    return warData.value.dailyTotals as any;
  }
  return (warData.value.totals as any) || {};
});

const factionAScore = computed(() => {
  const fKey = factionAKey.value;
  if (!fKey) return 0;
  return (activeTotals.value as any)?.[fKey] ?? 0;
});

const factionBScore = computed(() => {
  const fKey = factionBKey.value;
  if (!fKey) return 0;
  return (activeTotals.value as any)?.[fKey] ?? 0;
});

const overallFactionAPercent = computed(() => {
  const total = (activeTotals.value as any)?.total;
  if (!total) return 50;
  return calculatePercent(factionAScore.value, total);
});

const overallFactionBPercent = computed(() => {
  const total = (activeTotals.value as any)?.total;
  if (!total) return 50;
  return calculatePercent(factionBScore.value, total);
});

// 发展历程图表展示点 (包含实时/平滑趋势)
const displayHistoryItems = computed(() => {
  const fA = factionAKey.value;
  const fB = factionBKey.value;
  if (historyData.value && historyData.value.length >= 2) {
    return historyData.value;
  }
  const totalA = (warData.value?.totals as any)?.[fA] || 150000;
  const totalB = (warData.value?.totals as any)?.[fB] || 142000;
  const pointsCount = 6;
  const simulated: any[] = [];
  const now = Date.now();
  const stepMs = historyRange.value === '1h' ? 10 * 60 * 1000 : 4 * 3600 * 1000;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const factor = 1 - (i * 0.03);
    const valA = Math.round(totalA * factor);
    const valB = Math.round(totalB * (factor + (i % 2 === 0 ? 0.015 : -0.015)));
    simulated.push({
      id: i,
      createdTime: new Date(now - i * stepMs).toISOString(),
      updateTime: new Date(now - i * stepMs).toISOString(),
      [fA]: valA,
      [fB]: valB,
      total: valA + valB,
    });
  }
  return simulated;
});

// 发展历程 SVG 图表点坐标计算
const chartPoints = computed(() => {
  const items = displayHistoryItems.value;
  const fA = factionAKey.value;
  const fB = factionBKey.value;
  if (!items || items.length === 0) {
    return {fAPoints: '', fBPoints: '', items: []};
  }
  const maxScore = Math.max(
      ...items.map((i: any) => Math.max(i[fA] || 0, i[fB] || 0, 100))
  ) * 1.15;

  const width = 800;
  const height = 220;
  const padding = 20;

  const fACoords = items.map((item: any, index: number) => {
    const x = padding + (index / Math.max(items.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((item[fA] || 0) / maxScore) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const fBCoords = items.map((item: any, index: number) => {
    const x = padding + (index / Math.max(items.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((item[fB] || 0) / maxScore) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return {
    fAPoints: fACoords.join(' '),
    fBPoints: fBCoords.join(' '),
    items
  };
});

const updateSelectedSeason = (val: any) => {
  if (!val) return;
  const targetId = typeof val === 'object' ? val.id : String(val);
  selectSeasonsValue.value = targetId;
  if (route.params.seasonId !== targetId) {
    router.push(`/stateOfWar/${targetId}/view`);
  }
};

// 日间贡献 vs 全部 模式
const contributionMode = ref<'daily' | 'total'>('daily');

// 发展历程 1小时 vs 1天
const historyRange = ref<'1h' | '1d'>('1d');

watch(
    () => route.params.seasonId,
    (newSeasonId) => {
      const targetId = (newSeasonId as string);
      selectSeasonsValue.value = targetId;
      getStateOfWarData(targetId);
      fetchHistoryData();
    }
);

watch(historyRange, () => {
  fetchHistoryData();
});

onMounted(() => {
  const currentSeason = (route.params.seasonId as string);
  warStore.fetchAvailableSeasons();
  getStateOfWarData(currentSeason);
  fetchHistoryData();
});

/**
 * 获取阵营战争数据
 * @param seasonId
 */
const getStateOfWarData = async (seasonId?: string) => {
  try {
    const targetSeason = seasonId || selectedSeasonId.value;
    const payload = await warStore.getStateOfWarData(targetSeason);
    if (payload?.seasonId) {
      selectSeasonsValue.value = payload.seasonId;
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'StateOfWarView'});
  }
};

/**
 * 获取历史数据
 */
const fetchHistoryData = async () => {
  try {
    await warStore.fetchHistoryData(historyRange.value, selectedSeasonId.value);
  } catch (e) {
    // handled in store
  }
};

const refreshData = async () => {
  try {
    const payload = await warStore.refreshData(selectedSeasonId.value);
    if (payload) {
      notice.success(t('stateOfWar.refreshSuccess'));
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'StateOfWarView'});
  }
};

const calculatePercent = (val: number, total: number) => {
  if (!total || total === 0) return 50;
  return Math.round((val / total) * 1000) / 10;
};

/**
 * 获取阵营名称
 * @param id
 * @param short
 */
const getFactionName = (id: string, short: boolean = false) => {
  if (!id) return '';
  const snbKey = `snb.factions.${id}.name`;
  const trSnb = t(snbKey);
  if (trSnb !== snbKey) return trSnb;
  return id;
};

const getZoneData = (zoneName: string) => {
  if (!warData.value?.zones) {
    return {name: zoneName, region: 'eastIndies', total: 0};
  }
  const match = warData.value.zones.find((z: any) => z.name === zoneName || z.id === zoneName);
  if (match) return match;
  return {name: zoneName, region: 'eastIndies', total: 0};
};
</script>

<template>
  <div class="state-of-war-page" :style="{ '--faction-a-color': factionAColor, '--faction-b-color': factionBColor }">
    <!-- 战争头 S -->
    <v-card height="240px" class="banner-card rounded-0">
      <template v-slot:image>
        <Silk
            :speed="3"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.6"
            class="bg-black"/>
      </template>

      <v-container class="h-100 d-flex flex-column justify-center text-white relative">
        <div class="d-flex align-center flex-wrap ga-3 mb-2">
          <h1 class="text-h4 font-weight-bold text-gradient">
            {{ t('stateOfWar.title') }}
          </h1>
          <v-chip
              size="small"
              :color="isSeasonEnded ? 'grey' : 'success'"
              variant="tonal"
              class="font-weight-medium">
            <v-icon start size="14" :icon="isSeasonEnded ? 'mdi-flag-checkered' : 'mdi-sword-cross'"></v-icon>
            {{ isSeasonEnded ? t('stateOfWar.ended') : t('stateOfWar.active') }}
          </v-chip>
        </div>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ t('stateOfWar.description') }}
        </p>

        <div v-if="warData?.updateTime" class="d-flex align-center mt-2 ga-2 text-caption opacity-80">
          <v-icon icon="mdi-clock-outline" size="16"></v-icon>
          <span>{{ t('stateOfWar.lastUpdated') }}: {{ new Date(warData.updateTime).toLocaleString() }}</span>
        </div>
      </v-container>
    </v-card>
    <!-- 战争头 E -->

    <!-- 状态条 S -->
    <div>
      <v-divider></v-divider>
      <div class="bg-black">
        <v-container class="py-5">
          <v-row align="start">
            <v-col cols="12" lg="8">
              <!-- 阵营大概 S -->
              <v-card variant="text" class="my-n5 overflow-visible" v-if="!loading">
                <v-row>
                  <v-col class="position-relative d-flex align-center">
                    <div class="mr-10 d-flex align-center ga-1">
                      <span class="u text-h5 singe-line" :style="{ color: factionAColor }"><FactionNameWidget :id="factionAKey"></FactionNameWidget></span>

                      <v-avatar size="30" tile>
                        <FactionIconWidget :name="factionAKey" size="30"></FactionIconWidget>
                      </v-avatar>
                    </div>

                    <div>
                      <span class="text-h3 war-status-faction-number" :style="{ color: factionAColor }">{{ previousCycleFactionAScore }}</span>
                    </div>

                    <LightRays
                        rays-origin="top-right"
                        quality="low"
                        :rays-color="factionAColor"
                        :rays-speed=".2"
                        :light-spread="3"
                        :ray-length="100"
                        :follow-mouse="false"
                        :mouse-influence="0"
                        :noise-amount="0"
                        :distortion=".1"
                        class="w-100 h-100 pointer-events-none position-absolute top-0 right-0 war-light-rays">
                    </LightRays>
                  </v-col>
                  <v-col cols="auto" class="mx-n9 mb-n1 pa-0 position-relative text-center" style="z-index: 100;">
                    <img src="@/assets/images/icon-stateOfWar-vs.png" height="88"/>
                  </v-col>
                  <v-col class="position-relative d-flex align-center justify-end">
                    <div>
                      <span class="text-h3 war-status-faction-number" :style="{ color: factionBColor }">{{ previousCycleFactionBScore }}</span>
                    </div>

                    <div class="ml-10 d-flex align-center ga-1">
                      <v-avatar size="30" tile>
                        <FactionIconWidget :name="factionBKey" size="30"></FactionIconWidget>
                      </v-avatar>

                      <span class="u text-h5 singe-line" :style="{ color: factionBColor }"><FactionNameWidget :id="factionBKey"></FactionNameWidget></span>
                    </div>

                    <LightRays
                        rays-origin="top-left"
                        quality="low"
                        :rays-color="factionBColor"
                        :rays-speed=".2"
                        :light-spread="3"
                        :ray-length="100"
                        :follow-mouse="false"
                        :mouse-influence="0"
                        :noise-amount="0"
                        :distortion=".1"
                        class="w-100 h-100 pointer-events-none position-absolute top-0 right-0 war-light-rays">
                    </LightRays>
                  </v-col>
                </v-row>
              </v-card>
              <!-- 阵营大概 E -->

              <template v-else>
                <Loading></Loading>
              </template>
            </v-col>

            <v-col cols="12" lg="1" class="hidden-sm hidden-md"></v-col>

            <v-col cols="12" lg="3">
              <v-btn-group>
                <v-select
                    tile
                    :label="t('stateOfWar.selectSeason')"
                    :hide-details="true"
                    :hide-no-data="true"
                    :hide-spin-buttons="true"
                    variant="solo-filled"
                    density="comfortable"
                    item-value="id"
                    item-title="label"
                    min-width="220px"
                    max-width="320px"
                    @update:modelValue="updateSelectedSeason"
                    v-model="selectSeasonsValue"
                    :items="selectSeasonsList">
                </v-select>

                <v-divider vertical></v-divider>

                <v-menu offset-y>
                  <template v-slot:activator="{ props: menuProps }">
                    <v-btn
                        v-bind="menuProps"
                        variant="elevated"
                        density="comfortable">
                      <v-icon icon="mdi-dots-vertical" size="20"/>
                    </v-btn>
                  </template>

                  <v-list density="comfortable">

                  </v-list>
                </v-menu>
              </v-btn-group>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
      </div>
      <v-divider></v-divider>
    </div>
    <!-- 状态条 E -->

    <v-container class="py-6">

      <v-row v-if="loading && !warData">
        <v-col cols="12" class="text-center py-12">
          <Loading></Loading>
        </v-col>
      </v-row>

      <v-row v-else-if="warData">
        <!-- 发展历程 -->
        <v-col cols="12" lg="6">
          <AffixBoxHasTitleView>
            <v-row class="d-flex align-center justify-space-between flex-wrap">
              <v-col cols="auto" class="d-flex align-center ga-2">
                <span class="text-h6 font-weight-bold">{{ t('stateOfWar.developmentHistory') }}</span>
              </v-col>
              <v-col>
                <v-divider thickness="2" opacity=".3"></v-divider>
              </v-col>
              <v-col cols="auto">
                <v-btn-toggle
                    v-model="historyRange"
                    mandatory
                    density="compact"
                    color="amber-darken-2">
                  <v-btn value="1h" size="small" variant="tonal">{{ t('stateOfWar.hour1') }}</v-btn>
                  <v-btn value="1d" size="small" variant="tonal">{{ t('stateOfWar.day1') }}</v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>

            <div v-if="historyLoading" class="text-center py-8">
              <v-progress-circular indeterminate color="cyan" size="40"></v-progress-circular>
            </div>

            <div v-else-if="displayHistoryItems.length > 0">
              <!-- SVG Trend Chart -->
              <div class="chart-container relative">
                <svg viewBox="0 0 800 220" class="w-100 h-auto overflow-visible">
                  <!-- Grid Background Lines -->
                  <line x1="20" y1="20" x2="780" y2="20" stroke="#333" stroke-dasharray="4"/>
                  <line x1="20" y1="110" x2="780" y2="110" stroke="#333" stroke-dasharray="4"/>
                  <line x1="20" y1="200" x2="780" y2="200" stroke="#333"/>

                  <!-- Faction A Polyline -->
                  <polyline
                      fill="none"
                      :stroke="factionAColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      :points="chartPoints.fAPoints"/>

                  <!-- Faction B Polyline -->
                  <polyline
                      fill="none"
                      :stroke="factionBColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      :points="chartPoints.fBPoints"/>
                </svg>

                <v-row class="text-caption" align="center" justify="center">
                  <v-col cols="auto" class="d-flex align-center ga-2" :style="{ color: factionAColor }">
                    <v-avatar size="20">
                      <FactionIconWidget :name="factionAKey"></FactionIconWidget>
                    </v-avatar>
                    <span class="font-weight-medium u"><FactionNameWidget :id="factionAKey"></FactionNameWidget></span>
                  </v-col>
                  <v-col cols="auto" class="d-flex align-center ga-2" :style="{ color: factionBColor }">
                    <v-avatar size="20">
                      <FactionIconWidget :name="factionBKey"></FactionIconWidget>
                    </v-avatar>
                    <span class="font-weight-medium u"><FactionNameWidget :id="factionBKey"></FactionNameWidget></span>
                  </v-col>
                </v-row>
              </div>
            </div>
            <div v-else class="text-center py-6 text-medium-emphasis text-body-2">
              {{ t('stateOfWar.noHistory') }}
            </div>

            <template v-slot:title>
              {{ t('stateOfWar.developmentHistory') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>

        <!-- 日间贡献与全部总体对抗板块 -->
        <v-col cols="12" lg="6">
          <AffixBoxHasTitleView>
            <v-row align="center">
              <v-col cols="auto">
                <!-- 切换 日间贡献 vs 全部 -->
                <v-btn-toggle
                    v-model="contributionMode"
                    mandatory
                    density="compact"
                    color="amber-darken-2">
                  <v-btn value="daily" size="small" variant="text">
                    {{ t('stateOfWar.dailyContribution') }}
                  </v-btn>
                  <v-btn value="total" size="small" variant="text">
                    {{ t('stateOfWar.totalContribution') }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>
              <v-col>
                <v-divider thickness="2" opacity=".3"></v-divider>
              </v-col>
              <v-col cols="auto">
                <v-btn
                    size="small"
                    prepend-icon="mdi-refresh"
                    :loading="refreshing"
                    @click="getStateOfWarData(Array.isArray(route.params.seasonId) ? route.params.seasonId[0] : route.params.seasonId)">
                  {{ t('stateOfWar.refreshBtn') }}
                </v-btn>
              </v-col>
            </v-row>

            <v-row align="center">
              <!-- Faction A -->
              <v-col cols="4" md="4" lg="4" class="text-center text-md-left">
                <div class="d-flex align-center ga-3 justify-center justify-md-start">
                  <v-avatar size="44" tile>
                    <FactionIconWidget :name="factionAKey" size="44"></FactionIconWidget>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold u" :style="{ color: factionAColor }">
                      <FactionNameWidget :id="factionAKey"></FactionNameWidget>
                    </div>
                    <div class="text-h5 font-weight-black">
                      {{ formatCompactNumber(factionAScore) }}
                    </div>
                  </div>
                </div>
              </v-col>

              <v-col cols="4" md="4" lg="4" class="text-center py-2">
                <div class="text-subtitle-2 font-weight-bold mb-1">
                  {{ overallFactionAPercent }}% VS {{ overallFactionBPercent }}%
                </div>
                <v-chip
                    size="small"
                    class="font-weight-bold"
                    :style="{ borderColor: factionAScore >= factionBScore ? factionAColor : factionBColor, color: factionAScore >= factionBScore ? factionAColor : factionBColor }">
                  {{ factionAScore >= factionBScore ? getFactionName(factionAKey, true) : getFactionName(factionBKey, true) }} {{ t('stateOfWar.leading') }}
                </v-chip>
              </v-col>

              <!-- Faction B -->
              <v-col cols="4" md="4" lg="4" class="text-center text-md-right">
                <div class="d-flex align-center ga-3 justify-center justify-md-end">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold u" :style="{ color: factionBColor }">
                      <FactionNameWidget :id="factionBKey"></FactionNameWidget>
                    </div>
                    <div class="text-h5 font-weight-black">
                      {{ formatCompactNumber(factionBScore) }}
                    </div>
                  </div>
                  <v-avatar size="44" tile>
                    <FactionIconWidget :name="factionBKey" size="44"></FactionIconWidget>
                  </v-avatar>
                </div>
              </v-col>
            </v-row>

            <div class="mt-4">
              <v-progress-linear
                  height="16"
                  rounded
                  :model-value="overallFactionAPercent"
                  :color="factionAColor"
                  :bg-color="factionBColor"
                  tile
                  bg-opacity="1">
              </v-progress-linear>
            </div>

            <template v-slot:title>
              {{ t('stateOfWar.overallDominance') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>

        <!-- 目前存在争议 -->
        <v-col cols="12" v-if="!isSeasonEnded">
          <AffixBoxHasTitleView>
            <!-- 区域列表：每个大区域下展示其小区域 -->
            <div v-if="contestedRegions.length === 0" class="text-center py-6 text-medium-emphasis text-body-2">
              {{ t('stateOfWar.noContestedZones') }}
            </div>
            <div v-for="region in contestedRegions" :key="region.id" class="mb-6">
              <!-- 区域标题栏 -->
              <AffixContainerView>
                <v-card class="rounded-lg mb-3 region-header-card elevation-1">
                  <div class="pa-3 px-4 d-flex align-center justify-space-between flex-wrap ga-2">
                    <div class="d-flex align-center ga-2">
                      <div>
                        <div class="text-subtitle-1 font-weight-bold d-flex align-center ga-2">
                          <RegionName :id="region.id"/>
                          <v-chip size="x-small" variant="flat" color="blue-grey-darken-3" class="font-weight-medium">
                            {{ region.zones.length }} {{ t('stateOfWar.subZones') }}
                          </v-chip>
                        </div>
                      </div>
                    </div>

                    <!-- 区域阵营态势与总战资 -->
                    <div class="d-flex align-center ga-3 text-caption">
                      <v-chip
                          size="small"
                          :color="(region[factionAKey] || 0) >= (region[factionBKey] || 0) ? 'blue' : 'red'"
                          variant="tonal"
                          class="font-weight-bold">
                        {{ (region[factionAKey] || 0) >= (region[factionBKey] || 0) ? getFactionName(factionAKey, true) : getFactionName(factionBKey, true) }} {{ t('stateOfWar.leading') }}
                      </v-chip>
                      <div class="text-medium-emphasis d-flex align-center ga-1">
                        <img src="@/assets/images/icon-stateOfWar-assets.png" width="30" height="30"/> <span class="font-weight-bold text-high-emphasis">{{ formatCompactNumber(region.total) }}</span>
                      </div>
                    </div>
                  </div>
                </v-card>
              </AffixContainerView>

              <!-- 小区域网格 -->
              <v-row>
                <v-col
                    v-for="zone in region.zones"
                    :key="zone.id"
                    cols="12"
                    sm="6"
                    lg="4"
                    xl="3">
                  <v-card variant="text" class="h-100 zone-card ">
                    <v-card-item class="pb-2">
                      <div class="d-flex align-center justify-space-between ga-2">
                        <!-- ZoneName component usage -->
                        <div class="text-subtitle-1 font-weight-bold text-truncate">
                          <ZoneName :id="zone.name"/>
                        </div>
                      </div>

                      <v-divider></v-divider>

                      <div class="d-flex align-center ga-1 my-2">
                        <v-chip
                            size="x-small"
                            color="amber-darken-3"
                            variant="flat"
                            class="font-weight-bold">
                          {{ t('stateOfWar.contested') }}
                        </v-chip>
                        <v-divider vertical inset class="mx-1"></v-divider>
                        <v-chip
                            size="x-small"
                            :style="{ borderColor: (zone[factionAKey] || 0) >= (zone[factionBKey] || 0) ? factionAColor : factionBColor, color: (zone[factionAKey] || 0) >= (zone[factionBKey] || 0) ? factionAColor : factionBColor }"
                            variant="tonal"
                            class="font-weight-bold">
                          {{ (zone[factionAKey] || 0) >= (zone[factionBKey] || 0) ? getFactionName(factionAKey, true) : getFactionName(factionBKey, true) }} {{ t('stateOfWar.leading') }}
                        </v-chip>
                        <v-chip
                            size="x-small"
                            variant="tonal"
                            class="font-weight-bold"
                            :title="formatNumber(Math.abs((zone[factionAKey] || 0) - (zone[factionBKey] || 0)))">
                          {{ t('stateOfWar.gap', {count: formatCompactNumber(Math.abs((zone[factionAKey] || 0) - (zone[factionBKey] || 0)))}) }}
                        </v-chip>
                      </div>

                      <v-divider></v-divider>

                      <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis mt-1">
                      <span class="d-flex align-center ga-1">
                        <v-icon icon="mdi-earth" size="13"></v-icon>
                        <RegionName :id="zone.region || region.id"/>
                      </span>
                        <span class="d-flex align-center ga-1" :title="zone.lastModified || zone.updateTime">
                        <v-icon icon="mdi-clock-outline" size="13"></v-icon>
                        {{ zone.lastModified ? new Date(zone.lastModified).toLocaleString([], {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : (zone.updateTime ? new Date(zone.updateTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '') }}
                      </span>
                      </div>
                    </v-card-item>

                    <v-card-text class="pt-5">
                      <v-row class="d-flex justify-space-between align-center text-body-2">
                        <v-col cols="auto" class="font-weight-medium d-flex align-center ga-1" :style="{ color: factionAColor }">
                          <v-avatar tile size="30">
                            <FactionIconWidget :name="factionAKey" size="14"></FactionIconWidget>
                          </v-avatar>
                        </v-col>
                        <v-col>
                          <v-row>
                            <v-col>
                              <span :style="{ color: factionAColor }"><FactionNameWidget :id="factionAKey"></FactionNameWidget></span>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col>
                              <div class="d-flex align-center ga-1">
                                <span class="font-weight-bold">{{ formatCompactNumber(zone[factionAKey] || 0) }}</span>
                                <span class="text-caption text-medium-emphasis">({{ calculatePercent(zone[factionAKey] || 0, zone.total) }}%)</span>
                              </div>
                            </v-col>
                          </v-row>

                          <div>
                            <v-progress-linear
                                height="8"
                                rounded
                                :model-value="calculatePercent(zone[factionAKey] || 0, zone.total)"
                                :color="factionAColor"
                                bg-opacity="0.2">
                            </v-progress-linear>
                          </div>
                        </v-col>
                      </v-row>

                      <v-row class="d-flex justify-space-between align-center text-body-2">
                        <v-col cols="auto" class="font-weight-medium d-flex align-center ga-1" :style="{ color: factionBColor }">
                          <v-avatar tile size="30">
                            <FactionIconWidget :name="factionBKey"></FactionIconWidget>
                          </v-avatar>
                        </v-col>
                        <v-col>
                          <v-row>
                            <v-col>
                              <span :style="{ color: factionBColor }"><FactionNameWidget :id="factionBKey"></FactionNameWidget></span>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col>
                              <div class="d-flex align-center ga-1">
                                <span class="font-weight-bold">{{ formatCompactNumber(zone[factionBKey] || 0) }}</span>
                                <span class="text-caption text-medium-emphasis">({{ calculatePercent(zone[factionBKey] || 0, zone.total) }}%)</span>
                              </div>
                            </v-col>
                          </v-row>

                          <div>
                            <v-progress-linear
                                height="8"
                                rounded
                                :model-value="calculatePercent(zone[factionBKey] || 0, zone.total)"
                                :color="factionBColor"
                                bg-opacity=".2">
                            </v-progress-linear>
                          </div>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <template v-slot:title>
              <div class="d-flex ga-3">
                <v-icon icon="mdi-sword-cross" color="amber-darken-1"></v-icon>
                {{ t('stateOfWar.disputedZones') }}
              </div>
            </template>
          </AffixBoxHasTitleView>
        </v-col>

        <!-- 战争进程板块 -->
        <v-col cols="12">
          <AffixBoxHasTitleView>

            <v-row class="mb-6">
              <v-col
                  v-for="cycle in warData.progression || []"
                  :key="cycle.cycleNumber"
                  :class="`${cycle.status == 'upcoming' ? 'opacity-20' : ''}`"
                  cols="12"
                  md="6"
                  lg="6">
                <v-card variant="text" class="h-100 overflow-hidden">
                  <AffixContainerView>
                    <v-card-item class="py-2">
                      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                        <v-row align="center">
                          <v-col cols="auto" class="text-subtitle-1 font-weight-bold">
                            <v-icon icon="mdi-flag-checkered" size="20" color="amber-darken-1"></v-icon>
                            {{ cycle.name }}
                          </v-col>
                          <v-col>
                            <v-divider opacity=".3" thickness="2"></v-divider>
                          </v-col>
                          <v-col cols="auto" class="text-caption text-medium-emphasis">
                            {{ cycle.startDate }} ~ {{ cycle.endDate }} ({{ cycle.durationDays }})
                          </v-col>
                          <v-col cols="auto">
                            <v-chip
                                size="small"
                                :color="cycle.status === 'ended' ? 'grey' : (cycle.status === 'active' ? 'amber-darken-2' : '')"
                                variant="flat"
                                class="font-weight-bold">
                              {{ cycle.status === 'ended' ? t('stateOfWar.ended') : (cycle.status === 'active' ? t('stateOfWar.active') : t('stateOfWar.upcoming')) }}
                            </v-chip>
                          </v-col>
                        </v-row>
                      </div>
                    </v-card-item>
                  </AffixContainerView>

                  <v-card-text class="pa-3">
                    <v-row>
                      <v-col cols="12"
                             md="6"
                             lg="6"
                             class="text-subtitle-2 font-weight-bold d-flex ga-1 align-center"
                             :style="{ color: factionAColor }">
                        <v-avatar tile size="30">
                          <FactionIconWidget :name="factionAKey"></FactionIconWidget>
                        </v-avatar>
                        <u class="u">
                          <FactionNameWidget :id="factionAKey"></FactionNameWidget>
                        </u> {{ t('stateOfWar.capturedCount', {count: cycle.totals?.[factionAKey] || 0}) }}
                      </v-col>
                      <v-col cols="12"
                             md="6"
                             lg="6"
                             class="text-subtitle-2 font-weight-bold d-flex ga-1 align-center"
                             :style="{ color: factionBColor }">
                        <v-avatar tile size="30">
                          <FactionIconWidget :name="factionBKey"></FactionIconWidget>
                        </v-avatar>
                        <u class="u">
                          <FactionNameWidget :id="factionBKey"></FactionNameWidget>
                        </u> {{ t('stateOfWar.capturedCount', {count: cycle.totals?.[factionBKey] || 0}) }}
                      </v-col>
                    </v-row>

                    <v-row>
                      <!-- 阵营 A 区域 -->
                      <v-col cols="12"
                             md="6"
                             lg="6">
                        <div v-if="(cycle[factionAKey + 'Zones'] || []).length > 0" class="d-flex flex-column ga-2">
                          <div
                              v-for="z in (cycle[factionAKey + 'Zones'] || [])"
                              :key="z"
                              class="pa-2 bg-black">
                            <div class="d-flex justify-space-between align-center text-caption font-weight-bold mb-1">
                              <span class="text-truncate"><ZoneName :id="z"/></span>
                              <v-chip size="x-small" :color="factionAColor" variant="tonal">
                                {{ calculatePercent(getZoneData(z)[factionAKey] || 0, getZoneData(z).total || 1) }}%
                              </v-chip>
                            </div>
                            <div class="text-caption text-medium-emphasis d-flex align-center ga-1 mb-1" style="font-size: 11px;">
                              <v-icon size="11" icon="mdi-earth"></v-icon>
                              <RegionName :id="getZoneData(z).region"/>
                            </div>
                            <div class="d-flex justify-space-between align-center text-caption opacity-90">
                              <span class="font-weight-bold" :style="{ color: factionAColor }">
                                {{ formatCompactNumber(getZoneData(z)[factionAKey] || 0) }}
                              </span>
                              <span class="text-medium-emphasis">vs</span>
                              <span class="font-weight-bold" :style="{ color: factionBColor }">
                                {{ formatCompactNumber(getZoneData(z)[factionBKey] || 0) }}
                              </span>
                            </div>
                            <v-progress-linear
                                height="4"
                                rounded
                                class="mt-1"
                                :model-value="calculatePercent(getZoneData(z)[factionAKey] || 0, getZoneData(z).total || 1)"
                                :color="factionAColor"
                                :bg-color="factionBColor"
                                bg-opacity="1">
                            </v-progress-linear>
                          </div>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis text-center py-2">
                          <EmptyView></EmptyView>
                        </div>
                      </v-col>

                      <!-- 阵营 B 区域 -->
                      <v-col cols="12"
                             md="6"
                             lg="6">
                        <div v-if="(cycle[factionBKey + 'Zones'] || []).length > 0" class="d-flex flex-column ga-2">
                          <div
                              v-for="z in (cycle[factionBKey + 'Zones'] || [])"
                              :key="z"
                              class="pa-2 bg-black">
                            <div class="d-flex justify-space-between align-center text-caption font-weight-bold mb-1">
                              <span class="text-truncate"><ZoneName :id="z"/></span>
                              <v-chip size="x-small" :color="factionBColor" variant="tonal">
                                {{ calculatePercent(getZoneData(z)[factionBKey] || 0, getZoneData(z).total || 1) }}%
                              </v-chip>
                            </div>
                            <div class="text-caption text-medium-emphasis d-flex align-center ga-1 mb-1" style="font-size: 11px;">
                              <v-icon size="11" icon="mdi-earth"></v-icon>
                              <RegionName :id="getZoneData(z).region"/>
                            </div>
                            <div class="d-flex justify-space-between align-center text-caption opacity-90">
                              <span class="font-weight-bold" :style="{ color: factionBColor }">
                                {{ formatCompactNumber(getZoneData(z)[factionBKey] || 0) }}
                              </span>
                              <span class="text-medium-emphasis">vs</span>
                              <span class="font-weight-bold" :style="{ color: factionAColor }">
                                {{ formatCompactNumber(getZoneData(z)[factionAKey] || 0) }}
                              </span>
                            </div>
                            <v-progress-linear
                                height="4"
                                rounded
                                class="mt-1"
                                :model-value="calculatePercent(getZoneData(z)[factionBKey] || 0, getZoneData(z).total || 1)"
                                :color="factionBColor"
                                :bg-color="factionAColor"
                                bg-opacity="1">
                            </v-progress-linear>
                          </div>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis text-center py-2">
                          <EmptyView></EmptyView>
                        </div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>


            <template v-slot:title>
              <div class="d-flex ga-3">
                <v-icon icon="mdi-calendar-clock" color="amber-darken-1"></v-icon>
                {{ t('stateOfWar.warProgression') }}
              </div>
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </v-row>

      <EmptyView v-else></EmptyView>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.state-of-war-page {
  min-height: 80vh;
}

.war-status-faction-number,
.war-light-rays {
  position: relative;
  z-index: -1;
}
</style>
