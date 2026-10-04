<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ReminderAdvanceUnit, ReminderIntervalUnit, ReminderRepeatType, ReminderScheduleType, ReminderTask, ReminderValidityType } from '@/assets/types/Reminder';
import { getLocalizedText } from '@/assets/sripts/reminder_calc';
import { REMINDER_PRESETS } from '@/config/reminderPresets';

const props = defineProps<{
  modelValue: boolean;
  editTask: ReminderTask | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', taskData: any): void;
}>();

const { t, te } = useI18n();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const isEditing = computed(() => !!props.editTask?.id);

// 表单输入项状态
const formTitle = ref('');
const formCategories = ref<string[]>([]);
const formScheduleType = ref<ReminderScheduleType>('repeat');
const formRepeatType = ref<ReminderRepeatType>('weekly');
const formRepeatDays = ref<number[]>([1, 2, 3, 4, 5, 6, 7]);
const formRepeatTime = ref('14:00');
const formIntervalUnit = ref<ReminderIntervalUnit>('hour');
const formIntervalValue = ref<number>(1);
const formIntervalHours = ref(1);
const formTargetDate = ref('');
const formTargetTime = ref('12:00');
const formNote = ref('');
const formEnabled = ref(true);
const formNotifyEnabled = ref(true); // 是否通知（默认是）

const availableCategories = computed(() => [
  { value: 'favorite', label: t('reminder.categories.favorite'), icon: 'mdi-heart', color: 'pink-lighten-1' },
  { value: 'activity', label: t('reminder.categories.activity'), icon: 'mdi-sword-cross', color: 'amber' },
  { value: 'system', label: t('reminder.categories.system'), icon: 'mdi-cog-outline', color: 'blue-lighten-2' }
]);

const toggleCategory = (cat: string) => {
  if (formCategories.value.includes(cat)) {
    formCategories.value = formCategories.value.filter(c => c !== cat);
  } else {
    formCategories.value.push(cat);
  }
};

// 提前提醒状态
const formAdvanceNoticeEnabled = ref(false);
const formAdvanceOption = ref<'30s' | '1m' | '5m' | '10m' | '30m' | '1h' | 'custom'>('1m');
const formAdvanceUnit = ref<ReminderAdvanceUnit>('minute');
const formAdvanceValue = ref<number>(1);
const formAdvanceMinutes = ref<number>(1);

const getAdvanceUnitLabel = (unit: ReminderAdvanceUnit) => {
  const key = `reminder.units.${unit}`;
  if (te(key)) return t(key);
  return unit === 'second' ? '秒' : unit === 'hour' ? '小时' : '分钟';
};

const updateCalculatedAdvanceMinutes = () => {
  const val = formAdvanceValue.value || 0;
  if (formAdvanceUnit.value === 'second') {
    formAdvanceMinutes.value = val / 60;
  } else if (formAdvanceUnit.value === 'hour') {
    formAdvanceMinutes.value = val * 60;
  } else {
    formAdvanceMinutes.value = val;
  }
};

// 任务有效期状态
const formValidityType = ref<ReminderValidityType>('permanent');
const formValidFromDate = ref('');
const formValidFromTime = ref('00:00');
const formValidToDate = ref('');
const formValidToTime = ref('23:59');

const MAX_NOTE_LENGTH = 5000;

const weekdays = [
  { day: 1, label: 'reminder.weekdays.mon' },
  { day: 2, label: 'reminder.weekdays.tue' },
  { day: 3, label: 'reminder.weekdays.wed' },
  { day: 4, label: 'reminder.weekdays.thu' },
  { day: 5, label: 'reminder.weekdays.fri' },
  { day: 6, label: 'reminder.weekdays.sat' },
  { day: 7, label: 'reminder.weekdays.sun' }
];

const intervalUnits: { unit: ReminderIntervalUnit; label: string }[] = [
  { unit: 'day', label: 'reminder.units.day' },
  { unit: 'hour', label: 'reminder.units.hour' },
  { unit: 'minute', label: 'reminder.units.minute' },
  { unit: 'second', label: 'reminder.units.second' }
];

const getUnitLabel = (unit: ReminderIntervalUnit) => {
  const key = `reminder.units.${unit}`;
  if (te(key)) return t(key);
  return unit;
};

