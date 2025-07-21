<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Seasons} from "@skullandbonestools/snbdata";
import type {Season} from "@skullandbonestools/snbdata/dist/daos/seasons";

interface EventOccurrence {
  month: number;
  day: number;
}

interface CalendarEvent {
  id: string;
  name: string;
  description: string;
  duration: number;
  occurrences: EventOccurrence[];
}

interface CalendarData {
  events: {
    [key: string]: CalendarEvent;
  };
}

interface DayEvent {
  id: string;
  name: string;
  description: string;
  duration: number;
  isStart: boolean;
}

interface CalendarDay {
  day: number;
  events: DayEvent[];
}

interface FormattedCalendar {
  [month: string]: {
    data: CalendarDay[];
  };
}

const {t, te} = useI18n()

let seasons: Season[] = Seasons,

    // 赛季选择器
    selectSeasonsList = ref(),
    selectSeasonsValue = ref(),

    // 赛季表单
    formattedCalendar: any = ref(),
    // 赛季日历事件数据
    seasonsCalendarEvents: any = ref(),
    // 当前赛季
    currentlySeason: Ref<Season> = ref(null);

onMounted(async () => {
  // 初始当前赛季
  getCurrentSeason()
  // 读取当前赛季事件
  await getCalendarEventData()

  // 初始赛季选择列表
  selectSeasonsList.value = Object.values(seasons).map(i => {
    let label = 'none',
        i18nText = `snb.calendar.${i.id}.name`

    if (onCheckI18nValue(i18nText).code == 0)
      label = onCheckI18nValue(i18nText).value

    return {id: i.id, label}
  })
  selectSeasonsValue.value = selectSeasonsList.value[selectSeasonsList.value.length - 1]

  // 初始日历列表
  formattedCalendar.value = transformCalendarData(seasonsCalendarEvents.value);
})


/**
 * 处理日历
 * @param calendarData
 */
function transformCalendarData(calendarData: CalendarData): FormattedCalendar {
  const result: FormattedCalendar = {};

  // 初始化所有月份
  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
    result[month] = {
      data: Array.from({length: daysInMonth}, (_, i) => ({
        day: i + 1,
        events: [],
      })),
      month,
      eventCount: 0, // 初始化事件计数为0
    };
  }

  // 处理每个事件
  Object.values(calendarData.events).forEach((event) => {
    event.occurrences.forEach((occurrence) => {
      const monthKey = occurrence.month.toString();
      const startDay = occurrence.day;
      const endDay = Math.min(
          startDay + event.duration - 1,
          result[occurrence.month].data.length
      );

      // 增加该月的事件计数
      result[occurrence.month].eventCount++;

      for (let day = startDay; day <= endDay; day++) {
        const dayData = result[occurrence.month].data.find(
            (d) => d.day === day
        );
        if (dayData) {
          dayData.events.push({
            id: event.id,
            name: event.name,
            description: event.description,
            duration: event.duration,
            isStart: day === startDay,
          });
        }
      }
    });
  });

  return result;
}

/**
 * 获取日历数据
 */
const getCalendarEventData = async () => {
  try {
    const response = await fetch(`/data/calendar/${currentlySeason.value.id}/index.json`);
    if (!response.ok) throw new Error('Failed to load data');

    seasonsCalendarEvents.value = await response.json();
  } catch (err) {
    console.log(err)
    return {}
  }
}

/**
 * 获取当前赛季
 * @returns {Season | null} 当前赛季，如果不在任何赛季范围内则返回 null
 */
const getCurrentSeason = (): Season | null => {
  const currentDate = new Date(); // 获取当前日期
  const currentTime = currentDate.getTime(); // 转换为时间戳（毫秒）

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
}

/**
 * 检查翻译
 * @param key
 */
const onCheckI18nValue = (key) => {
  if (te(key)) {
    return {code: 0, value: t(key)};
  } else {
    return {code: -1}
  }
};

/**
 * 计算当前赛季剩余天数
 * @returns {number | null} 剩余天数，如果不在赛季内则返回 null
 */
function getRemainingDays(): number | null {
  const currentSeason = getCurrentSeason();
  if (!currentSeason) return null;

  const currentDate = new Date();
  const endDate = new Date(currentSeason.endDate);

  // 计算剩余毫秒数，并转换为天数
  const remainingTime = endDate.getTime() - currentDate.getTime();
  const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

  return remainingDays;
}
</script>

<template>
  <v-container class="calendar mt-10 mb-10">
    <h1 class="btn-flavor ships-title pt-8 pb-8 text-h2">日历</h1>
    <v-row align="end">
      <v-col v-if="currentlySeason">
        <div class="mt-3">
          <div>
            <span class="text-amber mr-2 text-h3">{{ t(`snb.calendar.${currentlySeason.id}.name`) || '-' }}</span>
            <span class="mr-2 text-h4">
             剩余 {{ getRemainingDays() }} 天
            </span>
          </div>
          <p class="mt-1" v-if="selectSeasonsValue">{{ selectSeasonsValue.id.toString().toUpperCase() }}</p>
        </div>
        <p class="mt-2 opacity-80">{{ t(`snb.calendar.${currentlySeason.id}.description`) || '-' }}</p>
      </v-col>
      <v-spacer></v-spacer>
      <div>
        <v-combobox
            label="过往赛季"
            item-value="id"
            item-title="label"
            min-width="300px"
            max-width="300px"
            v-model="selectSeasonsValue"
            :items="selectSeasonsList">
        </v-combobox>
      </div>
    </v-row>
  </v-container>

  <div class="calendar-line" v-if="currentlySeason && currentlySeason.id">
    <div v-for="(month, monthIndex) in formattedCalendar" :key="monthIndex">
      <template v-if="month.eventCount > 0">
        <v-row no-gutters align="center">
          <v-avatar :color="`var(--main-color)`">{{ month.month }}</v-avatar>
          <v-col>
            <v-divider :color="`var(--main-color)`" :opacity="20"></v-divider>
          </v-col>
        </v-row>

        <div class="calendar-line-day">
          <div v-for="day in month.data" :key="day">
            <template v-if="day.events.length">
              <v-btn elevation block class="btn-flavor mt-4 w-100 font-weight-bold">
                {{ day.day }}日
              </v-btn>

              <div class="mr-3 pt-4">
                <v-card v-for="event in day.events" :key="event" max-width="420" min-width="420" class="pa-2 mb-2 background-flavor">
                  <v-card border color="#000" class="pa-5">
                    <template v-slot:image>
                      <img src="../../assets/images/portal-banner-background.png">
                    </template>

                    <p class="text-amber text-h5"><b> {{ t(`snb.calendar.${currentlySeason.id}.data.${event.id}.name`) }}</b></p>

                    <template v-if="onCheckI18nValue(`snb.calendar.${currentlySeason.id}.data.${event.id}.description`).code == 0">
                      {{ t(`snb.calendar.${currentlySeason.id}.data.${event.id}.description`) }}
                    </template>
                  </v-card>
                </v-card>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="less">
.calendar-line {
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 400px;
  padding-bottom: 50px;
  display: flex;

  > div:first-child {
    margin-left: 50px;
  }

  .calendar-line-day {
    display: flex;
  }
}
</style>
