<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Seasons} from "glow-prow-data";
import {http, time} from "@/assets/sripts";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

import {Season} from "glow-prow-data/src/entity/Seasons";
import {CalendarData, FormattedCalendar} from "@/assets/types";
import {useCalendarApi} from "@/assets/sripts/api/calendar_service";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

import Loading from "@/components/Loading.vue";
import CalendarEventSLotWidget from "@/components/snbWidget/calendarEventSLotWidget.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import Silk from "@/components/Silk.vue";

const {t, te} = useI18n();
const {asString} = useI18nUtils();
const api = useCalendarApi();
const notice = useNoticeStore();

const seasons = Seasons;
const selectSeasonsList: any = ref<Array<{ id: string; label: string }>>([]);
const selectSeasonsValue: any = ref<Season | null>(null);
const calendarLoading: any = ref(false);
const formattedCalendar: any = ref<FormattedCalendar>({});
const seasonsCalendarEvents: any = ref<CalendarData | null>(null);
const currentlySeason: any = ref<Season | null>(null);

const remainingDays = computed(() => {
  if (!selectSeasonsValue.value || !seasons[selectSeasonsValue.value.id]) return 0;

  const targetDate = seasons[selectSeasonsValue.value.id].endDate;
  const endDate = new Date(targetDate);

  if (isNaN(endDate.getTime())) {
    console.error("calendar.error.invalidDate", targetDate);
    return 0;
  }

  return time.calcRemainingDays(endDate);
});

const currentSeasonName = computed(() => {
  if (!selectSeasonsValue.value) return t('calendar.common.na');
  return t(`snb.seasons.${selectSeasonsValue.value.id}`, t('calendar.common.na'));
});

const seasonDescription = computed(() => {
  if (!selectSeasonsValue.value) return '';
  return asString([`snb.calendar.${selectSeasonsValue.value.id}.description`], {backRawKey: false}) || '';
});

onMounted(async () => {
  await initCalendar();
});

const initCalendar = async () => {
  getCurrentSeason();
  await fetchCalendarEventData();
  initCalendarList();

  if (selectSeasonsList.value.length > 0) {
    selectSeasonsValue.value = selectSeasonsList.value[selectSeasonsList.value.length - 1];
  }
};

const initCalendarList = () => {
  // Initialize season selection list
  selectSeasonsList.value = Object.values(seasons)
      .map(season => {
        const i18nKey = `snb.seasons.${season.id}`;
        const label = te(i18nKey as any) ? t(i18nKey) : 'calendar.common.none';

        return {
          id: season.id,
          label
        };
      })
      .filter(season => season.id !== 'none');

  // Initialize calendar list
  if (seasonsCalendarEvents.value) {
    formattedCalendar.value = transformCalendarData(seasonsCalendarEvents.value);
  }
};

const transformCalendarData = (calendarData: CalendarData | null): FormattedCalendar => {
  const result: FormattedCalendar | any = {};

  if (!calendarData?.events) return result;

  const yearMonthMap = new Map<string, {
    year: number;
    month: number;
    daysInMonth: number;
    events: any[];
  }>();

  // Collect all involved years and months
  Object.values(calendarData.events).forEach(event => {
    event.occurrences.forEach((occurrence: any) => {
      const year = occurrence.year;
      const month = occurrence.month;
      const key = `${year}-${month}`;

      if (!yearMonthMap.has(key)) {
        const daysInMonth = new Date(year, month, 0).getDate();
        yearMonthMap.set(key, {
          year,
          month,
          daysInMonth,
          events: []
        });
      }
    });
  });

  // Sort by year and month
  const sortedYearMonths = Array.from(yearMonthMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

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
  });

  // Process each event
  Object.values(calendarData.events).forEach((event: any) => {
    const sortedOccurrences = event.occurrences.sort((a: any, b: any) => {
      const dateA = new Date(a.year, a.month - 1, a.day);
      const dateB = new Date(b.year, b.month - 1, b.day);
      return dateA.getTime() - dateB.getTime();
    });

    sortedOccurrences.forEach((occurrence: any) => {
      const monthKey = `${occurrence.year}-${occurrence.month}`;
      const startDay = occurrence.day;

      if (!result[monthKey]) return;

      const daysInMonth = result[monthKey].data.length;
      const endDay = Math.min(startDay + event.duration - 1, daysInMonth);

      result[monthKey].eventCount++;

      for (let day = startDay; day <= endDay; day++) {
        const dayData = result[monthKey].data.find(d => d.day === day);
        if (dayData) {
          dayData.events.push({
            id: event.id,
            name: event.name,
            description: event.description,
            duration: event.duration,
            droppeds: event.droppeds,
            isStart: day === startDay,
            year: occurrence.year,
            month: occurrence.month,
            startDay: startDay
          });
        }
      }
    });
  });

  return result;
};