// 初始化默认有效期时间（开始为今天当前时分，截止为 30 天后 23:59）
const initDefaultValidityDates = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  formValidFromDate.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  formValidFromTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const future = new Date();
  future.setDate(future.getDate() + 30);
  formValidToDate.value = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`;
  formValidToTime.value = '23:59';
};

// 切换提前提醒预设选项
const onSelectAdvanceOption = (opt: '30s' | '1m' | '5m' | '10m' | '30m' | '1h' | 'custom') => {
  formAdvanceOption.value = opt;
  if (opt === '30s') {
    formAdvanceUnit.value = 'second';
    formAdvanceValue.value = 30;
  } else if (opt === '1m') {
    formAdvanceUnit.value = 'minute';
    formAdvanceValue.value = 1;
  } else if (opt === '5m') {
    formAdvanceUnit.value = 'minute';
    formAdvanceValue.value = 5;
  } else if (opt === '10m') {
    formAdvanceUnit.value = 'minute';
    formAdvanceValue.value = 10;
  } else if (opt === '30m') {
    formAdvanceUnit.value = 'minute';
    formAdvanceValue.value = 30;
  } else if (opt === '1h') {
    formAdvanceUnit.value = 'hour';
    formAdvanceValue.value = 1;
  } else if (opt === 'custom') {
    if (!formAdvanceValue.value || formAdvanceValue.value <= 0) {
      formAdvanceValue.value = 15;
      formAdvanceUnit.value = 'minute';
    }
  }
  updateCalculatedAdvanceMinutes();
};

// 快捷设置有效期开始为当前时间
const setValidFromNow = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  formValidFromDate.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  formValidFromTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

// 快捷设置有效期截止时间偏移天数
const setValidToOffset = (days: number) => {
  const base = formValidFromDate.value ? new Date(`${formValidFromDate.value}T${formValidFromTime.value || '00:00'}:00`) : new Date();
  const future = isNaN(base.getTime()) ? new Date() : new Date(base.getTime());
  future.setDate(future.getDate() + days);
  const pad = (n: number) => n.toString().padStart(2, '0');
  formValidToDate.value = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`;
  formValidToTime.value = '23:59';
};

// 初始化或重置表单内容
const resetForm = () => {
  if (props.editTask) {
    // 编辑现有任务
    formTitle.value = getLocalizedText(props.editTask.title) || (props.editTask.titleKey && te(props.editTask.titleKey) ? t(props.editTask.titleKey) : '');

    formCategories.value = Array.isArray(props.editTask.categories) ? [...props.editTask.categories] : [];
    formScheduleType.value = props.editTask.scheduleType || 'repeat';
    formRepeatType.value = props.editTask.repeatType || 'weekly';
    formRepeatDays.value = Array.isArray(props.editTask.repeatDays) ? [...props.editTask.repeatDays] : [1, 2, 3, 4, 5, 6, 7];
    formRepeatTime.value = props.editTask.repeatTime || '14:00';
    formIntervalUnit.value = props.editTask.repeatIntervalUnit || 'hour';
    formIntervalValue.value = props.editTask.repeatIntervalValue ?? props.editTask.repeatIntervalHours ?? 1;
    formIntervalHours.value = props.editTask.repeatIntervalHours || 1;

    // 提前提醒字段回填
    formAdvanceNoticeEnabled.value = !!props.editTask.advanceNoticeEnabled;
    const advUnit = props.editTask.advanceUnit || 'minute';
    const advVal = props.editTask.advanceValue ?? (props.editTask.advanceMinutes !== undefined ? props.editTask.advanceMinutes : 1);
    formAdvanceUnit.value = advUnit;
    formAdvanceValue.value = advVal;

    if (advUnit === 'second' && advVal === 30) formAdvanceOption.value = '30s';
    else if (advUnit === 'minute' && advVal === 1) formAdvanceOption.value = '1m';
    else if (advUnit === 'minute' && advVal === 5) formAdvanceOption.value = '5m';
    else if (advUnit === 'minute' && advVal === 10) formAdvanceOption.value = '10m';
    else if (advUnit === 'minute' && advVal === 30) formAdvanceOption.value = '30m';
    else if (advUnit === 'hour' && advVal === 1) formAdvanceOption.value = '1h';
    else formAdvanceOption.value = 'custom';

    updateCalculatedAdvanceMinutes();

    // 有效期字段回填
    formValidityType.value = props.editTask.validityType || 'permanent';
    if (props.editTask.validFrom) {
      const fromStr = typeof props.editTask.validFrom === 'string' ? props.editTask.validFrom.replace(' ', 'T') : props.editTask.validFrom;
      const d = new Date(fromStr);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        formValidFromDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        formValidFromTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else {
        initDefaultValidityDates();
      }
    } else {
      initDefaultValidityDates();
    }

    if (props.editTask.validTo) {
      const toStr = typeof props.editTask.validTo === 'string' ? props.editTask.validTo.replace(' ', 'T') : props.editTask.validTo;
      const d = new Date(toStr);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        formValidToDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        formValidToTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }

    formNote.value = getLocalizedText(props.editTask.note || props.editTask.description) || (props.editTask.noteKey && te(props.editTask.noteKey) ? t(props.editTask.noteKey) : '');

    formEnabled.value = props.editTask.enabled ?? true;
    formNotifyEnabled.value = props.editTask.notifyEnabled ?? true;

    if (props.editTask.targetTime) {
      const d = new Date(props.editTask.targetTime);
      if (!isNaN(d.getTime())) {
        formTargetDate.value = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        formTargetTime.value = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
    } else {
      initDefaultTargetDate();
    }
  } else {
    // 新建任务
    formTitle.value = '';
    formCategories.value = [];
    formScheduleType.value = 'repeat';
    formRepeatType.value = 'weekly';
    formRepeatDays.value = [1, 2, 3, 4, 5, 6, 7];
    formRepeatTime.value = '14:00';
    formIntervalUnit.value = 'hour';
    formIntervalValue.value = 1;
    formIntervalHours.value = 1;
    formAdvanceNoticeEnabled.value = false;
    formAdvanceOption.value = '1m';
    formAdvanceUnit.value = 'minute';
    formAdvanceValue.value = 1;
    formAdvanceMinutes.value = 1;
    formValidityType.value = 'permanent';
    formNote.value = '';
    formEnabled.value = true;
    formNotifyEnabled.value = true;
    initDefaultTargetDate();
    initDefaultValidityDates();
  }
};

const initDefaultTargetDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  formTargetDate.value = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
  formTargetTime.value = '12:00';
};

watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm();
  }
});

// 选择或取消某个星期
const toggleDay = (day: number) => {
  if (formRepeatDays.value.includes(day)) {
    if (formRepeatDays.value.length > 1) {
      formRepeatDays.value = formRepeatDays.value.filter(d => d !== day);
    }
  } else {
    formRepeatDays.value = [...formRepeatDays.value, day].sort();
  }
};

const selectAllDays = () => {
  formRepeatDays.value = [1, 2, 3, 4, 5, 6, 7];
};

const selectWorkdays = () => {
  formRepeatDays.value = [1, 2, 3, 4, 5];
};

const selectWeekends = () => {
  formRepeatDays.value = [6, 7];
};

// 获取预设名称国际化展示
const getPresetTitle = (preset: typeof REMINDER_PRESETS[0]) => {
  return getLocalizedText(preset.title) || (preset.titleKey && te(preset.titleKey) ? t(preset.titleKey) : '');
};

// 点击预设快速填充到表单
const applyPreset = (preset: typeof REMINDER_PRESETS[0]) => {
  formTitle.value = getLocalizedText(preset.title) || (preset.titleKey && te(preset.titleKey) ? t(preset.titleKey) : '');
  formCategories.value = Array.isArray(preset.categories) ? [...preset.categories] : ['activity'];
  formScheduleType.value = preset.scheduleType;
  formRepeatType.value = preset.repeatType;
  if (preset.repeatDays) formRepeatDays.value = [...preset.repeatDays];
  if (preset.repeatTime) formRepeatTime.value = preset.repeatTime;
  if (preset.repeatIntervalUnit) formIntervalUnit.value = preset.repeatIntervalUnit;
  if (preset.repeatIntervalValue !== undefined) {
    formIntervalValue.value = preset.repeatIntervalValue;
  } else if (preset.repeatIntervalHours !== undefined) {
    formIntervalValue.value = preset.repeatIntervalHours;
    formIntervalUnit.value = 'hour';
  }
  if (preset.repeatIntervalHours) formIntervalHours.value = preset.repeatIntervalHours;

  formAdvanceNoticeEnabled.value = !!preset.advanceNoticeEnabled;
  const advUnit = preset.advanceUnit || 'minute';
  const advVal = preset.advanceValue ?? (preset.advanceMinutes !== undefined ? preset.advanceMinutes : 1);
  formAdvanceUnit.value = advUnit;
  formAdvanceValue.value = advVal;

  if (advUnit === 'second' && advVal === 30) formAdvanceOption.value = '30s';
  else if (advUnit === 'minute' && advVal === 1) formAdvanceOption.value = '1m';
  else if (advUnit === 'minute' && advVal === 5) formAdvanceOption.value = '5m';
  else if (advUnit === 'minute' && advVal === 10) formAdvanceOption.value = '10m';
  else if (advUnit === 'minute' && advVal === 30) formAdvanceOption.value = '30m';
  else if (advUnit === 'hour' && advVal === 1) formAdvanceOption.value = '1h';
  else formAdvanceOption.value = 'custom';

  updateCalculatedAdvanceMinutes();

  formValidityType.value = preset.validityType || 'permanent';
  formNotifyEnabled.value = preset.notifyEnabled ?? true;
  formNote.value = getLocalizedText(preset.note || preset.description) || (preset.noteKey && te(preset.noteKey) ? t(preset.noteKey) : '');
};

