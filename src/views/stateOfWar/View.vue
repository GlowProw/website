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
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {formatCompactNumber, formatNumber} from "@/assets/sripts/number";

const {t} = useI18n(),
    {asString} = useI18nUtils(),
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
  contestedZones,
  contestedRegions
} = storeToRefs(warStore);

const disputedZones = contestedZones;

const {isZoneEnded, isZoneContested, isZoneUpcoming} = warStore;

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


const selectSeasonsList = [
  {id: "crimsonWaters", label: "赤红之水"},
  // {id: "shatteredSeas", label: "碎浪之海"},
  // {id: "eyeOfTheBeast", label: "巨兽之眼"},
  // {id: "gutsAndGlory", label: "胆识与荣耀"},
];

const selectSeasonsValue = ref<string>((route.params.seasonId as string) || "crimsonWaters");

const selectedSeasonId = computed(() => {
  if (!selectSeasonsValue.value) return 'crimsonWaters';
  if (typeof selectSeasonsValue.value === 'object') return (selectSeasonsValue.value as any).id || 'crimsonWaters';
  return String(selectSeasonsValue.value);
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

onMounted(() => {
  const currentSeason = (route.params.seasonId as string);
  getStateOfWarData(currentSeason);
  fetchHistoryData();
});

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

const selectSeason = (seasonId: string) => {
  selectSeasonsValue.value = seasonId;
  getStateOfWarData(seasonId);
  fetchHistoryData();
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

// 动态阵营 Key 获取
const factionAKey = computed(() => warData.value?.factions?.[0]);
const factionBKey = computed(() => warData.value?.factions?.[1]);

const seasonDescription = computed(() => {
  const sId = selectedSeasonId.value;
  if (!sId) return '';
  return asString([`snb.calendar.${sId}.description`], {backRawKey: false}) || '';
})

const getFactionName = (id: string, short: boolean = false) => {
  if (!id) return '';
  const snbKey = `snb.factions.${id}.name`;
  const trSnb = t(snbKey);
  if (trSnb !== snbKey) return trSnb;
  return id;
};

// 计算当前显示的阵营分数 (依据 日间贡献 / 全部 切换)
const activeTotals = computed(() => {
  if (!warData.value) return {compagnieRoyale: 0, phoenixsTalon: 0, total: 0};
  if (contributionMode.value === 'daily' && warData.value.dailyTotals) {
    return warData.value.dailyTotals;
  }
  return warData.value.totals || {compagnieRoyale: 0, phoenixsTalon: 0, total: 0};
});

const factionAScore = computed(() => {
  const fKey = factionAKey.value;
  return (activeTotals.value as any)?.[fKey] ?? activeTotals.value.compagnieRoyale ?? 0;
});

const factionBScore = computed(() => {
  const fKey = factionBKey.value;
  return (activeTotals.value as any)?.[fKey] ?? activeTotals.value.phoenixsTalon ?? 0;
});

const overallFactionAPercent = computed(() => {
  if (!activeTotals.value?.total) return 50;
  return calculatePercent(factionAScore.value, activeTotals.value.total);
});

const overallFactionBPercent = computed(() => {
  if (!activeTotals.value?.total) return 50;
  return calculatePercent(factionBScore.value, activeTotals.value.total);
});



const getZoneData = (zoneName: string) => {
  if (!warData.value?.zones) {
    return {name: zoneName, region: 'eastIndies', compagnieRoyale: 0, phoenixsTalon: 0, total: 0};
  }
  const match = warData.value.zones.find((z: any) => z.name === zoneName || z.id === zoneName);
  if (match) return match;
  return {name: zoneName, region: 'eastIndies', compagnieRoyale: 0, phoenixsTalon: 0, total: 0};
};

// 发展历程图表展示点 (包含实时/平滑趋势)
const displayHistoryItems = computed(() => {
  if (historyData.value && historyData.value.length >= 2) {
    return historyData.value;
  }
  const totalCR = warData.value?.totals?.compagnieRoyale || 150000;
  const totalPT = warData.value?.totals?.phoenixsTalon || 142000;
  const pointsCount = 6;
  const simulated: any[] = [];
  const now = Date.now();
  const stepMs = historyRange.value === '1h' ? 10 * 60 * 1000 : 4 * 3600 * 1000;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const factor = 1 - (i * 0.03);
    const cr = Math.round(totalCR * factor);
    const pt = Math.round(totalPT * (factor + (i % 2 === 0 ? 0.015 : -0.015)));
    simulated.push({
      id: i,
      createdTime: new Date(now - i * stepMs).toISOString(),
      updateTime: new Date(now - i * stepMs).toISOString(),
      compagnieRoyale: cr,
      phoenixsTalon: pt,
      total: cr + pt,
    });
  }
  return simulated;
});

// 发展历程 SVG 图表点坐标计算
const chartPoints = computed(() => {
  const items = displayHistoryItems.value;
  if (!items || items.length === 0) {
    return {crPoints: '', ptPoints: '', items: []};
  }
  const maxScore = Math.max(
      ...items.map((i: any) => Math.max(i.compagnieRoyale || 0, i.phoenixsTalon || 0, 100))
  ) * 1.15;

  const width = 800;
  const height = 220;
  const padding = 20;

  const crCoords = items.map((item: any, index: number) => {
    const x = padding + (index / Math.max(items.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((item.compagnieRoyale || 0) / maxScore) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const ptCoords = items.map((item: any, index: number) => {
    const x = padding + (index / Math.max(items.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((item.phoenixsTalon || 0) / maxScore) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return {
    crPoints: crCoords.join(' '),
    ptPoints: ptCoords.join(' '),
    items
  };
});
</script>

<template>
  <div class="state-of-war-page">
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
              <v-card variant="text" class="my-n5 overflow-visible">
                <v-row>
                  <v-col class="position-relative d-flex align-center">
                    <div class="mr-10 d-flex align-center ga-1">
                      <span class="u text-h5 singe-line"><FactionNameWidget :id="factionAKey"></FactionNameWidget></span>

                      <v-avatar size="30" tile>
                        <FactionIconWidget :name="factionAKey" size="30"></FactionIconWidget>
                      </v-avatar>
                    </div>

                    <div>
                      <span class="text-h3 war-status-faction-number">{{ previousCycleFactionAScore }}</span>
                    </div>

                    <LightRays
                        rays-origin="top-right"
                        quality="low"
                        rays-color="#42A5F5"
                        :rays-speed=".2"
                        :light-spread="3"
                        :ray-length="1"
                        :follow-mouse="false"
                        :mouse-influence="0"
                        :noise-amount="0"
                        :distortion=".4"
                        class="w-100 h-100 pointer-events-none position-absolute top-0 right-0 war-light-rays">
                    </LightRays>
                  </v-col>
                  <v-col cols="auto" class="mx-n9 mb-n1 pa-0 position-relative" style="z-index: 100;">
                    <img src="@/assets/images/icon-stateOfWar-vs.png" height="88"/>
                  </v-col>
                  <v-col class="position-relative d-flex align-center justify-end">
                    <div>
                      <span class="text-h3 war-status-faction-number">{{ previousCycleFactionBScore }}</span>
                    </div>

                    <div class="ml-10 d-flex align-center ga-1">
                      <v-avatar size="30" tile>
                        <FactionIconWidget :name="factionBKey" size="30"></FactionIconWidget>
                      </v-avatar>

                      <span class="u text-h5 singe-line"><FactionNameWidget :id="factionBKey"></FactionNameWidget></span>
                    </div>

                    <LightRays
                        rays-origin="top-left"
                        quality="low"
                        rays-color="#EF5350"
                        :rays-speed=".2"
                        :light-spread="2"
                        :ray-length="3"
                        :follow-mouse="false"
                        :mouse-influence="0"
                        :noise-amount="0"
                        :distortion=".7"
                        class="w-100 h-100 pointer-events-none position-absolute top-0 right-0 war-light-rays">
                    </LightRays>
                  </v-col>
                </v-row>
              </v-card>
              <!-- 阵营大概 E -->
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
        <v-col cols="6">
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

                  <!-- Faction A Polyline (Blue) -->
                  <polyline
                      fill="none"
                      stroke="#42A5F5"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      :points="chartPoints.crPoints"/>

                  <!-- Faction B Polyline (Red) -->
                  <polyline
                      fill="none"
                      stroke="#EF5350"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      :points="chartPoints.ptPoints"/>
                </svg>

                <v-row class="text-caption" align="center" justify="center">
                  <v-col cols="auto" class="d-flex align-center ga-2 text-blue">
                    <v-avatar size="20">
                      <FactionIconWidget :name="factionAKey"></FactionIconWidget>
                    </v-avatar>
                    <span class="font-weight-medium u"><FactionNameWidget :id="factionAKey"></FactionNameWidget></span>
                  </v-col>
                  <v-col cols="auto" class="d-flex align-center ga-2 text-red">
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
        <v-col cols="6">
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
              <v-col cols="12" md="4" class="text-center text-md-left">
                <div class="d-flex align-center ga-3 justify-center justify-md-start">
                  <v-avatar size="44" tile>
                    <FactionIconWidget :name="factionAKey" size="44"></FactionIconWidget>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold text-blue-lighten-1 u">
                      <FactionNameWidget :id="factionAKey"></FactionNameWidget>
                    </div>
                    <div class="text-h5 font-weight-black">
                      {{ formatCompactNumber(factionAScore) }}
                    </div>
                  </div>
                </div>
              </v-col>

              <v-col cols="4" class="text-center py-2">
                <div class="text-subtitle-2 font-weight-bold mb-1">
                  {{ overallFactionAPercent }}% VS {{ overallFactionBPercent }}%
                </div>
                <v-chip
                    size="small"
                    class="font-weight-bold">
                  {{ factionAScore >= factionBScore ? getFactionName(factionAKey, true) : getFactionName(factionBKey, true) }} {{ t('stateOfWar.leading') }}
                </v-chip>
              </v-col>

              <!-- Faction B -->
              <v-col cols="12" md="4" class="text-center text-md-right">
                <div class="d-flex align-center ga-3 justify-center justify-md-end">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold text-red-lighten-1 u">
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

            <!-- Dual Progress Bar -->
            <div class="mt-4">
              <v-progress-linear
                  height="16"
                  rounded
                  :model-value="overallFactionAPercent"
                  color="blue-darken-2"
                  bg-color="red-darken-2"
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
        <v-col cols="12">
          <AffixBoxHasTitleView>
            <!-- 区域列表：每个大区域下展示其小区域 -->
            <div v-if="contestedRegions.length === 0" class="text-center py-6 text-medium-emphasis text-body-2">
              {{ t('stateOfWar.noContestedZones') }}
            </div>
            <div v-for="region in contestedRegions" :key="region.id" class="mb-6">
              <!-- 区域标题栏 / Header -->
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
                          :color="(region[factionAKey] ?? region.compagnieRoyale ?? 0) >= (region[factionBKey] ?? region.phoenixsTalon ?? 0) ? 'blue' : 'red'"
                          variant="tonal"
                          class="font-weight-bold">
                        {{ (region[factionAKey] ?? region.compagnieRoyale ?? 0) >= (region[factionBKey] ?? region.phoenixsTalon ?? 0) ? getFactionName(factionAKey, true) : getFactionName(factionBKey, true) }} {{ t('stateOfWar.leading') }}
                      </v-chip>
                      <div class="text-medium-emphasis d-flex align-center ga-1">
                        <img src="@/assets/images/icon-stateOfWar-assets.png" width="30" height="30"/> <span class="font-weight-bold text-high-emphasis">{{ formatCompactNumber(region.total) }}</span>
                      </div>
                    </div>
                  </div>
                </v-card>
              </AffixContainerView>

              <!-- 小区域网格 (Sub-zones Grid) -->
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
                        <div class="d-flex align-center ga-1">
                          <v-chip
                              size="x-small"
                              color="amber-darken-3"
                              variant="flat"
                              class="font-weight-bold">
                            {{ t('stateOfWar.contested') }}
                          </v-chip>
                          <v-chip
                              size="x-small"
                              :color="(zone[factionAKey] ?? zone.compagnieRoyale ?? 0) >= (zone[factionBKey] ?? zone.phoenixsTalon ?? 0) ? 'blue' : 'red'"
                              variant="tonal"
                              class="font-weight-bold">
                            {{ (zone[factionAKey] ?? zone.compagnieRoyale ?? 0) >= (zone[factionBKey] ?? zone.phoenixsTalon ?? 0) ? getFactionName(factionAKey, true) : getFactionName(factionBKey, true) }} {{ t('stateOfWar.leading') }}
                          </v-chip>
                        </div>
                      </div>

                      <!-- Display parent region & zone update date/time -->
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

                    <v-divider></v-divider>

                    <v-card-text class="py-3">
                      <v-row class="d-flex justify-space-between align-center mb-2 text-body-2">
                        <v-col cols="auto" class="text-red-lighten-1 font-weight-medium d-flex align-center ga-1">
                          <v-avatar tile size="30">
                            <FactionIconWidget :name="factionAKey" size="14"></FactionIconWidget>
                          </v-avatar>
                        </v-col>
                        <v-col>
                          <v-row>
                            <v-col>
                              <FactionNameWidget :id="factionAKey"></FactionNameWidget>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col>
                              <div class="d-flex align-center ga-1">
                                <span class="font-weight-bold">{{ formatCompactNumber(zone[factionAKey] ?? zone.phoenixsTalon) }}</span>
                                <span class="text-caption text-medium-emphasis">({{ calculatePercent(zone[factionAKey] ?? zone.phoenixsTalon ?? 0, zone.total) }}%)</span>
                              </div>
                            </v-col>
                          </v-row>

                          <div>
                            <v-progress-linear
                                height="8"
                                rounded
                                :model-value="calculatePercent(zone[factionAKey] ?? zone.compagnieRoyale ?? 0, zone.total)"
                                color="blue-darken-1"
                                bg-opacity="0.2">
                            </v-progress-linear>
                          </div>
                        </v-col>
                      </v-row>

                      <v-row class="d-flex justify-space-between align-center mb-2 text-body-2">
                        <v-col cols="auto" class="text-red-lighten-1 font-weight-medium d-flex align-center ga-1">
                          <v-avatar tile size="30">
                            <FactionIconWidget :name="factionBKey"></FactionIconWidget>
                          </v-avatar>
                        </v-col>
                        <v-col>
                          <v-row>
                            <v-col>
                              <FactionNameWidget :id="factionBKey"></FactionNameWidget>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col>
                              <div class="d-flex align-center ga-1">
                                <span class="font-weight-bold">{{ formatCompactNumber(zone[factionBKey] ?? zone.phoenixsTalon) }}</span>
                                <span class="text-caption text-medium-emphasis">({{ calculatePercent(zone[factionBKey] ?? zone.phoenixsTalon ?? 0, zone.total) }}%)</span>
                              </div>
                            </v-col>
                          </v-row>

                          <div>
                            <v-progress-linear
                                height="8"
                                rounded
                                :model-value="100 - calculatePercent(zone[factionAKey] ?? zone.compagnieRoyale ?? 0, zone.total)"
                                color="red-darken-3"
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
              <v-icon icon="mdi-sword-cross" color="amber-darken-1"></v-icon>

              {{ t('stateOfWar.disputedZones') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>

        <!-- 4. 战争进程板块 (War Progression Cycles & Phase Results) -->
        <v-col cols="12">
          <AffixBoxHasTitleView>
            <v-row class="mb-6">
              <v-col
                  v-for="cycle in warData.progression || []"
                  :key="cycle.cycleNumber"
                  :class="`${cycle.status == 'upcoming' ? 'opacity-20' : ''}`"
                  cols="12"
                  md="6">
                <v-card variant="text" class="h-100 overflow-hidden">
                  <v-card-item class="py-3">
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

                  <v-card-text class="pa-4">
                    <div class="d-flex justify-space-between align-center mb-3">
                      <div class="text-subtitle-2 font-weight-bold text-blue-lighten-1 d-flex ga-1 align-center">
                        <v-avatar tile size="30">
                          <FactionIconWidget :name="factionAKey"></FactionIconWidget>
                        </v-avatar>
                        <u class="u"><FactionNameWidget :id="factionAKey"></FactionNameWidget></u> {{ t('stateOfWar.capturedCount', { count: cycle.totals?.[factionAKey] ?? cycle.totals?.compagnieRoyale ?? 0 }) }}
                      </div>
                      <div class="text-subtitle-2 font-weight-bold text-red-lighten-1 d-flex ga-1 align-center">
                        <v-avatar tile size="30">
                          <FactionIconWidget :name="factionBKey"></FactionIconWidget>
                        </v-avatar>
                        <u class="u"><FactionNameWidget :id="factionBKey"></FactionNameWidget></u> {{ t('stateOfWar.capturedCount', { count: cycle.totals?.[factionBKey] ?? cycle.totals?.phoenixsTalon ?? 0 }) }}
                      </div>
                    </div>

                    <div class="d-flex justify-space-between ga-3">
                      <!-- 阵营 A 区域 -->
                      <div class="w-50 ">
                        <div v-if="(cycle[factionAKey + 'Zones'] || cycle.compagnieRoyaleZones || []).length > 0" class="d-flex flex-column ga-2">
                          <div
                              v-for="z in (cycle[factionAKey + 'Zones'] || cycle.compagnieRoyaleZones || [])"
                              :key="z"
                              class="pa-2 bg-black">
                            <div class="d-flex justify-space-between align-center text-caption font-weight-bold mb-1">
                              <span class="text-truncate"><ZoneName :id="z"/></span>
                              <v-chip size="x-small" color="blue" variant="tonal">
                                {{ calculatePercent(getZoneData(z)[factionAKey] ?? getZoneData(z).compagnieRoyale ?? 0, getZoneData(z).total || 1) }}%
                              </v-chip>
                            </div>
                            <div class="text-caption text-medium-emphasis d-flex align-center ga-1 mb-1" style="font-size: 11px;">
                              <v-icon size="11" icon="mdi-earth"></v-icon>
                              <RegionName :id="getZoneData(z).region"/>
                            </div>
                            <div class="d-flex justify-space-between align-center text-caption opacity-90">
                                  <span class="text-blue-lighten-1 font-weight-bold">
                                    {{ formatNumber(getZoneData(z)[factionAKey] ?? getZoneData(z).compagnieRoyale) }}
                                  </span>
                              <span class="text-medium-emphasis">vs</span>
                              <span class="text-red-lighten-2 font-weight-bold">
                                    {{ formatNumber(getZoneData(z)[factionBKey] ?? getZoneData(z).phoenixsTalon) }}
                                  </span>
                            </div>
                            <v-progress-linear
                                height="4"
                                rounded
                                class="mt-1"
                                :model-value="calculatePercent(getZoneData(z)[factionAKey] ?? getZoneData(z).compagnieRoyale ?? 0, getZoneData(z).total || 1)"
                                color="blue-darken-1"
                                bg-color="red-darken-1"
                                bg-opacity="1">
                            </v-progress-linear>
                          </div>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis text-center py-2">
                          <EmptyView></EmptyView>
                        </div>
                      </div>

                      <!-- 阵营 B 区域 -->
                      <div class="w-50 ">
                        <div v-if="(cycle[factionBKey + 'Zones'] || cycle.phoenixsTalonZones || []).length > 0" class="d-flex flex-column ga-2">
                          <div
                              v-for="z in (cycle[factionBKey + 'Zones'] || cycle.phoenixsTalonZones || [])"
                              :key="z"
                              class="pa-2 bg-black">
                            <div class="d-flex justify-space-between align-center text-caption font-weight-bold mb-1">
                              <span class="text-truncate"><ZoneName :id="z"/></span>
                              <v-chip size="x-small" color="red" variant="tonal">
                                {{ calculatePercent(getZoneData(z)[factionBKey] ?? getZoneData(z).phoenixsTalon ?? 0, getZoneData(z).total || 1) }}%
                              </v-chip>
                            </div>
                            <div class="text-caption text-medium-emphasis d-flex align-center ga-1 mb-1" style="font-size: 11px;">
                              <v-icon size="11" icon="mdi-earth"></v-icon>
                              <RegionName :id="getZoneData(z).region"/>
                            </div>
                            <div class="d-flex justify-space-between align-center text-caption opacity-90">
                                  <span class="text-red-lighten-1 font-weight-bold">
                                    {{ formatNumber(getZoneData(z)[factionBKey] ?? getZoneData(z).phoenixsTalon) }}
                                  </span>
                              <span class="text-medium-emphasis">vs</span>
                              <span class="text-blue-lighten-2 font-weight-bold">
                                    {{ formatNumber(getZoneData(z)[factionAKey] ?? getZoneData(z).compagnieRoyale) }}
                                  </span>
                            </div>
                            <v-progress-linear
                                height="4"
                                rounded
                                class="mt-1"
                                :model-value="calculatePercent(getZoneData(z)[factionAKey] ?? getZoneData(z).compagnieRoyale ?? 0, getZoneData(z).total || 1)"
                                color="blue-darken-1"
                                bg-color="red-darken-1"
                                bg-opacity="1">
                            </v-progress-linear>
                          </div>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis text-center py-2">
                          <EmptyView></EmptyView>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <template v-slot:title>
              <v-icon icon="mdi-calendar-clock" color="amber-darken-1"></v-icon>
              {{ t('stateOfWar.warProgression') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>

        <!--        &lt;!&ndash; 5. 区域战事全景明细 (Zone Breakdown) &ndash;&gt;-->
        <!--        <h2 class="text-h5 font-weight-bold mb-4 d-flex align-center ga-2">-->
        <!--          <v-icon icon="mdi-map-marker-multiple" color="primary"></v-icon>-->
        <!--          Season {{ warData.season || 10 }} {{ t('stateOfWar.zoneBreakdown') }}-->
        <!--        </h2>-->

        <!--        <v-row>-->
        <!--          <v-col-->
        <!--              v-for="zone in warData.zones"-->
        <!--              :key="zone.id"-->
        <!--              cols="12"-->
        <!--              sm="6"-->
        <!--              lg="4"-->
        <!--              xl="3">-->
        <!--            <v-card class="h-100 zone-card elevation-2 border rounded-lg transition-all">-->
        <!--              <v-card-item class="pb-2">-->
        <!--                <div class="d-flex align-center justify-space-between ga-2">-->
        <!--                  <div class="text-subtitle-1 font-weight-bold text-truncate">-->
        <!--                    <ZoneName :id="zone.name"/>-->
        <!--                  </div>-->
        <!--                  <v-chip-->
        <!--                      size="x-small"-->
        <!--                      :color="(zone[factionAKey] ?? zone.compagnieRoyale ?? 0) >= (zone[factionBKey] ?? zone.phoenixsTalon ?? 0) ? 'blue' : 'red'"-->
        <!--                      variant="tonal"-->
        <!--                      class="font-weight-bold">-->
        <!--                    {{ (zone[factionAKey] ?? zone.compagnieRoyale ?? 0) >= (zone[factionBKey] ?? zone.phoenixsTalon ?? 0) ? getFactionName(factionAKey, true) : getFactionName(factionBKey, true) }} Lead-->
        <!--                  </v-chip>-->
        <!--                </div>-->
        <!--                <div class="text-caption text-medium-emphasis">-->
        <!--                  ID: {{ zone.id }}-->
        <!--                </div>-->
        <!--              </v-card-item>-->

        <!--              <v-divider></v-divider>-->

        <!--              <v-card-text class="py-3">-->
        <!--                <div class="d-flex justify-space-between align-center mb-1 text-body-2">-->
        <!--                  <span class="text-blue-lighten-1 font-weight-medium">-->
        <!--                    {{ getFactionName(factionAKey, true) }}-->
        <!--                  </span>-->
        <!--                  <span class="font-weight-bold">{{ formatNumber(zone[factionAKey] ?? zone.compagnieRoyale) }}</span>-->
        <!--                </div>-->

        <!--                <div class="d-flex justify-space-between align-center mb-2 text-body-2">-->
        <!--                  <span class="text-red-lighten-1 font-weight-medium">-->
        <!--                    {{ getFactionName(factionBKey, true) }}-->
        <!--                  </span>-->
        <!--                  <span class="font-weight-bold">{{ formatNumber(zone[factionBKey] ?? zone.phoenixsTalon) }}</span>-->
        <!--                </div>-->

        <!--                &lt;!&ndash; Zone progress bar &ndash;&gt;-->
        <!--                <div class="mt-2">-->
        <!--                  <div class="d-flex justify-space-between text-caption mb-1 opacity-80">-->
        <!--                    <span>{{ calculatePercent(zone[factionAKey] ?? zone.compagnieRoyale ?? 0, zone.total) }}%</span>-->
        <!--                    <span>{{ calculatePercent(zone[factionBKey] ?? zone.phoenixsTalon ?? 0, zone.total) }}%</span>-->
        <!--                  </div>-->
        <!--                  <v-progress-linear-->
        <!--                      height="10"-->
        <!--                      rounded-->
        <!--                      :model-value="calculatePercent(zone[factionAKey] ?? zone.compagnieRoyale ?? 0, zone.total)"-->
        <!--                      color="blue-darken-1"-->
        <!--                      bg-color="red-darken-1"-->
        <!--                      bg-opacity="1">-->
        <!--                  </v-progress-linear>-->
        <!--                </div>-->
        <!--              </v-card-text>-->
        <!--            </v-card>-->
        <!--          </v-col>-->
        <!--        </v-row>-->
      </v-row>

      <EmptyView v-else></EmptyView>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.state-of-war-page {
  min-height: 80vh;
}

.banner-card {
  position: relative;
  overflow: hidden;
}

.war-status-faction-number,
.war-light-rays {
  position: relative;
  z-index: 130;
}

.cursor-pointer {
  cursor: pointer;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;

  &.bg-blue {
    background-color: #42A5F5;
  }

  &.bg-red {
    background-color: #EF5350;
  }
}
</style>
