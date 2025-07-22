<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Seasons} from "@skullandbonestools/snbdata";
import type {Season} from "@skullandbonestools/snbdata/dist/daos/seasons";
import {http} from "../../assets/sripts";
import Loading from "../../components/Loading.vue";
import CalendarEventSLotWidget from "../../components/v/calendarEventSLotWidget.vue";

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

let seasons: Seasons = Seasons,

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
    const result = await http.get('calendar/data', {
          params: {
            season: currentlySeason.value.id
          }
        }),
        d = result.data;
    if (result.error) throw new Error('Failed to load data');

    seasonsCalendarEvents.value = d.data;
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
 * 订阅日历
 * @param type
 * @param season
 * @param id
 */
const onSubscriptionCalendar = (type, season: string, id?: any) => {
  switch (type) {
    case 'calendar':
      onOpenICS('events.ics', season);
      break;
    case 'event':
      onOpenICS('event.ics', season, id);
      break;
  }
}

async function onOpenICS(url, season: string, id?: any) {
  window.open(`${http.location}calendar/${url}?language=zh_CN&season=${season}&eventId=${id}`);
}

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
      <v-col v-if="currentlySeason && selectSeasonsValue && selectSeasonsValue.id" cols="12" sm="12" lg="6">
        <div class="mt-3">
          <div>
            <span class="text-amber mr-2 text-h3">{{ t(`snb.calendar.${selectSeasonsValue.id}.name`) || '-' }}</span>
            <span class="mr-2 text-h4">
             剩余 {{ getRemainingDays() }} 天
            </span>
          </div>
          <p class="mt-1" v-if="selectSeasonsValue">{{ selectSeasonsValue.id.toString().toUpperCase() }}</p>
        </div>
        <p class="mt-2 opacity-80">{{ t(`snb.calendar.${selectSeasonsValue.id}.description`) || '-' }}</p>
      </v-col>
      <v-spacer></v-spacer>
      <v-col>
        <v-btn-group>
          <v-dialog max-width="500">
            <template v-slot:activator="{ props: activatorProps }">
              <v-btn :color="`var(--main-color)`"
                     v-bind="activatorProps"

                     min-width="150">
                订阅日历
              </v-btn>
            </template>

            <template v-slot:default="{ isActive }">
              <v-card :title="`订阅 ${t(`snb.calendar.${selectSeasonsValue.id}.name`)}`">
                <v-card-text class="opacity-80">
                  下载.ics文件，它是标准格式，通过支持应用打开，应用数据
                </v-card-text>
                <div class="w-100 background-flavor pt-4 pb-4">
                  <p class="text-amber text-h3 text-center">{{ t(`snb.calendar.${selectSeasonsValue.id}.name`) || '-' }}</p>
                </div>
                <v-card-actions>
                  <v-spacer></v-spacer>

                  <v-btn
                      :text="t('basic.button.submit')"
                      @click="onSubscriptionCalendar('calendar', selectSeasonsValue.id);isActive.value = false"
                  ></v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
          <v-combobox
              tile
              disabled
              label="过往赛季"
              variant="solo-filled"
              density="comfortable"
              item-value="id"
              item-title="label"
              min-width="150px"
              max-width="300px"
              v-model="selectSeasonsValue"
              :items="selectSeasonsList">
          </v-combobox>
        </v-btn-group>

      </v-col>
    </v-row>
  </v-container>

  <div class="calendar-line" v-if="currentlySeason && currentlySeason.id">
    <div v-for="(month, monthIndex) in formattedCalendar" :key="monthIndex">
      <template v-if="month.eventCount > 0">
        <v-row no-gutters align="center">
          <v-avatar size="55" class="font-weight-bold text-h5" :color="`var(--main-color)`" style="color: hsl(from var(--main-color) h s calc(l * 0.3));">
            {{ month.month }}
          </v-avatar>
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

                <CalendarEventSLotWidget :data="event" :currentlySeason="currentlySeason" v-for="event in day.events" :key="event">
                  <template v-slot:header-right-btn>
                    <v-dialog max-width="500">
                      <template v-slot:activator="{ props: activatorProps }">
                        <v-btn density="compact" v-bind="activatorProps"
                               @click="">添加到日历
                        </v-btn>
                      </template>

                      <template v-slot:default="{ isActive }">
                        <v-card :title="t(`snb.calendar.${selectSeasonsValue.id}.data.${event.id}.name`)">
                          <v-card-text>
                            单独订阅{{ t(`snb.calendar.${selectSeasonsValue.id}.data.${event.id}.name`) }}所有事件？
                          </v-card-text>
                          <div class="w-100 background-flavor pt-4 pb-4">
                            <CalendarEventSLotWidget class="ma-auto" :data="event" :currentlySeason="currentlySeason"></CalendarEventSLotWidget>
                          </div>

                          <v-card-actions>
                            <v-spacer></v-spacer>

                            <v-btn
                                :text="t('basic.button.submit')"
                                @click="onSubscriptionCalendar('event', selectSeasonsValue.id, event.id);isActive.value = false"
                            ></v-btn>
                          </v-card-actions>
                        </v-card>
                      </template>
                    </v-dialog>
                  </template>
                </CalendarEventSLotWidget>
                <!--                <v-card v-for="event in day.events" :key="event" max-width="420" min-width="420" class="pa-2 mb-2 background-flavor">-->
                <!--                  <v-card border color="hsl(from var(&#45;&#45;main-color) h s calc(l * 0.3))">-->
                <!--                    <template v-slot:image>-->
                <!--                      <img class="pointer-events-none" src="../../assets/images/portal-banner-background.png">-->
                <!--                    </template>-->
                <!--                    <template v-slot:title>-->
                <!--                      <v-row class="text-lg-body-1" style="min-height: 60px">-->
                <!--                        <v-col>-->
                <!--                          <v-icon icon="mdi-calendar-badge"></v-icon>-->
                <!--                        </v-col>-->
                <!--                        <v-col align="right">-->
                <!--                          <v-dialog max-width="500">-->
                <!--                            <template v-slot:activator="{ props: activatorProps }">-->
                <!--                              <v-btn density="compact" v-bind="activatorProps"-->
                <!--                                     @click="">添加到日历-->
                <!--                              </v-btn>-->
                <!--                            </template>-->

                <!--                            <template v-slot:default="{ isActive }">-->
                <!--                              <v-card title="">-->
                <!--                                <v-card-text>-->
                <!--                                  下载.ics文件，它是标准格式，通过支持应用打开，应用数据-->
                <!--                                </v-card-text>-->

                <!--                                <v-card-actions>-->
                <!--                                  <v-spacer></v-spacer>-->

                <!--                                  <v-btn-->
                <!--                                      :text="t('basic.button.submit')"-->
                <!--                                      @click="onSubscriptionCalendar('event', selectSeasonsValue.id, event.id);isActive.value = false"-->
                <!--                                  ></v-btn>-->
                <!--                                </v-card-actions>-->
                <!--                              </v-card>-->
                <!--                            </template>-->
                <!--                          </v-dialog>-->

                <!--                        </v-col>-->
                <!--                      </v-row>-->
                <!--                    </template>-->

                <!--                    <div class="bg-black pa-5 background-flavor pointer-events-none">-->
                <!--                      <p class="text-amber text-h5"><b> {{ t(`snb.calendar.${currentlySeason.id}.data.${event.id}.name`) }}</b></p>-->

                <!--                      <p class="text-pre-wrap mt-1 opacity-80">-->
                <!--                        <template v-if="onCheckI18nValue(`snb.calendar.${currentlySeason.id}.data.${event.id}.description`).code == 0">-->
                <!--                          {{ t(`snb.calendar.${currentlySeason.id}.data.${event.id}.description`) }}-->
                <!--                        </template>-->
                <!--                      </p>-->
                <!--                    </div>-->
                <!--                  </v-card>-->
                <!--                </v-card>-->
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
  <div class="calendar-line" v-else>
    <v-card min-height="400" class="ma-auto" variant="text">
      <Loading size="100" class="mt-50"></Loading>
    </v-card>
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
        margin-left: 0px;
      }
    }
  }
}
</style>