// 校验表单是否填写完整
const isValid = computed(() => {
  if (!formTitle.value.trim()) return false;
  if (formNote.value.length > MAX_NOTE_LENGTH) return false;

  if (formScheduleType.value === 'repeat') {
    if (formRepeatType.value === 'weekly') {
      if (formRepeatDays.value.length === 0) return false;
      if (!formRepeatTime.value) return false;
    } else if (formRepeatType.value === 'interval') {
      if (!formIntervalValue.value || formIntervalValue.value <= 0) return false;
    }
  } else if (formScheduleType.value === 'once') {
    if (!formTargetDate.value || !formTargetTime.value) return false;
  }

  if (formAdvanceNoticeEnabled.value) {
    if (!formAdvanceValue.value || formAdvanceValue.value <= 0) return false;
  }

  if (formValidityType.value === 'range') {
    if (!formValidFromDate.value || !formValidFromTime.value || !formValidToDate.value || !formValidToTime.value) {
      return false;
    }
    const fromTime = new Date(`${formValidFromDate.value}T${formValidFromTime.value}:00`).getTime();
    const toTime = new Date(`${formValidToDate.value}T${formValidToTime.value}:00`).getTime();
    if (isNaN(fromTime) || isNaN(toTime) || fromTime >= toTime) {
      return false;
    }
  }

  return true;
});

// 提交保存
const onSave = () => {
  if (!isValid.value) return;

  let targetTimestamp: number | undefined = undefined;
  if (formScheduleType.value === 'once') {
    const combinedStr = `${formTargetDate.value}T${formTargetTime.value}:00`;
    targetTimestamp = new Date(combinedStr).getTime();
  }

  const payload: Partial<ReminderTask> = {
    title: formTitle.value.trim(),
    categories: formCategories.value.length > 0 ? [...formCategories.value] : [],
    scheduleType: formScheduleType.value,
    repeatType: formScheduleType.value === 'repeat' ? formRepeatType.value : undefined,
    repeatDays: (formScheduleType.value === 'repeat' && formRepeatType.value === 'weekly') ? formRepeatDays.value : undefined,
    repeatTime: (formScheduleType.value === 'repeat' && formRepeatType.value === 'weekly') ? formRepeatTime.value : undefined,
    repeatIntervalUnit: (formScheduleType.value === 'repeat' && formRepeatType.value === 'interval') ? formIntervalUnit.value : undefined,
    repeatIntervalValue: (formScheduleType.value === 'repeat' && formRepeatType.value === 'interval') ? Number(formIntervalValue.value) : undefined,
    repeatIntervalHours: (formScheduleType.value === 'repeat' && formRepeatType.value === 'interval' && formIntervalUnit.value === 'hour') ? Number(formIntervalValue.value) : undefined,
    targetTime: targetTimestamp,
    advanceNoticeEnabled: formAdvanceNoticeEnabled.value,
    advanceUnit: formAdvanceNoticeEnabled.value ? formAdvanceUnit.value : undefined,
    advanceValue: formAdvanceNoticeEnabled.value ? Number(formAdvanceValue.value) : undefined,
    advanceMinutes: formAdvanceNoticeEnabled.value ? (formAdvanceUnit.value === 'second' ? Number(formAdvanceValue.value) / 60 : formAdvanceUnit.value === 'hour' ? Number(formAdvanceValue.value) * 60 : Number(formAdvanceValue.value)) : undefined,
    validityType: formValidityType.value,
    validFrom: (formValidityType.value === 'range' && formValidFromDate.value && formValidFromTime.value)
      ? `${formValidFromDate.value} ${formValidFromTime.value}`
      : undefined,
    validTo: (formValidityType.value === 'range' && formValidToDate.value && formValidToTime.value)
      ? `${formValidToDate.value} ${formValidToTime.value}`
      : undefined,
    note: formNote.value,
    enabled: formEnabled.value,
    notifyEnabled: formNotifyEnabled.value,
    // 用户手动编辑后转为自定义任务
    isPreset: false,
    titleKey: undefined,
    noteKey: undefined,
    descKey: undefined
  };

  emit('save', payload);
  visible.value = false;
};
</script>

