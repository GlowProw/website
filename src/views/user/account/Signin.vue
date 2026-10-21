<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Apis} from "@/assets/sripts/api";
import {useNoticeStore} from "~/stores/noticeStore";
import type {SigninCalendarDay, SigninRecord, SigninStatus} from "@/assets/types/Achievement";
import Loading from "@/components/Loading.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n(),
    notice = useNoticeStore(),
    api = Apis.accountGrowthApi()

const loading = ref(true),
    status = ref<SigninStatus | null>(null),
    records = ref<SigninRecord[]>([]),
    signingIn = ref(false),
    makingUp = ref(false),
    makeupDialog = ref(false),
    makeupDate = ref<string | null>(null)

// 一周从周一开始排列，与日历偏移计算保持一致
const weekdayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// 当月 1 号之前需要留空的格子数
const leadingBlanks = computed(() => {
  if (!status.value) return 0
  const year = Number(status.value.month.slice(0, 4))
  const month = Number(status.value.month.slice(5, 7))
  // getDay 以周日为 0，换算成以周一为 0
  const weekday = new Date(year, month - 1, 1).getDay()
  return (weekday + 6) % 7
})

// 服务端错误码对应的提示文案
const errorMessageKeys: Record<string, string> = {
  'signin.already': 'account.signin.message.already',
  'signin.invalidDate': 'account.signin.message.invalidDate',
  'signin.notCurrentMonth': 'account.signin.message.notCurrentMonth',
  'signin.noMakeupQuota': 'account.signin.message.noQuota'
}

/**
 * 把接口错误码转换成可读提示
 * @param e 接口抛出的错误
 */
const errorText = (e: any): string => {
  const key = errorMessageKeys[String(e?.code || '')]
  return key ? t(key) : (e?.message || t('account.signin.message.failed'))
}

/**
 * 读取签到状态与当月记录
 */
const onLoad = async () => {
  loading.value = true
  try {
    const [statusResult, recordsResult] = await Promise.all([
      api.getSigninStatus(),
      api.getSigninRecords()
    ])
    status.value = statusResult.data.data as SigninStatus
    records.value = (recordsResult.data.data as { records: SigninRecord[] }).records || []
  } catch (e: any) {
    notice.error(errorText(e))
  } finally {
    loading.value = false
  }
}

/**
 * 今日签到
 */
const onSignIn = async () => {
  if (signingIn.value) return
  signingIn.value = true
  try {
    const result = await api.signIn()
    const data = result.data.data as { points: number; streakDays: number; bonusMakeup: number }
    notice.success(t('account.signin.message.success', {points: data.points, streak: data.streakDays}))
    if (data.bonusMakeup) {
      notice.info(t('account.signin.message.bonusMakeup'))
    }
    await onLoad()
  } catch (e: any) {
    notice.error(errorText(e))
  } finally {
    signingIn.value = false
  }
}

/**
 * 点击日历中的空缺日期，打开补签确认框
 * @param day 日历单日状态
 */
const onPickMakeup = (day: SigninCalendarDay) => {
  if (day.signed || day.future) return
  makeupDate.value = day.date
  makeupDialog.value = true
}

/**
 * 确认补签
 */
const onMakeup = async () => {
  if (!makeupDate.value || makingUp.value) return
  makingUp.value = true
  try {
    await api.makeupSignin(makeupDate.value)
    notice.success(t('account.signin.message.makeupSuccess', {date: makeupDate.value}))
    makeupDialog.value = false
    await onLoad()
  } catch (e: any) {
    notice.error(errorText(e))
  } finally {
    makingUp.value = false
  }
}

/**
 * 平台展示名称
 * @param platform 平台标识
 */
const platformName = (platform: string | null): string => {
  if (!platform) return ''
  const key = `account.signin.platform.${platform}`
  return t(key)
}

/**
 * 平台图标
 * @param platform 平台标识
 */
const platformIcon = (platform: string): string => {
  if (platform === 'qq') return 'mdi-qqchat'
  return 'mdi-web'
}

/**
 * 日历日期的单元格样式
 * @param day 日历单日状态
 */
const dayClass = (day: SigninCalendarDay) => ({
  'calendar-day--signed': day.signed && day.type === 'normal',
  'calendar-day--makeup': day.signed && day.type === 'makeup',
  'calendar-day--future': day.future,
  'calendar-day--actionable': !day.signed && !day.future
})

