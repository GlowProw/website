<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {type Season, Seasons} from "glow-prow-data";
import {apis} from "@/assets/sripts";
import {getCurrentSeason, getCurrentSeasonId} from "@/assets/sripts/season";
import {useStateOfWarStore} from "~/stores/stateOfWarStore";
import type {CalendarData, CalendarEvent} from "@/assets/types/Calendar";

import {formatCompactNumber} from "@/assets/sripts/number";

// 复用已有小部件与组件
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import FactionNameWidget from "@/components/snbWidget/factionNameWidget.vue";
import ZoneName from "@/components/snbWidget/zoneName.vue";
import RegionName from "@/components/snbWidget/regionName.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import Loading from "@/components/Loading.vue";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import DropWidget from "@/components/DropWidget.vue";

export interface DailyCalendarEventItem {
  id: string;
  name: string;
  description: string;
  duration: number;
  droppeds?: Record<string, { category?: string; isUnknown?: boolean }>;
  startMs: number;
  endMs: number;
  startDateStr: string;
  endDateStr: string;
  isOngoing: boolean;
  isUpcoming: boolean;
  daysRemainingOrUntil: number;
}

const props = withDefaults(
    defineProps<{
      seasonId?: string;
      isWidget?: boolean;
      showCalendarLink?: boolean;
      showWarLink?: boolean;
      showDrop?: boolean;
    }>(),
    {
      isWidget: false,
      showCalendarLink: true,
      showWarLink: true,
      showDrop: true,
    }
);

const {t, te} = useI18n();
const router = useRouter();
const warStore = useStateOfWarStore();

const {
  warData,
  loading: warLoading,
  factionAColor,
  factionBColor,
  previousCycleFactionAScore,
  previousCycleFactionBScore,
  contestedZones,
} = storeToRefs(warStore);

// 数据加载状态
const calendarLoading = ref<boolean>(false);
const rawCalendarData = ref<CalendarData | null>(null);

// 目标赛季 ID
const targetSeasonId = computed<string>(() => {
  return props.seasonId || getCurrentSeasonId();
});

// 赛季实体对象
const currentSeason = computed<Season | null>(() => {
  const sId = targetSeasonId.value;
  if (sId && Seasons && (Seasons as Record<string, Season>)[sId]) {
    return (Seasons as Record<string, Season>)[sId];
  }
  return getCurrentSeason(true);
});

// 赛季名称国际化
const seasonName = computed<string>(() => {
  if (!currentSeason.value) return t("dailyReport.season.title");
  const i18nKey = `snb.seasons.${currentSeason.value.id}`;
  if (te(i18nKey)) {
    return t(i18nKey);
  }
  return String(currentSeason.value.alternativeName || currentSeason.value.id);
});

// 格式化日期字符串 YYYY-MM-DD
const formatDate = (d: any): string => {
  if (!d) return "--";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d).split("T")[0];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// 赛季日期范围与剩余天数
const seasonDateRange = computed<string>(() => {
  if (!currentSeason.value?.startDate || !currentSeason.value?.endDate) return "";
  return `${formatDate(currentSeason.value.startDate)} ~ ${formatDate(currentSeason.value.endDate)}`;
});

const seasonDaysRemaining = computed<number>(() => {
  if (!currentSeason.value?.endDate) return 0;
  const end = new Date(currentSeason.value.endDate).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
});

const isSeasonEnded = computed<boolean>(() => {
  if (!currentSeason.value?.endDate) return false;
  return Date.now() >= new Date(currentSeason.value.endDate).getTime();
});

const seasonProgressPercent = computed<number>(() => {
  if (!currentSeason.value?.startDate || !currentSeason.value?.endDate) return 100;
  const start = new Date(currentSeason.value.startDate).getTime();
  const end = new Date(currentSeason.value.endDate).getTime();
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = Date.now() - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
});

// 动态阵营 Key
const factionAKey = computed<string>(() => warStore.factionAKey || "compagnieRoyale");
const factionBKey = computed<string>(() => warStore.factionBKey || "phoenixsTalon");

