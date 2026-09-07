<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {Seasons} from "glow-prow-data";
import {apis, http, storage, time, getCurrentSeason as _getCurrentSeason} from "@/assets/sripts";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

import {Season} from "glow-prow-data/src/entity/Seasons";
import {CalendarData, FormattedCalendar} from "@/assets/types";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

import Loading from "@/components/Loading.vue";
import CalendarEventSLotWidget from "@/components/snbWidget/calendarEventSLotWidget.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import Silk from "@/components/Silk.vue";
import AdsWidget from "@/components/ads/google/index.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t, te} = useI18n()
const {asString} = useI18nUtils()
const {locale} = useI18n()
const notice = useNoticeStore()
const route = useRoute()
const router = useRouter()

const seasons = Seasons;
const selectSeasonsList: any = ref<Array<{ id: string; label: string }>>([])
const selectSeasonsValue: any = ref<any>(null)
const calendarLoading: any = ref(false)
const formattedCalendar: any = ref<FormattedCalendar>({})
const seasonsCalendarEvents: any = ref<CalendarData | null>(null)
const currentlySeason: any = ref<Season | null>(null)

const STORAGE_KEY_VIEW_MODE = 'calendar.viewMode'
type ViewMode = 'compact' | 'detailed'
const viewMode = ref<ViewMode>('compact')
const scrollListRef = ref<any>(null)

/**
 * 检查指定日期是否为今天
 */
const isToday = (year: number, month: number, day: number) => {
  const now = new Date()
  return (
      now.getFullYear() === Number(year) &&
      now.getMonth() + 1 === Number(month) &&
      now.getDate() === Number(day)
  )
}

/**
 * 日历按照当前时间滚动到对应位置
 */
const scrollToCurrentTime = (behavior: ScrollBehavior = 'smooth') => {
  const performScroll = (): boolean => {
    const scrollContainer = (scrollListRef.value?.$el || document.querySelector('#calendar') || document) as HTMLElement
    const wrapper = scrollContainer.querySelector('.scroll-wrapper') as HTMLElement | null
    if (!wrapper) return false

    const dayElements = Array.from(wrapper.querySelectorAll<HTMLElement>('.calendar-day-column'))
    if (dayElements.length === 0) return false

    const now = new Date()
    const nowTime = now.getTime()
    const todayStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime()
    const todayEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()

    const dayItems = dayElements
        .map((el) => {
          const startTime = Number(el.getAttribute('data-calendar-day-time') || 0)
          const duration = Number(el.getAttribute('data-duration') || 1)
          return {
            el,
            startTime,
            endTime: startTime + duration * 86400000 - 1,
          }
        })
        .filter((item) => item.startTime > 0)

    if (dayItems.length === 0) return false

    dayItems.sort((a, b) => a.startTime - b.startTime)

    let targetEl: HTMLElement | null = null

    // 1. 精确匹配今天的日期列
    const exactMatch = dayItems.find((d) => d.startTime >= todayStartTime && d.startTime <= todayEndTime)
    if (exactMatch) {
      targetEl = exactMatch.el
    } else {
      // 2. 匹配今天处于进行中的事件（跨多天事件）
      const ongoingMatch = dayItems.find((d) => nowTime >= d.startTime && nowTime <= d.endTime)
      if (ongoingMatch) {
        targetEl = ongoingMatch.el
      }
      // 3. 当前时间早于赛季所有事件，滚动到首个日期
      else if (nowTime < dayItems[0].startTime) {
        targetEl = dayItems[0].el
      }
      // 4. 当前时间晚于赛季所有事件，滚动到末尾日期
      else if (nowTime > dayItems[dayItems.length - 1].endTime) {
        targetEl = dayItems[dayItems.length - 1].el
      }
      // 5. 处于事件空档期：优先匹配下一个即将到来的事件，否则选最接近的事件
      else {
        const upcoming = dayItems.find((d) => d.startTime >= nowTime)
        if (upcoming) {
          targetEl = upcoming.el
        } else {
          let closest = dayItems[0]
          let minDiff = Infinity
          for (const item of dayItems) {
            const diff = Math.abs(item.startTime - nowTime)
            if (diff < minDiff) {
              minDiff = diff
              closest = item
            }
          }
          targetEl = closest.el
        }
      }
    }

    if (targetEl) {
      const wrapperRect = wrapper.getBoundingClientRect()
      const targetRect = targetEl.getBoundingClientRect()
      const currentScrollLeft = wrapper.scrollLeft

      const offsetMargin = window.innerWidth <= 768 ? 20 : 80
      const targetScroll = currentScrollLeft + (targetRect.left - wrapperRect.left) - offsetMargin
      const finalScroll = Math.max(0, targetScroll)

      wrapper.scrollTo({left: finalScroll, behavior})
      scrollListRef.value?.scrollTo?.(finalScroll, behavior)
      scrollListRef.value?.checkScrollability?.()
      return true
    }

    return false
  }

  nextTick(() => {
    performScroll()
    const timers = [50, 150, 300, 500, 800]
    timers.forEach((delay) => {
      setTimeout(() => {
        performScroll()
      }, delay)
    })
  })
}

