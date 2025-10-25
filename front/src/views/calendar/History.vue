<script setup lang="ts">
import {computed, onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";

import {Seasons} from "glow-prow-data";
import {http, time} from "@/assets/sripts";

import Loading from "@/components/Loading.vue";
import CalendarEventSLotWidget from "@/components/snbWidget/calendarEventSLotWidget.vue";
import {Season} from "glow-prow-data/src/entity/Seasons";
import Scrollbar from "smooth-scrollbar";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const {t, te} = useI18n(),
    {asString} = useI18nUtils()

let seasons = Seasons,

    // 赛季选择器
    selectSeasonsList = ref([]),
    selectSeasonsValue = ref(),

    // 赛季表单
    calendarLoading = ref(false),
    formattedCalendar: any = ref(),
    // 赛季日历事件数据
    seasonsCalendarEvents: any = ref(),
    // 当前赛季
    currentlySeason: Ref<Season> = ref(null),
    remainingDays = computed(() => getRemainingDays()),

    // 滚动器
    scrollbarRef = ref(null),
    scrollbarContainer: Ref<Scrollbar> = ref(null)

let isTransforming = false;

onMounted(async () => {
  // 初始当前赛季
  getCurrentSeason()
  // 读取当前赛季事件
  await getCalendarEventData()

  // 初始日历数据
  initCalendarList()
  // 初始滚动器
  initScroll()

  selectSeasonsValue.value = selectSeasonsList.value[selectSeasonsList.value.length - 1]
})

/**
 * 初始滚动
 */
const initScroll = () => {
  if (scrollbarRef.value) {
    scrollbarContainer.value = Scrollbar.init(scrollbarRef.value, {
      damping: 0.1,
      thumbMinSize: 20,
      renderByPixels: true,
      alwaysShowTracks: false,
      continuousScrolling: true,
      plugins: {
        horizontalScroll: {
          events: ['wheel', 'touch'],
        }
      }
    });

    scrollbarContainer.value.addListener((status) => {
      if (isTransforming) return;
      const deltaY = status.offset.y;

      if (deltaY !== 0) {
        isTransforming = true;

        scrollbar.setPosition(0, 0);
        scrollbar.contentEl.scrollLeft -= deltaY * 4;

        isTransforming = false;
      }
    });
  }
}

/**
 * 处理日历数据
 */
const initCalendarList = () => {
  // 初始赛季选择列表
  selectSeasonsList.value = Object.values(seasons).map(i => {
    let label = 'none',
        i18nText = `snb.seasons.${i.id}`

    if (onCheckI18nValue(i18nText).code == 0)
      label = onCheckI18nValue(i18nText).value

    return {id: i.id, label}
  }).filter(i => i.id != 'none')

  // 初始日历列表
  formattedCalendar.value = transformCalendarData(seasonsCalendarEvents.value);
}

/**
 * 处理日历
 * @param calendarData
 */
function transformCalendarData(calendarData: CalendarData): FormattedCalendar {
  const result: FormattedCalendar = {};

  // 收集所有涉及的年份和月份
  const yearMonthMap = new Map();

  // 首先遍历所有事件，收集涉及的年份和月份
  Object.values(calendarData.events).forEach((event) => {
    event.occurrences.forEach((occurrence) => {
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

  // 按年份和月份排序
  const sortedYearMonths = Array.from(yearMonthMap.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.month - b.month;
  });

  // 初始化结果结构
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

  // 处理每个事件
  Object.values(calendarData.events).forEach((event) => {
    // 对事件的发生日期按时间排序
    const sortedOccurrences = event.occurrences.sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1, a.day);
      const dateB = new Date(b.year, b.month - 1, b.day);
      return dateA.getTime() - dateB.getTime();
    });

    sortedOccurrences.forEach((occurrence) => {
      const monthKey = `${occurrence.year}-${occurrence.month}`;
      const startDay = occurrence.day;

      // 如果该月份不在结果中，跳过（理论上不会发生）
      if (!result[monthKey]) return;

      const daysInMonth = result[monthKey].data.length;
      const endDay = Math.min(
          startDay + event.duration - 1,
          daysInMonth
      );

      // 增加该月的事件计数
      result[monthKey].eventCount++;

      for (let day = startDay; day <= endDay; day++) {
        const dayData = result[monthKey].data.find(
            (d) => d.day === day
        );
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
}

/**
 * 获取日历数据
 */
const getCalendarEventData = async (seasonId: string) => {
  try {
    calendarLoading.value = true;
    const result = await http.get('calendar/data', {
          params: {
            season: seasonId || currentlySeason.value.id
          }
        }),
        d = result.data;
    if (result.error) throw new Error('Failed to load data');

    seasonsCalendarEvents.value = d.data;
    calendarLoading.value = false;
  } catch (err) {
    calendarLoading.value = false;
    return {}
  }
}

/**
 * 更新选择赛季日历
 */
const updateSelectSeason = (season) => {
  getCalendarEventData(season.id).then(() => {
    initCalendarList()
    initScroll()
  })
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
 */
function getRemainingDays(): number | null {
  let targetDate = seasons[selectSeasonsValue.value.id].endDate
  const endDate = new Date(targetDate);

  if (isNaN(endDate.getTime())) {
    console.error("Invalid date:", targetDate);
    return 0;
  }
  return time.calcRemainingDays(endDate)
}
</script>

<template>
  <template v-if="!calendarLoading">

    <!-- 头部 S -->
    <v-container class="calendar mt-10 mb-10">
      <h1 class="btn-flavor ships-title py-4 px-10 text-h3">日历</h1>
      <v-row align="end">
        <v-col v-if="currentlySeason && selectSeasonsValue && selectSeasonsValue.id" cols="12" sm="12" lg="6">
          <div class="mt-3">
            <div>
              <span class="text-amber mr-2 text-h3">{{ t(`snb.seasons.${selectSeasonsValue.id}`) || '-' }}</span>
              <span class="mr-2 text-h4">
             剩余 {{ remainingDays }} 天
            </span>
            </div>
            <p class="mt-1" v-if="selectSeasonsValue">{{ selectSeasonsValue.id.toString().toUpperCase() }}</p>
          </div>
          <p class="mt-2 opacity-80">{{ asString([`snb.calendar.${selectSeasonsValue.id}.description`], {backRawKey: false}) || '' }}</p>
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
                <v-card :title="`订阅 ${t(`snb.seasons.${selectSeasonsValue.id}`)}`">
                  <v-card-text class="opacity-80">
                    下载.ics文件，它是标准格式，通过支持应用打开，应用数据
                  </v-card-text>
                  <div class="w-100 background-flavor pt-4 pb-4">
                    <p class="text-amber text-h3 text-center">{{ t(`snb.seasons.${selectSeasonsValue.id}`) || '-' }}</p>
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
                label="过往赛季"
                variant="solo-filled"
                density="comfortable"
                item-value="id"
                item-title="label"
                min-width="150px"
                max-width="300px"
                @update:modelValue="(v) => updateSelectSeason(v)"
                v-model="selectSeasonsValue"
                :items="selectSeasonsList">
            </v-combobox>
          </v-btn-group>

        </v-col>
      </v-row>
    </v-container>
    <!-- 头部 E -->

    <div ref="scrollbarRef" class="position-relative">
      <div class="calendar-line" style="white-space: nowrap;">
        <div v-for="(m, monthKey) in formattedCalendar" :key="monthKey">
          <template v-if="m.eventCount > 0">
            <v-row no-gutters align="center">
              <v-avatar size="55" class="font-weight-bold text-h5" :color="`var(--main-color)`" style="color: hsl(from var(--main-color) h s calc(l * 0.3));">
                {{ m.month }}
              </v-avatar>
              <v-col>
                <v-divider :color="`var(--main-color)`" :opacity="20"></v-divider>
              </v-col>
            </v-row>

            <div class="calendar-line-day">
              <div v-for="d in m.data" :key="d.day">
                <template v-if="d.events.length">
                  <v-btn block class="btn-flavor mt-4 w-100 font-weight-bold text-black">
                    {{ d.day }}日
                  </v-btn>

                  <div class="mr-3 pt-4">
                    <CalendarEventSLotWidget
                        :data="event"
                        :currentlySeason="seasons[selectSeasonsValue.id]"
                        v-for="event in d.events"
                        :key="`${event.id}-${event.year}-${event.month}-${event.startDay}`">
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
                                <CalendarEventSLotWidget class="ma-auto"
                                                         :show-dropped="false"
                                                         :data="event"
                                                         :currentlySeason="seasons[selectSeasonsValue.id]"></CalendarEventSLotWidget>
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
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </template>
  <div class="calendar text-center" v-if="calendarLoading">
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
        margin-left: 0px;
      }
    }
  }
}
</style>