// 比分统计与比例
const scoreFactionA = computed<number>(() => previousCycleFactionAScore.value || 0);
const scoreFactionB = computed<number>(() => previousCycleFactionBScore.value || 0);
const totalFactionScore = computed<number>(() => scoreFactionA.value + scoreFactionB.value || 1);
const percentFactionA = computed<number>(() => {
  return Math.round((scoreFactionA.value / totalFactionScore.value) * 100);
});
const percentFactionB = computed<number>(() => 100 - percentFactionA.value);

// 计算战资比例
const calculatePercent = (val: number, total: number) => {
  if (!total || total === 0) return 50;
  return Math.round((val / total) * 1000) / 10;
};

// 获取具体区域数据 (对应 stateOfWar/View.vue 中的 getZoneData)
const getZoneData = (zoneName: string) => {
  if (!warData.value?.zones) {
    return { name: zoneName, region: '', total: 0 };
  }
  const match = warData.value.zones.find((z: any) => z.name === zoneName || z.id === zoneName);
  if (match) return match;
  return { name: zoneName, region: '', total: 0 };
};

// 战争进程当前战期信息
const activeCycle = computed<any>(() => {
  const list = warData.value?.progression || [];
  if (list.length === 0) return null;
  // 优先寻找 active
  const active = list.find((c: any) => c.status === "active");
  if (active) return active;
  // 若无 active 则找最后一个 ended 或第一个 upcoming
  const ended = [...list].reverse().find((c: any) => c.status === "ended");
  if (ended) return ended;
  return list[0];
});