const selectedSeasonId = computed(() => {
  if (!selectSeasonsValue.value) return '';
  if (typeof selectSeasonsValue.value === 'object') return selectSeasonsValue.value.id || '';
  return String(selectSeasonsValue.value);
});

const remainingDays = computed(() => {
  const sId = selectedSeasonId.value;
  if (!sId || !seasons[sId]) return 0;

  const targetDate = seasons[sId].endDate;
  const endDate = new Date(targetDate)

  if (isNaN(endDate.getTime())) {
    console.error("calendar.error.invalidDate", targetDate)
    return 0;
  }

  return time.calcRemainingDays(endDate)
})

const currentSeasonName = computed(() => {
  const sId = selectedSeasonId.value;
  if (!sId) return t('calendar.common.na')
  return t(`snb.seasons.${sId}`, t('calendar.common.na'))
})

const seasonDescription = computed(() => {
  const sId = selectedSeasonId.value;
  if (!sId) return '';
  return asString([`snb.calendar.${sId}.description`], {backRawKey: false}) || '';
})

const hasCalendarEvents = computed(() => {
  if (!formattedCalendar.value) return false;
  const monthKeys = Object.keys(formattedCalendar.value);
  if (monthKeys.length === 0) return false;
  return monthKeys.some(key => formattedCalendar.value[key]?.eventCount > 0);
});

watch(() => route.params.seasonId, (newSeasonId) => {
  if (newSeasonId && seasons[newSeasonId as string]) {
    const sId = String(newSeasonId);
    if (sId !== selectedSeasonId.value) {
      selectSeasonsValue.value = sId;
      fetchCalendarEventData(sId).then(() => {
        initCalendarList();
        scrollToCurrentTime();
      });
    }
  }
});

watch(() => locale.value, (value) => {
  initCalendarList()
})

onMounted(async () => {
  // 从 localStorage 恢复视图模式偏好
  const stored = storage.local.get(STORAGE_KEY_VIEW_MODE)
  if (stored.code === 0 && (stored.data?.value === 'compact' || stored.data?.value === 'detailed')) {
    viewMode.value = stored.data.value
  }
  await initCalendar()
})

/**
 * 转化赛季id地址
 */
const getSeasonIdFromRoute = (): string | null => {
  if (route.params.seasonId) {
    return String(route.params.seasonId);
  }
  const match = route.path.match(/\/calendar\/([^/]+)/);
  if (match && match[1] && match[1] !== 'history') {
    return match[1];
  }
  return null;
};

/**
 * 初始日历
 */
const initCalendar = async () => {
  getCurrentSeason()
  initCalendarList()

  const routeSeasonId = getSeasonIdFromRoute();
  const currentId = currentlySeason.value?.id;

  if (routeSeasonId && seasons[routeSeasonId]) {
    selectSeasonsValue.value = routeSeasonId;
  } else if (selectSeasonsList.value.length > 0) {
    const matched = selectSeasonsList.value.find((item: any) => item.id === currentId);
    selectSeasonsValue.value = matched ? matched.id : selectSeasonsList.value[selectSeasonsList.value.length - 1].id;
  }

  await fetchCalendarEventData(selectedSeasonId.value);
  initCalendarList();
  scrollToCurrentTime();
};

/**
 * 初始日历列表
 */