const fetchCalendarEventData = async (seasonId?: string) => {
  try {
    const targetSeasonId = seasonId || currentlySeason.value?.id;
    if (!targetSeasonId) return;

    calendarLoading.value = true;
    const result = await api.get(targetSeasonId);

    if (result.data?.data) {
      seasonsCalendarEvents.value = result.data.data;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      notice.error(t(`basic.tips.${error.code}`, {context: error.code}));
    } else {
      console.error('calendar.error.fetchFailed', error);
      notice.error(t('calendar.error.fetchFailed'));
    }
  } finally {
    calendarLoading.value = false;
  }
};

const getCurrentSeason = (): Season | null => {
  const currentDate = new Date();
  const currentTime = currentDate.getTime();

  for (const seasonId in seasons) {
    const season = seasons[seasonId];
    const startDate = new Date(season.startDate).getTime();
    const endDate = new Date(season.endDate).getTime();

    if (currentTime >= startDate && currentTime <= endDate) {
      currentlySeason.value = season;
      return season;
    }
  }

  return null;
};

const updateSelectedSeason = (season: { id: string; label: string }) => {
  fetchCalendarEventData(season.id).then(() => {
    initCalendarList();
  });
};

const subscribeToCalendar = (type: 'calendar' | 'event', seasonId: string, eventId?: string) => {
  switch (type) {
    case 'calendar':
      openICSFile('events.ics', seasonId);
      break;
    case 'event':
      if (eventId) {
        openICSFile('event.ics', seasonId, eventId);
      }
      break;
  }
};

const openICSFile = (url: string, season: string, eventId?: string) => {
  const params = new URLSearchParams({
    language: 'zh_CN',
    season: season,
    eventId: eventId || ''
  });

  window.open(`${http.location}calendar/${url}?${params.toString()}`);
};

const getEventName = (eventId: string) => {
  if (!selectSeasonsValue.value) return '';
  return t(`snb.calendar.${selectSeasonsValue.value.id}.data.${eventId}.name`, '');
};
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
          <p class="mt-1 text-caption" v-if="selectSeasonsValue && selectSeasonsValue.id">
            {{ selectSeasonsValue.id.toUpperCase() }}
          </p>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>

  <!-- 日历 头部 S -->
  <div class="bg-black">
    <v-container class="py-8">
      <v-row align="start">
        <v-col cols="12" sm="12" lg="6">
          <p class="opacity-80">
            {{ seasonDescription }}
          </p>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="auto">
          <v-btn-group size="55">
            <v-dialog max-width="500" v-if="selectSeasonsValue">
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
                        @click="subscribeToCalendar('calendar', selectSeasonsValue.id); isActive.value = false"
                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>

            <v-select
                tile
                :label="t('calendar.label.pastSeasons')"
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

            <v-btn @click="initCalendar" variant="elevated">
              <v-icon :class="[
                calendarLoading ?  'spin-icon-load' : ''
            ]" icon="mdi-refresh" size="20"/>
            </v-btn>
          </v-btn-group>
        </v-col>
      </v-row>
    </v-container>
  </div>
  <!-- 日历 头部 E -->

  <v-divider class="mb-5"></v-divider>

  <!-- 日历 内容 S -->
  <HorizontalScrollList v-if="!calendarLoading">
    <div class="position-relative">
      <div class="calendar-line" style="white-space: nowrap;">
        <div v-for="(monthData, monthKey) in formattedCalendar" :key="monthKey">
          <template v-if="monthData.eventCount > 0">
            <v-row no-gutters align="center">
              <v-avatar
                  size="55"
                  class="font-weight-bold text-h5"
                  :color="`var(--main-color)`"
                  style="color: hsl(from var(--main-color) h s calc(l * 0.3));"
              >
                {{ monthData.month }}
              </v-avatar>
              <v-col>
                <v-divider :color="`var(--main-color)`" :opacity="20"></v-divider>
              </v-col>
            </v-row>

            <div class="calendar-line-day">
              <div v-for="dayData in monthData.data" :key="dayData.day">
                <template v-if="dayData.events.length">
                  <v-btn block class="btn-flavor mt-4 w-100 font-weight-bold text-black">
                    {{ t('calendar.day', {day: dayData.day}) }}
                  </v-btn>

                  <div class="mr-3 pt-4">
                    <CalendarEventSLotWidget
                        :data="event"
                        :currentlySeason="seasons[selectSeasonsValue?.id]"
                        v-for="event in dayData.events"
                        :key="`${event.id}-${event.year}-${event.month}-${event.startDay}`">
                      <template v-slot:header-right-btn>
                        <v-dialog max-width="500" v-if="selectSeasonsValue">
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
                                    :currentlySeason="seasons[selectSeasonsValue.id]"
                                ></CalendarEventSLotWidget>
                              </div>

                              <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn
                                    :text="t('basic.button.submit')"
                                    @click="subscribeToCalendar('event', selectSeasonsValue.id, event.id); isActive.value = false"
                                ></v-btn>
                              </v-card-actions>
                            </v-card>
                          </template>
                        </v-dialog>
                      </template>
                    </CalendarEventSLotWidget>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </HorizontalScrollList>
  <!-- 日历 内容 E -->

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