// 格式化战期时间
const formatCycleDate = (d: any): string => {
  if (!d) return "--";
  if (typeof d === "number" || (typeof d === "string" && /^\d+$/.test(d))) {
    const date = new Date(Number(d));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  return String(d).split("T")[0];
};

const activeCycleTimeRange = computed<string>(() => {
  if (!activeCycle.value?.startDate || !activeCycle.value?.endDate) return "";
  return `${formatCycleDate(activeCycle.value.startDate)} ~ ${formatCycleDate(activeCycle.value.endDate)}`;
});

// 战期倒计时
const activeCycleRemainingText = computed<string>(() => {
  if (!activeCycle.value) return "";
  if (activeCycle.value.status === "ended") {
    return t("dailyReport.stateOfWar.cycleEnded");
  }
  if (activeCycle.value.status === "upcoming") {
    return t("dailyReport.stateOfWar.cycleUpcoming");
  }
  const now = Date.now();
  const end = Number(activeCycle.value.endDate) || new Date(activeCycle.value.endDate).getTime();
  const diff = end - now;
  if (diff <= 0) return t("dailyReport.stateOfWar.cycleEnded");

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
});

// 战期内当前时间进度
const activeCycleProgress = computed<number>(() => {
  if (!activeCycle.value?.startDate || !activeCycle.value?.endDate) return 100;
  if (activeCycle.value.status === "ended") return 100;
  if (activeCycle.value.status === "upcoming") return 0;
  const s = Number(activeCycle.value.startDate) || new Date(activeCycle.value.startDate).getTime();
  const e = Number(activeCycle.value.endDate) || new Date(activeCycle.value.endDate).getTime();
  const total = e - s;
  if (total <= 0) return 100;
  const elapsed = Date.now() - s;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
});

// 当前战期/争夺中战区列表 (完全对应 /stateOfWar/:seasonId/view 的战争进程与争夺中战区)
const activeCycleZones = computed<any[]>(() => {
  const fA = factionAKey.value;
  const fB = factionBKey.value;

  // 1. 若当前战期存在，优先提取当前战期中的战区名单
  if (activeCycle.value) {
    const aZoneNames = activeCycle.value[fA + "Zones"] || [];
    const bZoneNames = activeCycle.value[fB + "Zones"] || [];
    const allNames = Array.from(new Set([...aZoneNames, ...bZoneNames]));

    if (allNames.length > 0) {
      return allNames.map((zName: string) => {
        const zoneObj = getZoneData(zName);
        const valA = zoneObj[fA] || 0;
        const valB = zoneObj[fB] || 0;
        const total = zoneObj.total || (valA + valB) || 1;
        const percentA = calculatePercent(valA, total);
        const percentB = calculatePercent(valB, total);
        const isTied = valA === valB;
        const leadingFaction = isTied ? 'tied' : (valA > valB ? fA : fB);

        return {
          id: zoneObj.id || zName,
          name: zoneObj.name || zName,
          region: zoneObj.region || '',
          total,
          [fA]: valA,
          [fB]: valB,
          percentA,
          percentB,
          isTied,
          leadingFaction,
        };
      });
    }
  }

  // 2. 否则从 contestedZones (争夺中战区) 中提取
  return (contestedZones.value || []).map((z: any) => {
    const valA = z[fA] || 0;
    const valB = z[fB] || 0;
    const total = z.total || (valA + valB) || 1;
    const percentA = calculatePercent(valA, total);
    const percentB = calculatePercent(valB, total);
    const isTied = valA === valB;
    const leadingFaction = isTied ? 'tied' : (valA > valB ? fA : fB);

    return {
      id: z.id || z.name,
      name: z.name,
      region: z.region || '',
      total,
      [fA]: valA,
      [fB]: valB,
      percentA,
      percentB,
      isTied,
      leadingFaction,
    };
  });
});

// ======================== 日历活动解析 ========================
const getEventName = (eventId: string): string => {
  const sId = targetSeasonId.value;
  const i18nKey = `snb.calendar.${sId}.data.${eventId}.name`;
  if (te(i18nKey)) {
    return t(i18nKey);
  }
  return eventId;
};

const getEventDescription = (eventId: string): string => {
  const sId = targetSeasonId.value;
  const i18nKey = `snb.calendar.${sId}.data.${eventId}.description`;
  if (te(i18nKey)) {
    return t(i18nKey);
  }
  return "";
};

// 提取当前进行中和近期即将开始的活动
const parsedCalendarEvents = computed<DailyCalendarEventItem[]>(() => {
  if (!rawCalendarData.value?.events) return [];
  const eventsDict = rawCalendarData.value.events;
  const now = Date.now();
  const seasonStartYear = currentSeason.value?.startDate
      ? new Date(currentSeason.value.startDate).getFullYear()
      : new Date().getFullYear();

  const list: DailyCalendarEventItem[] = [];

  Object.values(eventsDict).forEach((event: CalendarEvent) => {
    if (!event || !event.occurrences) return;

    (event.occurrences || []).forEach((occ: any) => {
      const year = occ.year || seasonStartYear;
      const start = new Date(year, occ.month - 1, occ.day, 0, 0, 0).getTime();
      const duration = event.duration || 1;
      const end = start + duration * 86400000 - 1;

      const isOngoing = now >= start && now <= end;
      const isUpcoming = now < start;

      // 仅纳入进行中或未来 30 天内将开启的活动
      if (isOngoing || (isUpcoming && start - now <= 30 * 86400000)) {
        const daysRemainingOrUntil = isOngoing
            ? Math.max(1, Math.ceil((end - now) / 86400000))
            : Math.max(1, Math.ceil((start - now) / 86400000));

        list.push({
          id: event.id,
          name: getEventName(event.id),
          description: getEventDescription(event.id),
          duration,
          droppeds: (event as any).droppeds,
          startMs: start,
          endMs: end,
          startDateStr: `${String(occ.month).padStart(2, "0")}-${String(occ.day).padStart(2, "0")}`,
          endDateStr: formatCycleDate(end),
          isOngoing,
          isUpcoming,
          daysRemainingOrUntil,
        });
      }
    });
  });

  // 排序：进行中的优先置顶（按剩余时间），未开启的按开启时间排序
  return list.sort((a, b) => {
    if (a.isOngoing && !b.isOngoing) return -1;
    if (!a.isOngoing && b.isOngoing) return 1;
    if (a.isOngoing && b.isOngoing) {
      return a.endMs - b.endMs;
    }
    return a.startMs - b.startMs;
  });
});

// 进行中活动与即将开启活动列表
const ongoingEvents = computed<DailyCalendarEventItem[]>(() => {
  return parsedCalendarEvents.value.filter((e) => e.isOngoing);
});

const upcomingEvents = computed<DailyCalendarEventItem[]>(() => {
  return parsedCalendarEvents.value.filter((e) => e.isUpcoming).slice(0, 3);
});

// 获取日历数据
const fetchCalendarData = async () => {
  try {
    calendarLoading.value = true;
    const res = await apis.calendarApi().get(targetSeasonId.value);
    if (res?.data?.data) {
      rawCalendarData.value = res.data.data;
    } else {
      rawCalendarData.value = null;
    }
  } catch (err) {
    console.error("Failed to load calendar events for daily report:", err);
    rawCalendarData.value = null;
  } finally {
    calendarLoading.value = false;
  }
};

// ======================== 掉宝活动数据 ========================
const dropLoading = ref<boolean>(false);
const activeCampaigns = ref<any[]>([]);

const fetchDropData = async () => {
  if (!props.showDrop) return;
  try {
    dropLoading.value = true;
    const res = await apis.dropApi().getCurrent();
    const payload = res?.data?.data || res?.data || res;
    if (payload) {
      const activeStreams = payload.activeStreams || [];
      const rawCampaigns = payload.campaigns || [];
      activeCampaigns.value = rawCampaigns.map((c: any) => ({
        ...c,
        channels: (c.channels && c.channels.length > 0) ? c.channels : activeStreams,
      }));
    } else {
      activeCampaigns.value = [];
    }
  } catch (err) {
    console.error("Failed to load active drops for daily report:", err);
    activeCampaigns.value = [];
  } finally {
    dropLoading.value = false;
  }
};

// 刷新全部数据
const refreshAll = async () => {
  await Promise.allSettled([
    warStore.getStateOfWarData(targetSeasonId.value),
    fetchCalendarData(),
    fetchDropData(),
  ]);
};

// 路由跳转辅助
const navigateToCalendar = () => {
  router.push(`/calendar/${targetSeasonId.value}`);
};

const navigateToStateOfWar = () => {
  router.push(`/stateOfWar/${targetSeasonId.value}`);
};

watch(
    () => props.seasonId,
    () => {
      refreshAll();
    }
);

onMounted(() => {
  refreshAll();
});
</script>

<template>
  <div class="daily-report-wrapper" :class="{ 'is-widget': isWidget }">
    <!-- 主卡片容器 -->
    <v-card class="daily-report-card overflow-hidden" variant="text" tile>

      <!-- 顶部 赛季与日报总览 -->
      <div class="daily-header position-relative px-5 pa-sm-6">
        <div class="position-relative z-1">
          <v-row class="">
            <v-col class="d-flex ga-3">
              <div>
                <div class="d-flex align-center ga-2 flex-wrap">
                  <h2 class="text-h3 font-weight-bold text-amber-lighten-2 tracking-wide mb-0">
                    {{ t("dailyReport.title") }}
                  </h2>
                </div>
                <p class="text-medium-emphasis mb-0 mt-3">
                  {{ t("dailyReport.subtitle") }}
                </p>
              </div>
            </v-col>

            <!-- 赛季倒计时 -->
            <v-col cols="6" class="season-banner-box">
              <AffixBoxHasTitleView :offsetTop="0" :disabled-title="true">
                <template v-slot:title>
                  <v-icon icon="mdi-timer-sand" size="20" color="amber-lighten-1"></v-icon>
                </template>
                <v-row>
                  <v-col>
                    <v-row align="center" justify="space-between" dense>
                      <v-col cols="12" sm="12" class="mt-2 mt-sm-0">
                        <div class="d-inline-flex align-center ga-2 bg-black-opacity-50 text-h4 text-amber">
                          {{ isSeasonEnded ? t("dailyReport.season.ended") : t("dailyReport.season.remainingDays", {days: seasonDaysRemaining}) }}
                        </div>
                      </v-col>

                      <v-col cols="12" sm="12">
                        <div class="d-flex align-center ga-2">
                          <div>
                            <p class="text-subtitle-1 font-weight-bold text-white u">{{ seasonName }}</p>
                            <p v-if="seasonDateRange" class="text-caption text-medium-emphasis">
                              {{ seasonDateRange }}
                            </p>
                          </div>
                        </div>
                      </v-col>


                    </v-row>
                  </v-col>
                  <v-col>
                    <SeasonViewWidget :data="currentSeason"></SeasonViewWidget>
                  </v-col>
                </v-row>
              </AffixBoxHasTitleView>
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- 核心内容区域 -->
      <div class="px-4">
        <v-row>
          <!-- 势力战争态势 -->
          <v-col cols="12" lg="6">
            <AffixBoxHasTitleView class="section-card h-100">
              <template v-slot:title>
                {{ t("dailyReport.stateOfWar.title") }}
              </template>
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center ga-2">
                  <div>
                    <span class="text-caption text-medium-emphasis">
                      {{ t("dailyReport.stateOfWar.subtitle") }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 阵营几比几 对决战报看板 S -->
              <div class="faction-battle-banner pa-4 rounded-lg mb-4 border position-relative overflow-hidden">
                <v-row align="center" justify="center" dense>
                  <!-- 阵营 A -->
                  <v-col cols="5" class="text-center pr-2">
                    <div class="d-flex flex-column align-center">
                      <v-avatar size="44" class="faction-avatar border mb-2" :style="{ borderColor: factionAColor }">
                        <FactionIconWidget :name="factionAKey" size="36"></FactionIconWidget>
                      </v-avatar>
                      <div class="text-subtitle-2 font-weight-bold text-truncate w-100 mb-1" :style="{ color: factionAColor }">
                        <FactionNameWidget :id="factionAKey"></FactionNameWidget>
                      </div>
                      <div class="faction-score text-h4 font-weight-black" :style="{ color: factionAColor }">
                        {{ scoreFactionA }}
                      </div>
                    </div>
                  </v-col>

                  <!-- VS 标识 -->
                  <v-col cols="2" class="text-center position-relative">
                    <div class="vs-badge">
                      <img src="@/assets/images/icon-stateOfWar-vs.png" alt="VS" class="vs-img"/>
                    </div>
                  </v-col>

                  <!-- 阵营 B -->
                  <v-col cols="5" class="text-center pl-2">
                    <div class="d-flex flex-column align-center">
                      <v-avatar size="44" class="faction-avatar border mb-2" :style="{ borderColor: factionBColor }">
                        <FactionIconWidget :name="factionBKey" size="36"></FactionIconWidget>
                      </v-avatar>
                      <div class="text-subtitle-2 font-weight-bold text-truncate w-100 mb-1" :style="{ color: factionBColor }">
                        <FactionNameWidget :id="factionBKey"></FactionNameWidget>
                      </div>
                      <div class="faction-score text-h4 font-weight-black" :style="{ color: factionBColor }">
                        {{ scoreFactionB }}
                      </div>
                    </div>
                  </v-col>
                </v-row>

                <!-- 对抗比分进度条 -->
                <div class="score-ratio-bar mt-3">
                  <div class="d-flex align-center w-100 rounded-pill overflow-hidden ratio-track">
                    <div
                        class="ratio-fill-a transition-all"
                        :style="{ width: `${percentFactionA}%`, backgroundColor: factionAColor }"></div>
                    <div
                        class="ratio-fill-b transition-all"
                        :style="{ width: `${percentFactionB}%`, backgroundColor: factionBColor }"></div>
                  </div>
                  <div class="d-flex justify-space-between text-caption mt-1 font-weight-medium">
                    <span :style="{ color: factionAColor }">{{ percentFactionA }}%</span>
                    <span :style="{ color: factionBColor }">{{ percentFactionB }}%</span>
                  </div>
                </div>
              </div>
              <!-- 阵营几比几 对决战报看板 E -->

              <!-- 战争进程当前时间信息 S -->
              <div v-if="activeCycle" class="war-cycle-info bg-black-opacity-40 mb-3">
                <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-flag-checkered" color="amber" size="18"></v-icon>
                    <span class="font-weight-bold text-body-2 text-white">
                      {{ t("dailyReport.stateOfWar.currentCycle", {cycle: activeCycle.cycleNumber}) }}
                    </span>
                    <span v-if="activeCycleTimeRange" class="text-caption text-medium-emphasis">
                      ({{ activeCycleTimeRange }})
                    </span>
                  </div>

                  <v-chip
                      size="x-small"
                      :color="activeCycle.status === 'ended' ? 'grey' : (activeCycle.status === 'active' ? 'amber-darken-2' : '')"
                      variant="flat"
                      class="font-weight-bold text-black">
                    {{ activeCycle.status === "ended" ? t("stateOfWar.ended") : (activeCycle.status === "active" ? t("stateOfWar.active") : t("stateOfWar.upcoming")) }}
                  </v-chip>
                </div>

                <!-- 战期倒计时与进度条 -->
                <div class="d-flex align-center justify-space-between text-caption mb-1">
                  <span class="text-medium-emphasis">{{ t("dailyReport.stateOfWar.cycleTitle") }}</span>
                  <span class="text-amber font-weight-bold">{{ activeCycleRemainingText }}</span>
                </div>
                <v-progress-linear
                    :model-value="activeCycleProgress"
                    color="amber"
                    bg-color="grey-darken-3"
                    height="4"
                    rounded></v-progress-linear>

                <!-- 当前战期战况细览 (区域分布简报) -->
                <div v-if="activeCycle.totals" class="mt-3 d-flex justify-space-between align-center text-caption">
                  <v-spacer></v-spacer>
                  <div class="d-flex align-center ga-3">
                    <span :style="{ color: factionAColor }" class="font-weight-bold">
                      <FactionNameWidget :id="factionAKey"></FactionNameWidget>
                      {{ activeCycle.totals[factionAKey] || 0 }} 战区
                    </span>
                    <span class="opacity-30">|</span>
                    <span :style="{ color: factionBColor }" class="font-weight-bold">
                      <FactionNameWidget :id="factionBKey"></FactionNameWidget>
                      {{ activeCycle.totals[factionBKey] || 0 }} 战区
                    </span>
                  </div>
                </div>

                <!-- 争夺中战区列表  -->
                <div v-if="activeCycleZones.length > 0" class="contested-mini-list mt-3">
                  <div class="d-flex flex-column ga-2">
                    <div
                        v-for="z in activeCycleZones"
                        :key="z.id || z.name"
                        class="contested-item pa-2 rounded border bg-black-opacity-30">
                      <div class="d-flex align-center justify-space-between ga-2 mb-1">
                        <div class="d-flex align-center ga-1 text-truncate mr-2">
                          <v-icon icon="mdi-earth" size="14" class="opacity-50"></v-icon>
                          <span class="text-caption font-weight-medium text-truncate"><ZoneName :id="z.name"/></span>
                          <span class="text-caption opacity-40 text-truncate"><RegionName :id="z.region"/></span>
                        </div>

                        <v-chip
                            size="x-small"
                            :style="{ borderColor: z.isTied ? '#888' : (z.leadingFaction === factionAKey ? factionAColor : factionBColor), color: z.isTied ? '#aaa' : (z.leadingFaction === factionAKey ? factionAColor : factionBColor) }"
                            variant="tonal"
                            class="font-weight-bold shrink-0">
                          <template v-if="z.isTied">
                            {{ t('stateOfWar.tied') }}
                          </template>
                          <template v-else>
                            <FactionNameWidget :id="z.leadingFaction"/>
                            {{ t('stateOfWar.leading') }}
                          </template>
                        </v-chip>
                      </div>

                      <!-- 战资数据对比与百分比 -->
                      <div class="d-flex align-center justify-space-between text-caption font-weight-bold mb-1" style="font-size: 11px;">
                      <span :style="{ color: factionAColor }">
                        {{ formatCompactNumber(z[factionAKey]) }} ({{ z.percentA }}%)
                      </span>
                        <span :style="{ color: factionBColor }">
                        {{ formatCompactNumber(z[factionBKey]) }} ({{ z.percentB }}%)
                      </span>
                      </div>

                      <!-- 对抗进度条 -->
                      <v-progress-linear
                          height="4"
                          rounded
                          :model-value="z.percentA"
                          :color="factionAColor"
                          :bg-color="factionBColor"
                          bg-opacity="1">
                      </v-progress-linear>
                    </div>
                  </div>
                </div>
              </div>
            </AffixBoxHasTitleView>
          </v-col>

          <!-- 近期活动 -->
          <v-col cols="12" lg="6">
            <AffixBoxHasTitleView class="section-card h-100">
              <template v-slot:title>
                {{ t("dailyReport.calendar.title") }}
              </template>
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center ga-2">
                  <div>
                    <span class="text-caption text-medium-emphasis">
                      {{ t("dailyReport.calendar.subtitle") }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 加载中状态 -->
              <div v-if="calendarLoading" class="py-8 text-center">
                <Loading size="36"></Loading>
              </div>

              <!-- 空状态 -->
              <div
                  v-else-if="parsedCalendarEvents.length === 0"
                  class="py-8 text-center text-medium-emphasis">
                <v-icon icon="mdi-calendar-blank-outline" size="40" class="mb-2 opacity-30"></v-icon>
                <p class="text-caption mb-0">{{ t("dailyReport.calendar.noEvents") }}</p>
              </div>

              <!-- 活动列表 S -->
              <div v-else class="d-flex flex-column ga-3">
                <!-- 活动卡片 -->
                <v-card
                    variant="text"
                    border
                    v-for="ev in parsedCalendarEvents.slice(0, 4)"
                    :key="ev.id + ev.startMs"
                    class="event-item-card pa-3 transition-all"
                    :class="{ 'is-active-event': ev.isOngoing }">
                  <div class="d-flex align-start justify-space-between ga-2 mb-2">
                    <div>
                      <div class="d-flex align-center ga-2 flex-wrap">
                        <span class="text-h6 font-weight-bold text-amber-lighten-3">
                          {{ ev.name }}
                        </span>
                        <v-chip
                            size="x-small"
                            :color="ev.isOngoing ? 'amber-darken-2' : 'grey-darken-2'"
                            variant="flat"
                            class="font-weight-bold text-black">
                          {{ ev.isOngoing ? t("dailyReport.calendar.ongoing") : t("dailyReport.calendar.upcoming") }}
                        </v-chip>
                      </div>
                      <p v-if="ev.description" class="text-medium-emphasis line-clamp-2 mt-1 mb-0">
                        {{ ev.description }}
                      </p>
                    </div>

                    <div class="text-right shrink-0">
                      <div class="font-weight-medium text-amber">
                        {{ ev.isOngoing ? t("dailyReport.season.remainingDays", {days: ev.daysRemainingOrUntil}) : t("dailyReport.calendar.startsInDays", {days: ev.daysRemainingOrUntil}) }}
                      </div>
                      <div class="text-disabled">
                        <u class="u">{{ ev.startDateStr }}</u> ~ <u class="u">{{ ev.endDateStr }}</u>
                      </div>
                    </div>
                  </div>

                  <!-- 掉落物预览 -->
                  <div v-if="ev.droppeds && Object.keys(ev.droppeds).length > 0" class="d-flex align-center">
                    <div class="d-flex align-center ga-1 flex-wrap ml-n2">
                      <ItemSlotBase
                          v-for="(dropInfo, dropId) in Object.entries(ev.droppeds).slice(0, 4)"
                          :key="dropId"
                          size="40px"
                          class="d-flex justify-center align-center mini-drop-slot">
                        <template v-if="(dropInfo[1] as any).category === 'item' && !(dropInfo[1] as any).isUnknown">
                          <ItemIconWidget :id="dropInfo[0]" :padding="0" :margin="0" :size="28"></ItemIconWidget>
                        </template>
                        <template v-else-if="(dropInfo[1] as any).category === 'material' && !(dropInfo[1] as any).isUnknown">
                          <MaterialIconWidget :id="dropInfo[0]" :padding="0" :margin="0" :size="28"></MaterialIconWidget>
                        </template>
                        <template v-else-if="(dropInfo[1] as any).category === 'cosmetic' && !(dropInfo[1] as any).isUnknown">
                          <CosmeticIconWidget :id="dropInfo[0]" :padding="0" :margin="0" :size="28"></CosmeticIconWidget>
                        </template>
                        <template v-else>
                          <v-icon size="16">mdi-help</v-icon>
                        </template>
                      </ItemSlotBase>

                      <ItemSlotBase
                          v-if="Object.keys(ev.droppeds).length > 4"
                          size="32px"
                          class="d-flex justify-center align-center text-caption font-weight-bold">
                        +{{ Object.keys(ev.droppeds).length - 4 }}
                      </ItemSlotBase>
                    </div>
                  </div>
                </v-card>
              </div>
              <!-- 活动列表 E -->
            </AffixBoxHasTitleView>
          </v-col>

          <!-- 当前可用掉宝 S -->
          <v-col cols="12" v-if="showDrop">
            <AffixBoxHasTitleView class="section-card h-100">
              <template v-slot:title>
                {{ t("dailyReport.drop.title") }}
              </template>
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center ga-2">
                  <div>
                    <span class="text-caption text-medium-emphasis">
                      {{ t("dailyReport.drop.subtitle") }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 加载中状态 -->
              <div v-if="dropLoading" class="py-8 text-center">
                <Loading size="36"></Loading>
              </div>

              <!-- 空状态 -->
              <div
                v-else-if="activeCampaigns.length === 0"
                class="py-8 text-center text-medium-emphasis">
                <v-icon icon="mdi-gift-off-outline" size="40" class="mb-2 opacity-30"></v-icon>
                <p class="text-caption mb-0">{{ t("dailyReport.drop.noDrops") }}</p>
              </div>

              <!-- 掉宝卡片列表 -->
              <div v-else class="d-flex flex-column ga-4">
                <DropWidget
                  v-for="campaign in activeCampaigns"
                  :key="campaign.id || campaign.campaignId"
                  :campaign="campaign"
                  :is-active-card="true"
                />
              </div>
            </AffixBoxHasTitleView>
          </v-col>
          <!-- 当前可用掉宝 E -->
        </v-row>
      </div>
    </v-card>
  </div>
</template>

<style scoped lang="less">
.daily-report-wrapper {
  width: 100%;
  margin: 0 auto;
}

.header-icon-avatar {
  border-color: rgba(255, 179, 0, 0.4) !important;
}

.season-banner-box {
  backdrop-filter: blur(8px);
}

.bg-black-opacity-50 {
  background-color: rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.bg-black-opacity-40 {
  background-color: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.06) !important;
}

.bg-black-opacity-30 {
  background-color: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.bg-surface-variant-dark {
  background-color: #191919;
}

.section-card {
}

.faction-battle-banner {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(10, 10, 10, 0.8) 100%);
  border-color: rgba(255, 255, 255, 0.08) !important;
}

.faction-avatar {
  background-color: #000;
}

.vs-badge {
  display: flex;
  justify-content: center;
  align-items: center;

  .vs-img {
    height: 48px;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8));
  }
}

.ratio-track {
  height: 8px;
  background-color: #2a2a2a;
}

.ratio-fill-a,
.ratio-fill-b {
  height: 100%;
}

.event-item-card {
  background: rgba(0, 0, 0, 0.35);

  &:hover {
    background: rgba(0, 0, 0, 0.5);
  }

  &.is-active-event {
    background: linear-gradient(90deg, rgba(255, 179, 0, 0.06) 0%, rgba(0, 0, 0, 0.4) 100%);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.border-t {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.mini-drop-slot {
  border-radius: 4px;
}
</style>