const initCalendarList = () => {
  selectSeasonsList.value = Object.values(seasons)
      .map(season => {
        const i18nKey = `snb.seasons.${season.id}`;
        const label = te(i18nKey as any) ? t(i18nKey) : 'calendar.common.none';

        return {
          id: season.id,
          label
        };
      })
      .filter(season => season.id !== 'none')

  // 初始列表
  if (seasonsCalendarEvents.value) {
    formattedCalendar.value = transformCalendarData(seasonsCalendarEvents.value)
  } else {
    formattedCalendar.value = {}
  }
};

/**
 * 转化日历数据
 * @param calendarData
 */
const transformCalendarData = (calendarData: CalendarData | null): FormattedCalendar => {
  const result: FormattedCalendar | any = {};

  if (!calendarData?.events) return result;

  const seasonObj = seasons[selectedSeasonId.value];
  const seasonStartDate = seasonObj?.startDate ? new Date(seasonObj.startDate) : null;
  const defaultYear = seasonStartDate ? seasonStartDate.getFullYear() : new Date().getFullYear();
  const startMonth = seasonStartDate ? seasonStartDate.getMonth() + 1 : 1;

  const getOccurrenceYear = (occurrence: any) => {
    if (occurrence.year) return occurrence.year;
    if (seasonStartDate && occurrence.month < startMonth) {
      return defaultYear + 1;
    }
    return defaultYear;
  };

  const yearMonthMap = new Map<string, {
    year: number;
    month: number;
    daysInMonth: number;
    events: any[];
  }>()

  // Collect all involved years and months
  Object.values(calendarData.events).forEach((event: any) => {
    (event.occurrences || []).forEach((occurrence: any) => {
      const year = getOccurrenceYear(occurrence);
      const month = occurrence.month;
      const key = `${year}-${month}`;

      if (!yearMonthMap.has(key)) {
        const daysInMonth = new Date(year, month, 0).getDate()
        yearMonthMap.set(key, {
          year,
          month,
          daysInMonth,
          events: []
        })
      }
    })
  })

  // Sort by year and month
  const sortedYearMonths = Array.from(yearMonthMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  })

  // Initialize result structure
  sortedYearMonths.forEach(({year, month, daysInMonth}) => {
    const monthKey = `${year}-${month}`;
    result[monthKey] = {
      data: Array.from({length: daysInMonth}, (_, i) => ({
        day: i + 1,
        events: [],
      })),
      month,
      year,
      eventCount: 0,
    };
  })

  // Process each event
  Object.values(calendarData.events).forEach((event: any) => {
    const sortedOccurrences = [...(event.occurrences || [])].sort((a: any, b: any) => {
      const yearA = getOccurrenceYear(a);
      const yearB = getOccurrenceYear(b);
      const dateA = new Date(yearA, a.month - 1, a.day)
      const dateB = new Date(yearB, b.month - 1, b.day)
      return dateA.getTime() - dateB.getTime()
    })

    sortedOccurrences.forEach((occurrence: any) => {
      const year = getOccurrenceYear(occurrence);
      const monthKey = `${year}-${occurrence.month}`;
      const startDay = occurrence.day;

      if (!result[monthKey]) return;

      const daysInMonth = result[monthKey].data.length;
      const endDay = Math.min(startDay + event.duration - 1, daysInMonth)

      result[monthKey].eventCount++;

      for (let day = startDay; day <= endDay; day++) {
        const dayData = result[monthKey].data.find(d => d.day === day)
        if (dayData) {
          dayData.events.push({
            id: event.id,
            name: event.name,
            description: event.description,
            duration: event.duration,
            droppeds: event.droppeds,
            isStart: day === startDay,
            year: year,
            month: occurrence.month,
            startDay: startDay
          })
        }
      }
    })
  })

  return result;
};

/**
 * 读区日历事件
 * @param seasonId
 */