onMounted(onLoad)

defineOptions({
  name: 'AccountCheckin'
})
</script>

<template>
  <v-row>
    <v-col cols="12" lg="3">
      <AffixContainerView>
        <!-- 签到概览 S -->
        <div>
          <v-row align="center" density="compact">
            <v-col cols="12" md>
              <p class="u"> {{ t('account.signin.title') }}</p>
              <div class="opacity-70 mb-4">
                {{ t('account.signin.subtitle', {streak: status.streakDays}) }}
              </div>

              <div class="d-flex flex-wrap ga-2">
                <v-chip color="amber" variant="tonal" prepend-icon="mdi-fire">
                  {{ t('account.signin.streakChip', {days: status.streakDays}) }}
                </v-chip>
                <v-chip color="amber-accent-3" variant="tonal" prepend-icon="mdi-star-four-points-outline">
                  {{ t('account.signin.pointsChip', {points: status.points}) }}
                </v-chip>
                <v-chip color="cyan" variant="tonal" prepend-icon="mdi-calendar-refresh">
                  {{ t('account.signin.makeupChip', {count: status.makeupRemaining}) }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" md="auto" class="d-flex justify-center">
              <v-btn v-if="!status.todaySigned"
                     color="amber"
                     size="large"
                     variant="flat"
                     block
                     class="px-10 font-weight-bold"
                     :loading="signingIn"
                     prepend-icon="mdi-calendar-check"
                     @click="onSignIn">
                {{ t('account.signin.sign') }}
              </v-btn>
              <v-btn v-else
                     color="amber"
                     size="large"
                     variant="tonal"
                     block
                     class="px-10 font-weight-bold"
                     disabled
                     prepend-icon="mdi-check-circle-outline">
                {{ t('account.signin.signed') }}
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5" opacity=".08"/>

          <v-row density="compact" class="text-body-2">
            <v-col cols="6" sm="6">
              <div class="opacity-60">{{ t('account.signin.makeupFree') }}</div>
              <div class="text-h6 font-weight-bold">{{ status.makeupFree }}</div>
            </v-col>
            <v-col cols="6" sm="6">
              <div class="opacity-60">{{ t('account.signin.contributorBonus') }}</div>
              <div class="text-h6 font-weight-bold">{{ status.contributorBonus }}</div>
            </v-col>
            <v-col cols="6" sm="6">
              <div class="opacity-60">{{ t('account.signin.streakBonus') }}</div>
              <div class="text-h6 font-weight-bold">{{ status.streakBonus }}</div>
            </v-col>
            <v-col cols="6" sm="6">
              <div class="opacity-60">{{ t('account.signin.makeupUsed') }}</div>
              <div class="text-h6 font-weight-bold">{{ status.makeupUsed }}</div>
            </v-col>
          </v-row>
        </div>
        <!-- 签到概览 E -->
      </AffixContainerView>
    </v-col>
    <v-col cols="12" lg="9">
      <Loading v-if="loading"/>

      <template v-else-if="status">
        <!-- 当月日历 S -->
        <AffixBoxHasTitleView class="rank-card">
          <template v-slot:title>
            <v-icon icon="mdi-calendar-month-outline" color="amber" class="mb-2"></v-icon>
            {{ status.month }}
          </template>

          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center ga-2">
              <span class="text-subtitle-1 font-weight-bold"></span>
            </div>
            <div class="d-flex align-center ga-3 text-caption opacity-70">
            <span class="d-flex align-center ga-1">
              <span class="legend-dot legend-dot--signed"></span>{{ t('account.signin.legend.normal') }}
            </span>
              <span class="d-flex align-center ga-1">
              <span class="legend-dot legend-dot--makeup"></span>{{ t('account.signin.legend.makeup') }}
            </span>
              <span class="d-flex align-center ga-1">
              <span class="legend-dot"></span>{{ t('account.signin.legend.unsign') }}
            </span>
            </div>
          </div>

          <div class="calendar-grid mb-2">
            <div v-for="key in weekdayKeys" :key="key" class="calendar-weekday">
              {{ t(`account.signin.weekdays.${key}`) }}
            </div>
          </div>

          <div class="calendar-grid">
            <div v-for="blank in leadingBlanks" :key="`blank-${blank}`"></div>
            <div v-for="day in status.calendar"
                 :key="day.date"
                 class="calendar-day"
                 :class="dayClass(day)"
                 :title="day.signed ? platformName(day.platform) : t('account.signin.legend.unsign')"
                 @click="onPickMakeup(day)">
              <span class="calendar-day__number">{{ Number(day.date.slice(8, 10)) }}</span>
              <v-icon v-if="day.signed" size="20" :style="{color: day.type === 'makeup' ? '#4dd0e1' : '#ffc107'}">
                {{ day.type === 'makeup' ? 'mdi-calendar-refresh' : 'mdi-check' }}
              </v-icon>
            </div>
          </div>

          <div class="text-caption opacity-60 mt-4">
            {{ t('account.signin.calendarTip') }}
          </div>
        </AffixBoxHasTitleView>
        <!-- 当月日历 E -->

        <!-- 签到记录 S -->
        <AffixBoxHasTitleView class="rank-card">
          <template v-slot:title>
            <v-icon icon="mdi-history" color="amber" class="mb-2"></v-icon>
            {{ t('account.signin.records.title') }}
          </template>

          <v-table v-if="records.length" density="compact" class="bg-transparent">
            <thead>
            <tr>
              <th>{{ t('account.signin.records.date') }}</th>
              <th>{{ t('account.signin.records.platform') }}</th>
              <th>{{ t('account.signin.records.type') }}</th>
              <th>{{ t('account.signin.records.points') }}</th>
              <th>{{ t('account.signin.records.streak') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="record in records" :key="record.id">
              <td>{{ record.date }}</td>
              <td>
                <div class="d-flex align-center ga-2">
                  <v-icon size="16">{{ platformIcon(record.platform) }}</v-icon>
                  <span>{{ platformName(record.platform) }}</span>
                </div>
              </td>
              <td>
                <v-chip size="x-small" :color="record.type === 'makeup' ? 'cyan' : 'amber'" variant="tonal">
                  {{ t(`account.signin.type.${record.type}`) }}
                </v-chip>
              </td>
              <td class="text-amber">+{{ record.points }}</td>
              <td>{{ record.streakDays }}</td>
            </tr>
            </tbody>
          </v-table>

          <div v-else class="text-body-2 opacity-60 py-6 text-center">
            {{ t('account.signin.records.empty') }}
          </div>
        </AffixBoxHasTitleView>
        <!-- 签到记录 E -->

        <!-- 补签确认 S -->
        <v-dialog v-model="makeupDialog" max-width="420">
          <v-card border rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold">
              {{ t('account.signin.makeupDialog.title') }}
            </v-card-title>
            <v-card-text class="text-body-2">
              {{ t('account.signin.makeupDialog.desc', {date: makeupDate, count: status.makeupRemaining}) }}
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="makeupDialog = false">{{ t('basic.button.cancel') }}</v-btn>
              <v-btn color="amber" variant="flat" :loading="makingUp" @click="onMakeup">
                {{ t('account.signin.makeupDialog.confirm') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- 补签确认 E -->
      </template>
    </v-col>
  </v-row>
</template>

<style scoped>
.rank-card {
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.calendar-weekday {
  text-align: center;
  font-size: 0.75rem;
  opacity: 0.5;
  padding-bottom: 4px;
}

.calendar-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 52px;
  border: 2px solid rgba(from var(--main-color) r g b / .04);
  background: rgba(from var(--main-color) r g b / .2);
  transition: all 0.2s ease;
}

.calendar-day__number {
  font-size: 0.85rem;
  opacity: 0.7;
}

.calendar-day--signed {
  border-color: rgba(255, 193, 7, 0.5);
  background: rgba(255, 193, 7, 0.12);
}

.calendar-day--signed .calendar-day__number {
  opacity: 1;
  font-weight: 600;
}

.calendar-day--makeup {
  border-color: rgba(77, 208, 225, 0.5);
  background: rgba(77, 208, 225, 0.12);
}

.calendar-day--future {
  opacity: 0.35;
}

.calendar-day--actionable {
  cursor: pointer;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.legend-dot--signed {
  background: #ffc107;
}

.legend-dot--makeup {
  background: #4dd0e1;
}
</style>