<template>
  <v-dialog v-model="visible" max-width="660" scrollable>
    <v-card class="reminder-edit-card border">
      <v-toolbar color="surface" density="comfortable" class="border-b">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          {{ isEditing ? t('reminder.edit') : t('reminder.createNew') }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="visible = false"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-5">
        <!-- 预设快捷填入，仅在新建时展示 -->
        <div v-if="!isEditing" class="mb-5">
          <div class="text-caption opacity-60 mb-2">{{ t('reminder.presets.title') }}</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
                v-for="preset in REMINDER_PRESETS"
                :key="preset.id"
                size="small"
                variant="tonal"
                color="amber"
                prepend-icon="mdi-lightning-bolt"
                @click="applyPreset(preset)">
              {{ getPresetTitle(preset) }}
            </v-chip>
          </div>
        </div>

        <!-- 活动标题输入 -->
        <div class="mb-4">
          <label class="text-caption font-weight-bold d-block mb-1">
            {{ t('reminder.fields.title') }} <span class="text-error">*</span>
          </label>
          <v-text-field
              v-model="formTitle"
              :placeholder="t('reminder.fields.titlePlaceholder')"
              variant="outlined"
              density="compact"
              hide-details
              counter="100"
              maxlength="100"
              prepend-inner-icon="mdi-format-title">
          </v-text-field>
        </div>

        <!-- 任务分类选择 -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-caption font-weight-bold single-line">
              {{ t('reminder.categories.title') }}
            </label>
            <span class="text-caption opacity-60">({{ t('basic.optional') }})</span>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
                v-for="cat in availableCategories"
                :key="cat.value"
                filter
                :variant="formCategories.includes(cat.value) ? 'flat' : 'outlined'"
                :color="cat.color"
                class="cursor-pointer font-weight-medium"
                @click="toggleCategory(cat.value)">
              <v-icon :icon="cat.icon" size="14" class="mr-1"></v-icon>
              {{ cat.label }}
            </v-chip>
          </div>
        </div>

        <!-- 计划类型选择 -->
        <div class="mb-4">
          <label class="text-caption font-weight-bold d-block mb-1">
            {{ t('reminder.fields.type') }} <span class="text-error">*</span>
          </label>
          <v-btn-toggle
              v-model="formScheduleType"
              mandatory
              color="amber"
              variant="outlined"
              density="compact"
              divided
              class="w-100 mb-2">
            <v-btn value="repeat" class="flex-grow-1" prepend-icon="mdi-repeat">
              {{ t('reminder.fields.typeRepeat') }}
            </v-btn>
            <v-btn value="once" class="flex-grow-1" prepend-icon="mdi-numeric-1-circle-outline">
              {{ t('reminder.fields.typeOnce') }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <!-- 周期循环配置 -->
        <v-card variant="tonal" v-if="formScheduleType === 'repeat'"
             class="mb-4 pa-3">
          <!-- 循环方式切换 -->
          <div class="mb-3">
            <label class="text-caption font-weight-bold d-block mb-1">
              {{ t('reminder.fields.repeatType') }}
            </label>
            <v-radio-group v-model="formRepeatType" inline density="compact" hide-details>
              <v-radio :label="t('reminder.fields.repeatWeekly')" value="weekly" color="amber"></v-radio>
              <v-radio :label="t('reminder.fields.repeatInterval')" value="interval" color="amber"></v-radio>
            </v-radio-group>
          </div>

          <!-- 按星期几循环 -->
          <div v-if="formRepeatType === 'weekly'" class="mb-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <label class="text-caption font-weight-bold">
                {{ t('reminder.fields.repeatDays') }}
              </label>
              <div class="ga-1 d-flex">
                <v-btn size="x-small" variant="text" @click="selectAllDays">{{ t('reminder.dialog.selectAll') }}</v-btn>
                <v-btn size="x-small" variant="text" @click="selectWorkdays">{{ t('reminder.dialog.workdays') }}</v-btn>
                <v-btn size="x-small" variant="text" @click="selectWeekends">{{ t('reminder.dialog.weekends') }}</v-btn>
              </div>
            </div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                  v-for="w in weekdays"
                  :key="w.day"
                  size="small"
                  :variant="formRepeatDays.includes(w.day) ? 'elevated' : 'outlined'"
                  :color="formRepeatDays.includes(w.day) ? 'amber' : ''"
                  filter
                  @click="toggleDay(w.day)">
                {{ t(w.label) }}
              </v-chip>
            </div>

            <!-- 时间选择 (HH:mm) -->
            <div class="mt-4">
              <label class="text-caption font-weight-bold d-block mb-1">
                {{ t('reminder.fields.repeatTime') }} ({{ t('reminder.dialog.systemTime') }})
              </label>
              <v-text-field
                  v-model="formRepeatTime"
                  type="time"
                  variant="outlined"
                  density="compact"
                  hide-details
                  prepend-inner-icon="mdi-clock-outline">
              </v-text-field>
            </div>
          </div>

          <!-- 按固定间隔循环 (支持：天 / 小时 / 分钟 / 秒) -->
          <div v-else-if="formRepeatType === 'interval'" class="mb-2">
            <label class="text-caption font-weight-bold d-block mb-1">
              {{ t('reminder.fields.repeatIntervalHours') }}
            </label>
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-chip
                  v-for="u in intervalUnits"
                  :key="u.unit"
                  size="small"
                  :variant="formIntervalUnit === u.unit ? 'elevated' : 'outlined'"
                  :color="formIntervalUnit === u.unit ? 'amber' : ''"
                  @click="formIntervalUnit = u.unit">
                {{ t(u.label) }}
              </v-chip>
            </div>
            <v-row align="center" no-gutters>
              <v-col cols="6">
                <v-text-field
                    v-model.number="formIntervalValue"
                    type="number"
                    min="1"
                    :step="formIntervalUnit === 'hour' ? 0.5 : 1"
                    variant="outlined"
                    density="compact"
                    hide-details
                    prepend-inner-icon="mdi-timer-sand"
                    :suffix="getUnitLabel(formIntervalUnit)">
                </v-text-field>
              </v-col>
              <v-col cols="6" class="pl-3 text-caption opacity-70">
                {{ t('reminder.fields.everyNUnits', { n: formIntervalValue || 1, unit: getUnitLabel(formIntervalUnit) }) }}
              </v-col>
            </v-row>
          </div>
        </v-card>

        <!-- 一次性截止时间配置 -->
        <v-card variant="tonal" v-else-if="formScheduleType === 'once'"
                class="mb-4 pa-3">
          <label class="text-caption font-weight-bold d-block mb-2">
            {{ t('reminder.fields.targetTime') }}
          </label>
          <v-row no-gutters class="ga-2">
            <v-col>
              <v-text-field
                  v-model="formTargetDate"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                  prepend-inner-icon="mdi-calendar">
              </v-text-field>
            </v-col>
            <v-col>
              <v-text-field
                  v-model="formTargetTime"
                  type="time"
                  variant="outlined"
                  density="compact"
                  hide-details
                  prepend-inner-icon="mdi-clock-outline">
              </v-text-field>
            </v-col>
          </v-row>
        </v-card>

        <!-- 提前提醒配置 -->
        <v-card variant="tonal" class="mb-4 pa-3">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption font-weight-bold">{{ t('reminder.fields.advanceNotice') }}</div>
              <div class="text-caption opacity-60">{{ t('reminder.fields.advanceNoticeDesc') }}</div>
            </div>
            <v-switch
                v-model="formAdvanceNoticeEnabled"
                hide-details
                density="compact"
                inset
                color="amber">
            </v-switch>
          </div>

          <!-- 提前选项列表 -->
          <div v-if="formAdvanceNoticeEnabled" class="mt-3 pt-3 border-t">
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-chip
                  size="small"
                  :variant="formAdvanceOption === '30s' ? 'elevated' : 'outlined'"
                  :color="formAdvanceOption === '30s' ? 'amber' : ''"
                  @click="onSelectAdvanceOption('30s')">
                {{ t('reminder.fields.advanceOptions.30s', '提前 30 秒') }}
              </v-chip>
              <v-chip
                  size="small"
                  :variant="formAdvanceOption === '1m' ? 'elevated' : 'outlined'"
                  :color="formAdvanceOption === '1m' ? 'amber' : ''"
                  @click="onSelectAdvanceOption('1m')">
                {{ t('reminder.fields.advanceOptions.1m') }}
              </v-chip>
              <v-chip
                  size="small"
                  :variant="formAdvanceOption === '5m' ? 'elevated' : 'outlined'"
                  :color="formAdvanceOption === '5m' ? 'amber' : ''"
                  @click="onSelectAdvanceOption('5m')">
                {{ t('reminder.fields.advanceOptions.5m') }}
              </v-chip>
              <v-chip
                  size="small"
                  :variant="formAdvanceOption === '10m' ? 'elevated' : 'outlined'"
                  :color="formAdvanceOption === '10m' ? 'amber' : ''"
                  @click="onSelectAdvanceOption('10m')">
                {{ t('reminder.fields.advanceOptions.10m') }}
              </v-chip>
              <v-chip
                  size="small"
                  :variant="formAdvanceOption === '30m' ? 'elevated' : 'outlined'"
                  :color="formAdvanceOption === '30m' ? 'amber' : ''"
                  @click="onSelectAdvanceOption('30m')">
                {{ t('reminder.fields.advanceOptions.30m') }}
              </v-chip>
              <v-chip
                  size="small"
                  :variant="formAdvanceOption === '1h' ? 'elevated' : 'outlined'"
                  :color="formAdvanceOption === '1h' ? 'amber' : ''"
                  @click="onSelectAdvanceOption('1h')">
                {{ t('reminder.fields.advanceOptions.1h', '提前 1 小时') }}
              </v-chip>
              <v-chip
                  size="small"
                  :variant="formAdvanceOption === 'custom' ? 'elevated' : 'outlined'"
                  :color="formAdvanceOption === 'custom' ? 'amber' : ''"
                  @click="onSelectAdvanceOption('custom')">
                {{ t('reminder.fields.advanceOptions.custom') }}
              </v-chip>
            </div>

            <!-- 自定义提前数值与单位输入 -->
            <div v-if="formAdvanceOption === 'custom'" class="mt-2">
              <v-row align="center" no-gutters class="ga-2">
                <v-col cols="6">
                  <v-text-field
                      v-model.number="formAdvanceValue"
                      type="number"
                      min="1"
                      variant="outlined"
                      density="compact"
                      hide-details
                      prepend-inner-icon="mdi-bell-ring-outline"
                      :suffix="getAdvanceUnitLabel(formAdvanceUnit)"
                      @update:model-value="updateCalculatedAdvanceMinutes">
                  </v-text-field>
                </v-col>
                <v-col>
                  <div class="d-flex ga-1">
                    <v-chip
                        size="small"
                        :variant="formAdvanceUnit === 'second' ? 'elevated' : 'outlined'"
                        :color="formAdvanceUnit === 'second' ? 'amber' : ''"
                        @click="formAdvanceUnit = 'second'; updateCalculatedAdvanceMinutes()">
                      {{ t('reminder.units.second') }}
                    </v-chip>
                    <v-chip
                        size="small"
                        :variant="formAdvanceUnit === 'minute' ? 'elevated' : 'outlined'"
                        :color="formAdvanceUnit === 'minute' ? 'amber' : ''"
                        @click="formAdvanceUnit = 'minute'; updateCalculatedAdvanceMinutes()">
                      {{ t('reminder.units.minute') }}
                    </v-chip>
                    <v-chip
                        size="small"
                        :variant="formAdvanceUnit === 'hour' ? 'elevated' : 'outlined'"
                        :color="formAdvanceUnit === 'hour' ? 'amber' : ''"
                        @click="formAdvanceUnit = 'hour'; updateCalculatedAdvanceMinutes()">
                      {{ t('reminder.units.hour') }}
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-card>

        <!-- 任务有效期配置 -->
        <v-card variant="tonal" class="mb-4 pa-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-caption font-weight-bold">
              {{ t('reminder.fields.validity') }}
            </label>
          </div>

          <v-btn-toggle
              v-model="formValidityType"
              mandatory
              color="amber"
              variant="outlined"
              density="compact"
              divided
              class="w-100 mb-3">
            <v-btn value="permanent" class="flex-grow-1" prepend-icon="mdi-infinity">
              {{ t('reminder.fields.validityPermanent') }}
            </v-btn>
            <v-btn value="range" class="flex-grow-1" prepend-icon="mdi-calendar-range">
              {{ t('reminder.fields.validityRange') }}
            </v-btn>
          </v-btn-toggle>

          <!-- 自定义时间区间（具体到分钟） -->
          <div v-if="formValidityType === 'range'" class="pt-2">
            <!-- 开始时间 -->
            <div class="mb-3">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="text-caption font-weight-bold">{{ t('reminder.fields.validityFrom') }}</span>
                <v-btn size="x-small" variant="text" @click="setValidFromNow">{{ t('reminder.dialog.effectiveImmediately') }}</v-btn>
              </div>
              <v-row no-gutters class="ga-2">
                <v-col>
                  <v-text-field
                      v-model="formValidFromDate"
                      type="date"
                      variant="outlined"
                      density="compact"
                      hide-details
                      prepend-inner-icon="mdi-calendar-start">
                  </v-text-field>
                </v-col>
                <v-col>
                  <v-text-field
                      v-model="formValidFromTime"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      prepend-inner-icon="mdi-clock-outline">
                  </v-text-field>
                </v-col>
              </v-row>
            </div>

            <!-- 截止时间 -->
            <div>
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="text-caption font-weight-bold">{{ t('reminder.fields.validityTo') }}</span>
                <div class="d-flex ga-1">
                  <v-btn size="x-small" variant="text" @click="setValidToOffset(7)">{{ t('reminder.dialog.offsetDays', {days: 7}) }}</v-btn>
                  <v-btn size="x-small" variant="text" @click="setValidToOffset(30)">{{ t('reminder.dialog.offsetDays', {days: 30}) }}</v-btn>
                  <v-btn size="x-small" variant="text" @click="setValidToOffset(90)">{{ t('reminder.dialog.offsetDays', {days: 90}) }}</v-btn>
                </div>
              </div>
              <v-row no-gutters class="ga-2">
                <v-col>
                  <v-text-field
                      v-model="formValidToDate"
                      type="date"
                      variant="outlined"
                      density="compact"
                      hide-details
                      prepend-inner-icon="mdi-calendar-end">
                  </v-text-field>
                </v-col>
                <v-col>
                  <v-text-field
                      v-model="formValidToTime"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      prepend-inner-icon="mdi-clock-outline">
                  </v-text-field>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-card>

        <!-- 备注与攻略内容，上限 5000 字 -->
        <div class="mb-4">
          <div class="d-flex justify-space-between align-center mb-1">
            <label class="text-caption font-weight-bold">
              {{ t('reminder.fields.note') }}
            </label>
            <span class="text-caption" :class="formNote.length > MAX_NOTE_LENGTH ? 'text-error' : 'opacity-60'">
              {{ formNote.length }} / {{ MAX_NOTE_LENGTH }}
            </span>
          </div>
          <v-textarea
              v-model="formNote"
              :placeholder="t('reminder.fields.notePlaceholder')"
              variant="outlined"
              density="compact"
              rows="4"
              maxlength="5000"
              hide-details
              auto-grow>
          </v-textarea>
        </div>

        <!-- 单独的是否通知开关 (默认是) -->
        <div class="pa-3 mb-3 rounded border d-flex align-center justify-space-between">
          <div>
            <div class="font-weight-medium text-body-2 d-flex align-center">
              {{ t('reminder.fields.notifyEnabled') }}
            </div>
            <div class="text-caption opacity-60">{{ t('reminder.fields.notifyEnabledDesc') }}</div>
          </div>
          <v-switch
              v-model="formNotifyEnabled"
              hide-details
              density="compact"
              inset
              color="amber">
          </v-switch>
        </div>

        <!-- 任务总开关/计时追踪 -->
        <div class="pa-3 rounded border d-flex align-center justify-space-between">
          <div>
            <div class="font-weight-medium text-body-2">{{ t('reminder.fields.taskEnabled') }}</div>
            <div class="text-caption opacity-60">{{ t('reminder.fields.taskEnabledDesc') }}</div>
          </div>
          <v-switch
              v-model="formEnabled"
              hide-details
              density="compact"
              inset
              color="amber">
          </v-switch>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 bg-surface">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="visible = false">
          {{ t('reminder.cancel') }}
        </v-btn>
        <v-btn
            color="amber"
            variant="flat"
            :disabled="!isValid"
            @click="onSave">
          {{ t('reminder.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
.reminder-edit-card {
  border-radius: 12px;
}
</style>