const fetchCalendarEventData = async (seasonId?: string) => {
  try {
    const targetSeasonId = seasonId || selectedSeasonId.value || currentlySeason.value?.id;
    if (!targetSeasonId) return;

    calendarLoading.value = true;
    const result = await apis.calendarApi().get(targetSeasonId)

    if (result && result.data && result.data.data && Object.keys(result.data.data).length > 0) {
      seasonsCalendarEvents.value = result.data.data;
    } else {
      seasonsCalendarEvents.value = null;
      formattedCalendar.value = {};
    }
  } catch (error) {
    seasonsCalendarEvents.value = null;
    formattedCalendar.value = {};
    if (error instanceof ApiError) {
      notice.error(t(`basic.tips.${error.code}`, {content: error.message || error.code}));
    } else {
      notice.error(t('calendar.error.fetchFailed'))
    }
    console.error(error)
  } finally {
    calendarLoading.value = false;
  }
};

/**
 * 获取当前赛季
 */
const getCurrentSeason = (): Season | null => {
  const season = _getCurrentSeason();
  if (season) {
    currentlySeason.value = season;
  }
  return season;
};

/**
 * 更新选择赛季
 * @param season
 */
const updateSelectedSeason = (season: any) => {
  const seasonId = typeof season === 'object' ? season?.id : season;
  if (!seasonId) return;

  selectSeasonsValue.value = seasonId;

  const currentId = currentlySeason.value?.id || getCurrentSeason()?.id || selectSeasonsList.value?.[selectSeasonsList.value.length - 1]?.id;
  const targetPath = seasonId === currentId
      ? `/calendar/${seasonId}/`
      : `/calendar/${seasonId}/history`;

  if (route.path !== targetPath) {
    router.push(targetPath);
  }

  fetchCalendarEventData(seasonId).then(() => {
    initCalendarList();
    scrollToCurrentTime();
  });
};

/**
 * 订阅日历
 * @param type
 * @param seasonId
 * @param eventId
 */
const subscribeToCalendar = (type: 'calendar' | 'event', seasonId: string, eventId?: string) => {
  switch (type) {
    case 'calendar':
      openICSFile('events.ics', seasonId)
      break;
    case 'event':
      if (eventId) {
        openICSFile('event.ics', seasonId, eventId)
      }
      break;
  }
};

/**
 * 下载 ICS 标准文件
 * @param url
 * @param season
 * @param eventId
 */
const openICSFile = (url: string, season: string, eventId?: string) => {
  const params = new URLSearchParams({
    language: 'zh_CN',
    season: season,
    eventId: eventId || ''
  })

  window.open(`${http.location}calendar/${url}?${params.toString()}`)
};

/**
 * 获取事件名称
 * @param eventId
 */
const getEventName = (eventId: string) => {
  const sId = selectedSeasonId.value;
  if (!sId) return '';
  return t(`snb.calendar.${sId}.data.${eventId}.name`, '')
};

/**
 * 切换视图模式（简约/详细），并持久化到 localStorage
 */
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'compact' ? 'detailed' : 'compact'
  storage.local.set(STORAGE_KEY_VIEW_MODE, viewMode.value)
  scrollToCurrentTime();
};

/**
 * 简约模式日历数据：每个事件只在起始日（isStart=true）显示，跳过续集日期
 */
const compactCalendar = computed<FormattedCalendar>(() => {
  const source = formattedCalendar.value
  if (!source) return {}

  const result: any = {}

  for (const [monthKey, monthData] of Object.entries<any>(source)) {
    const filteredDays = monthData.data
        .map((dayData: any) => ({
          ...dayData,
          events: dayData.events.filter((e: any) => e.isStart),
        }))
        .filter((dayData: any) => dayData.events.length > 0)

    if (filteredDays.length > 0) {
      result[monthKey] = {
        ...monthData,
        data: filteredDays,
        eventCount: filteredDays.reduce((acc: number, d: any) => acc + d.events.length, 0),
      }
    }
  }

  return result
});

/**
 * 当前激活的日历数据（根据视图模式切换）
 */
const activeCalendar = computed<FormattedCalendar>(() =>
    viewMode.value === 'compact' ? compactCalendar.value : formattedCalendar.value
);

watch(activeCalendar, () => {
  scrollToCurrentTime();
}, {flush: 'post'});
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
      <v-container class="mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/calendar">
            <b class="text-amber">{{ t('calendar.title') }}</b>
          </v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-calendar-range" size="120"></v-icon>
        </div>

        <div class="mt-5">
          <div>
            <span class="text-amber mr-5 text-h4">
              {{ currentSeasonName }}
            </span>
            <span class="mr-2 text-h5">
              {{ t('calendar.timeRemaining', {time: remainingDays}) }}
            </span>
          </div>
          <p class="mt-1 text-caption" v-if="selectedSeasonId">
            {{ selectedSeasonId.toUpperCase() }}
          </p>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>

  <!-- 日历 头部 S -->
  <AffixContainerView :offsetTop="55">
    <div class="bg-black">
      <v-container class="py-5">
        <v-row align="start">
          <v-col cols="12" sm="12" lg="6">
            <p class="opacity-80 text-caption">
              {{ seasonDescription }}
            </p>
          </v-col>

          <v-spacer class="hidden-sm hidden-md"></v-spacer>

          <v-col cols="auto">
            <v-btn-group>
              <v-dialog max-width="500" v-if="selectedSeasonId">
                <template v-slot:activator="{ props: activatorProps }">
                  <v-btn
                      :color="`var(--main-color)`"
                      v-bind="activatorProps"
                      min-width="150">
                    {{ t('calendar.button.subscribe') }}
                  </v-btn>
                </template>

                <template v-slot:default="{ isActive }">
                  <v-card :title="t('calendar.dialog.subscribeTitle', { season: currentSeasonName })">
                    <v-card-text class="opacity-80">
                      {{ t('calendar.dialog.subscribeDescription') }}
                    </v-card-text>

                    <div class="w-100 background-flavor pt-4 pb-4">
                      <p class="text-amber text-h3 text-center">{{ currentSeasonName }}</p>
                    </div>

                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                          :text="t('basic.button.submit')"
                          @click="subscribeToCalendar('calendar', selectedSeasonId); isActive.value = false"
                      ></v-btn>
                    </v-card-actions>
                  </v-card>
                </template>
              </v-dialog>

              <v-select
                  tile
                  :label="t('calendar.label.pastSeasons')"
                  :hide-details="true"
                  :hide-no-data="true"
                  :hide-spin-buttons="true"
                  variant="solo-filled"
                  density="comfortable"
                  item-value="id"
                  item-title="label"
                  min-width="150px"
                  max-width="300px"
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
                  <!-- 视图切换 -->
                  <v-list-item @click="toggleViewMode">
                    <template v-slot:prepend>
                      <v-icon :icon="viewMode === 'compact' ? 'mdi-view-compact' : 'mdi-view-list'" size="20"/>
                    </template>
                    <v-list-item-title>
                      {{ viewMode === 'compact' ? t('calendar.viewMode.compact') : t('calendar.viewMode.detailed') }}
                    </v-list-item-title>
                  </v-list-item>

                  <!-- 今日按钮 -->
                  <v-list-item @click="scrollToCurrentTime('smooth')">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-calendar-today" size="20"/>
                    </template>
                    <v-list-item-title>{{ t('calendar.button.today') }}</v-list-item-title>
                  </v-list-item>

                  <!-- 刷新按钮 -->
                  <v-list-item @click="initCalendar" :disabled="calendarLoading">
                    <template v-slot:prepend>
                      <v-icon
                          :icon="calendarLoading ? 'mdi-loading' : 'mdi-refresh'"
                          size="20"
                          :class="calendarLoading ? 'spin-icon-load' : ''"/>
                    </template>
                    <v-list-item-title>刷新</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-btn-group>
          </v-col>
        </v-row>
      </v-container>
      <v-divider></v-divider>
    </div>
  </AffixContainerView>
  <!-- 日历 头部 E -->

  <v-divider class="mb-5"></v-divider>

  <v-container>
    <AdsWidget class="my-5" id="snb-calendar-up"></AdsWidget>
  </v-container>

  <!-- 日历 内容 S -->
  <template v-if="!calendarLoading">
    <HorizontalScrollList v-if="hasCalendarEvents" ref="scrollListRef">
      <div class="position-relative">
        <div class="calendar-line" style="white-space: nowrap;">
          <div v-for="(monthData, monthKey) in activeCalendar" :key="monthKey">
            <template v-if="monthData.eventCount > 0">
              <v-row no-gutters align="center">
                <v-avatar
                    size="55"
                    class="font-weight-bold text-h5"
                    :color="`var(--main-color)`"
                    style="color: hsl(from var(--main-color) h s calc(l * 0.3))"
                >
                  {{ monthData.month }}
                </v-avatar>
                <v-col>
                  <v-divider :color="`var(--main-color)`" :opacity="20"></v-divider>
                </v-col>
              </v-row>

              <div class="calendar-line-day">
                <template v-for="dayData in monthData.data" :key="dayData.day">
                  <div
                      v-if="dayData.events && dayData.events.length"
                      class="calendar-day-column"
                      :data-calendar-day-time="new Date(monthData.year, monthData.month - 1, dayData.day).getTime()"
                      :data-duration="Math.max(...dayData.events.map((e: any) => e.duration || 1))"
                      :id="`calendar-day-${monthData.year}-${monthData.month}-${dayData.day}`">
                    <v-btn
                        block
                        class="btn-flavor mt-4 w-100 font-weight-bold text-black"
                        :class="{ 'btn-today': isToday(monthData.year, monthData.month, dayData.day) }">
                      {{ t('calendar.day', {day: dayData.day}) }}
                      <span v-if="isToday(monthData.year, monthData.month, dayData.day)" class="today-tag ml-1">
                        {{ t('calendar.today') }}
                      </span>
                    </v-btn>

                    <div class="mr-3 pt-4">
                      <CalendarEventSLotWidget
                          :data="event"
                          :currentlySeason="seasons[selectedSeasonId]"
                          v-for="event in dayData.events"
                          :key="`${event.id}-${event.year}-${event.month}-${event.startDay}`">
                        <template v-slot:header-right-btn>
                          <v-dialog max-width="500" v-if="selectedSeasonId">
                            <template v-slot:activator="{ props: activatorProps }">
                              <v-btn density="compact" v-bind="activatorProps">
                                {{ t('calendar.button.addToCalendar') }}
                              </v-btn>
                            </template>

                            <template v-slot:default="{ isActive }">
                              <v-card :title="getEventName(event.id)">
                                <v-card-text>
                                  {{ t('calendar.dialog.eventSubscribeQuestion', {event: getEventName(event.id)}) }}
                                </v-card-text>

                                <div class="w-100 background-flavor pt-4 pb-4">
                                  <CalendarEventSLotWidget
                                      class="ma-auto"
                                      :show-dropped="false"
                                      :data="event"
                                      :currentlySeason="seasons[selectedSeasonId]"
                                  ></CalendarEventSLotWidget>
                                </div>

                                <v-card-actions>
                                  <v-spacer></v-spacer>
                                  <v-btn
                                      :text="t('basic.button.submit')"
                                      @click="subscribeToCalendar('event', selectedSeasonId, event.id); isActive.value = false"
                                  ></v-btn>
                                </v-card-actions>
                              </v-card>
                            </template>
                          </v-dialog>
                        </template>
                      </CalendarEventSLotWidget>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </HorizontalScrollList>

    <v-container v-else class="my-10">
      <v-card border class="py-10 text-center bg-black">
        <EmptyView></EmptyView>
      </v-card>
    </v-container>
  </template>
  <!-- 日历 内容 E -->

  <v-container>
    <AdsWidget class="my-5" id="snb-calendar-down"></AdsWidget>
  </v-container>

  <div class="text-center" v-if="calendarLoading">
    <v-card min-height="400" class="mt-16 ma-auto bg-transparent" variant="text">
      <Loading size="100" class="mt-50"></Loading>
    </v-card>
  </div>
</template>

<style scoped lang="less">
.calendar-line {
  min-height: 400px;
  padding-bottom: 50px;
  display: flex;

  > div:first-child {
    margin-left: 50px;
  }

  .calendar-line-day {
    display: flex;

    > div:first-child {
      margin-left: 80px;
    }
  }
}

.btn-today {
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.8), inset 0 0 5px rgba(255, 193, 7, 0.5) !important;
  outline: 2px solid #ffc107 !important;
}

.today-tag {
  background: #000;
  color: var(--main-color, #ffc107);
  padding: 0 5px;
  border-radius: 3px;
  font-size: 11px;
  line-height: 16px;
}

@media screen and (max-width: 980px) {
  .calendar-line {
    > div:first-child {
      margin-left: 20px;
    }

    .calendar-line-day {
      > div:first-child {
        margin-left: 0;
      }
    }
  }
}
</style>
