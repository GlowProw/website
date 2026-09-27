<script lang="ts">
export default { name: 'DateRangePicker' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/framework';

export type DateRangePickerMode = 'date' | 'month' | 'year';

export interface DateRangePickerProps {
  modelValue?: string | string[] | null;
  mode?: DateRangePickerMode;
  allowModeSwitch?: boolean;
  availableModes?: DateRangePickerMode[];
  disableFuture?: boolean;
  disablePast?: boolean;
  min?: string | Date | number | null;
  max?: string | Date | number | null;
  placeholder?: string;
  label?: string;
  clearable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  density?: 'default' | 'comfortable' | 'compact';
  variant?: any;
  valueFormat?: 'iso' | 'formatted' | 'array';
  dialogTitle?: string;
}

const props = withDefaults(defineProps<DateRangePickerProps>(), {
  modelValue: null,
  mode: 'date',
  allowModeSwitch: true,
  availableModes: () => ['date', 'month', 'year'],
  disableFuture: false,
  disablePast: false,
  min: null,
  max: null,
  placeholder: '',
  label: '',
  clearable: true,
  disabled: false,
  readonly: false,
  density: 'comfortable',
  variant: 'filled',
  valueFormat: 'iso',
  dialogTitle: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | string[] | null): void;
  (e: 'change', val: { start: string | null; end: string | null; mode: DateRangePickerMode }): void;
  (e: 'clear'): void;
}>();

const { t, te } = useI18n();
const { mobile } = useDisplay();

const dialog = ref(false);
const activeMode = ref<DateRangePickerMode>(props.mode);

// Helpers
const pad = (n: number) => n.toString().padStart(2, '0');

const parseToDate = (val?: string | Date | number | null): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(val).trim();
  if (!str) return null;
  // Check if pure timestamp number in string
  if (/^\d{11,}$/.test(str)) {
    const d = new Date(Number(str));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateToYMD = (d: Date): string => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Date mode values (YYYY-MM-DD)
const startDateStr = ref<string | null>(null);
const endDateStr = ref<string | null>(null);

// Month mode values
const startYearMonth = ref<{ year: number; month: number } | null>(null);
const endYearMonth = ref<{ year: number; month: number } | null>(null);

// Year mode values
const startYearOnly = ref<number | null>(null);
const endYearOnly = ref<number | null>(null);

// Effective boundaries
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const todayStr = formatDateToYMD(now);

const effectiveMinDate = computed<Date | null>(() => {
  if (props.min) {
    const d = parseToDate(props.min);
    if (d) return d;
  }
  if (props.disablePast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  return null;
});

const effectiveMaxDate = computed<Date | null>(() => {
  if (props.max) {
    const d = parseToDate(props.max);
    if (d) return d;
  }
  if (props.disableFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }
  return null;
});

const effectiveMinYMD = computed<string | null>(() => {
  return effectiveMinDate.value ? formatDateToYMD(effectiveMinDate.value) : null;
});

const effectiveMaxYMD = computed<string | null>(() => {
  return effectiveMaxDate.value ? formatDateToYMD(effectiveMaxDate.value) : null;
});

// Year range boundaries
const minSelectableYear = computed<number>(() => {
  if (effectiveMinDate.value) return effectiveMinDate.value.getFullYear();
  return 1970;
});

const maxSelectableYear = computed<number>(() => {
  if (effectiveMaxDate.value) return effectiveMaxDate.value.getFullYear();
  return currentYear + 20;
});

// Parse initial modelValue
const parseIncomingValue = () => {
  if (!props.modelValue) {
    startDateStr.value = null;
    endDateStr.value = null;
    startYearMonth.value = null;
    endYearMonth.value = null;
    startYearOnly.value = null;
    endYearOnly.value = null;
    return;
  }

  let sRaw: string | null = null;
  let eRaw: string | null = null;

  if (Array.isArray(props.modelValue)) {
    sRaw = props.modelValue[0] || null;
    eRaw = props.modelValue[1] || null;
  } else if (typeof props.modelValue === 'string') {
    const parts = props.modelValue.split(',');
    sRaw = parts[0]?.trim() || null;
    eRaw = parts[1]?.trim() || null;
  }

  if (!sRaw && !eRaw) return;

  const sDate = parseToDate(sRaw);
  const eDate = parseToDate(eRaw);

  if (sDate) {
    startDateStr.value = formatDateToYMD(sDate);
    startYearMonth.value = { year: sDate.getFullYear(), month: sDate.getMonth() + 1 };
    startYearOnly.value = sDate.getFullYear();
  }
  if (eDate) {
    endDateStr.value = formatDateToYMD(eDate);
    endYearMonth.value = { year: eDate.getFullYear(), month: eDate.getMonth() + 1 };
    endYearOnly.value = eDate.getFullYear();
  }
};

watch(() => props.modelValue, () => {
  parseIncomingValue();
}, { immediate: true });

watch(() => props.mode, (newMode) => {
  if (newMode && newMode !== activeMode.value) {
    activeMode.value = newMode;
  }
});

// Range validation
const isDateModeValid = computed(() => {
  if (!startDateStr.value || !endDateStr.value) return false;
  const s = new Date(startDateStr.value).getTime();
  const e = new Date(endDateStr.value).getTime();
  if (isNaN(s) || isNaN(e) || s > e) return false;
  if (effectiveMinYMD.value && startDateStr.value < effectiveMinYMD.value) return false;
  if (effectiveMaxYMD.value && endDateStr.value > effectiveMaxYMD.value) return false;
  return true;
});

const isMonthModeValid = computed(() => {
  if (!startYearMonth.value || !endYearMonth.value) return false;
  const sVal = startYearMonth.value.year * 12 + startYearMonth.value.month;
  const eVal = endYearMonth.value.year * 12 + endYearMonth.value.month;
  if (sVal > eVal) return false;

  if (effectiveMinDate.value) {
    const minVal = effectiveMinDate.value.getFullYear() * 12 + (effectiveMinDate.value.getMonth() + 1);
    if (sVal < minVal) return false;
  }
  if (effectiveMaxDate.value) {
    const maxVal = effectiveMaxDate.value.getFullYear() * 12 + (effectiveMaxDate.value.getMonth() + 1);
    if (eVal > maxVal) return false;
  }
  return true;
});

const isYearModeValid = computed(() => {
  if (startYearOnly.value === null || endYearOnly.value === null) return false;
  if (startYearOnly.value > endYearOnly.value) return false;
  if (startYearOnly.value < minSelectableYear.value) return false;
  if (endYearOnly.value > maxSelectableYear.value) return false;
  return true;
});

const isRangeValid = computed(() => {
  if (activeMode.value === 'date') return isDateModeValid.value;
  if (activeMode.value === 'month') return isMonthModeValid.value;
  if (activeMode.value === 'year') return isYearModeValid.value;
  return false;
});

// Display text in the activator text field
const displayText = computed(() => {
  if (activeMode.value === 'date') {
    if (startDateStr.value && endDateStr.value) {
      return `${startDateStr.value} ~ ${endDateStr.value}`;
    }
  } else if (activeMode.value === 'month') {
    if (startYearMonth.value && endYearMonth.value) {
      return `${startYearMonth.value.year}-${pad(startYearMonth.value.month)} ~ ${endYearMonth.value.year}-${pad(endYearMonth.value.month)}`;
    }
  } else if (activeMode.value === 'year') {
    if (startYearOnly.value !== null && endYearOnly.value !== null) {
      return `${startYearOnly.value} ~ ${endYearOnly.value}`;
    }
  }
  return '';
});

// Year lists for Year & Month Pickers
const yearsList = computed(() => {
  const list: number[] = [];
  const minY = Math.max(1970, minSelectableYear.value);
  const maxY = Math.min(2100, maxSelectableYear.value);
  for (let y = maxY; y >= minY; y--) {
    list.push(y);
  }
  return list;
});

const monthsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Presets
interface PresetOption {
  key: string;
  label: string;
  handler: () => void;
  visible: boolean;
}

const presets = computed<PresetOption[]>(() => {
  const isFutureRestricted = props.disableFuture;
  const isPastRestricted = props.disablePast;

  if (activeMode.value === 'date') {
    return [
      {
        key: 'today',
        label: t('basic.time.presets.today'),
        visible: true,
        handler: () => {
          startDateStr.value = todayStr;
          endDateStr.value = todayStr;
        }
      },
      {
        key: 'yesterday',
        label: t('basic.time.presets.yesterday'),
        visible: !isPastRestricted,
        handler: () => {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          const yStr = formatDateToYMD(y);
          startDateStr.value = yStr;
          endDateStr.value = yStr;
        }
      },
      {
        key: 'last7Days',
        label: t('basic.time.presets.last7Days'),
        visible: !isPastRestricted,
        handler: () => {
          const s = new Date();
          s.setDate(s.getDate() - 6);
          startDateStr.value = formatDateToYMD(s);
          endDateStr.value = todayStr;
        }
      },
      {
        key: 'thisWeek',
        label: t('basic.time.presets.thisWeek'),
        visible: true,
        handler: () => {
          const d = new Date();
          const day = d.getDay() || 7;
          const monday = new Date(d);
          monday.setDate(d.getDate() - day + 1);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          startDateStr.value = formatDateToYMD(monday);
          endDateStr.value = isFutureRestricted && sunday > now ? todayStr : formatDateToYMD(sunday);
        }
      },
      {
        key: 'thisMonth',
        label: t('basic.time.presets.thisMonth'),
        visible: true,
        handler: () => {
          const s = new Date(currentYear, currentMonth - 1, 1);
          const e = new Date(currentYear, currentMonth, 0);
          startDateStr.value = formatDateToYMD(s);
          endDateStr.value = isFutureRestricted && e > now ? todayStr : formatDateToYMD(e);
        }
      },
      {
        key: 'last30Days',
        label: t('basic.time.presets.last30Days'),
        visible: !isPastRestricted,
        handler: () => {
          const s = new Date();
          s.setDate(s.getDate() - 29);
          startDateStr.value = formatDateToYMD(s);
          endDateStr.value = todayStr;
        }
      },
      {
        key: 'thisYear',
        label: t('basic.time.presets.thisYear'),
        visible: true,
        handler: () => {
          const s = new Date(currentYear, 0, 1);
          const e = new Date(currentYear, 11, 31);
          startDateStr.value = formatDateToYMD(s);
          endDateStr.value = isFutureRestricted && e > now ? todayStr : formatDateToYMD(e);
        }
      }
    ].filter(p => p.visible);
  }

  if (activeMode.value === 'month') {
    return [
      {
        key: 'thisMonth',
        label: t('basic.time.presets.thisMonth'),
        visible: true,
        handler: () => {
          startYearMonth.value = { year: currentYear, month: currentMonth };
          endYearMonth.value = { year: currentYear, month: currentMonth };
        }
      },
      {
        key: 'lastMonth',
        label: t('basic.time.presets.lastMonth'),
        visible: !isPastRestricted,
        handler: () => {
          const lm = currentMonth === 1 ? 12 : currentMonth - 1;
          const ly = currentMonth === 1 ? currentYear - 1 : currentYear;
          startYearMonth.value = { year: ly, month: lm };
          endYearMonth.value = { year: ly, month: lm };
        }
      },
      {
        key: 'last3Months',
        label: t('basic.time.presets.last3Years') ? t('basic.time.presets.last30Days') : '近3个月',
        visible: !isPastRestricted,
        handler: () => {
          const d = new Date(currentYear, currentMonth - 1 - 2, 1);
          startYearMonth.value = { year: d.getFullYear(), month: d.getMonth() + 1 };
          endYearMonth.value = { year: currentYear, month: currentMonth };
        }
      },
      {
        key: 'thisYear',
        label: t('basic.time.presets.thisYear'),
        visible: true,
        handler: () => {
          startYearMonth.value = { year: currentYear, month: 1 };
          endYearMonth.value = { year: currentYear, month: isFutureRestricted ? currentMonth : 12 };
        }
      },
      {
        key: 'lastYear',
        label: t('basic.time.presets.lastYear'),
        visible: !isPastRestricted,
        handler: () => {
          startYearMonth.value = { year: currentYear - 1, month: 1 };
          endYearMonth.value = { year: currentYear - 1, month: 12 };
        }
      }
    ].filter(p => p.visible);
  }

  if (activeMode.value === 'year') {
    return [
      {
        key: 'thisYear',
        label: t('basic.time.presets.thisYear'),
        visible: true,
        handler: () => {
          startYearOnly.value = currentYear;
          endYearOnly.value = currentYear;
        }
      },
      {
        key: 'lastYear',
        label: t('basic.time.presets.lastYear'),
        visible: !isPastRestricted,
        handler: () => {
          startYearOnly.value = currentYear - 1;
          endYearOnly.value = currentYear - 1;
        }
      },
      {
        key: 'last3Years',
        label: t('basic.time.presets.last3Years'),
        visible: !isPastRestricted,
        handler: () => {
          startYearOnly.value = currentYear - 2;
          endYearOnly.value = currentYear;
        }
      },
      {
        key: 'last5Years',
        label: t('basic.time.presets.last5Years'),
        visible: !isPastRestricted,
        handler: () => {
          startYearOnly.value = currentYear - 4;
          endYearOnly.value = currentYear;
        }
      }
    ].filter(p => p.visible);
  }

  return [];
});

// Month / Year selection helpers
const isMonthDisabled = (year: number, month: number, isStart: boolean): boolean => {
  const val = year * 12 + month;
  if (effectiveMinDate.value) {
    const minVal = effectiveMinDate.value.getFullYear() * 12 + (effectiveMinDate.value.getMonth() + 1);
    if (val < minVal) return true;
  }
  if (effectiveMaxDate.value) {
    const maxVal = effectiveMaxDate.value.getFullYear() * 12 + (effectiveMaxDate.value.getMonth() + 1);
    if (val > maxVal) return true;
  }
  if (!isStart && startYearMonth.value) {
    const sVal = startYearMonth.value.year * 12 + startYearMonth.value.month;
    if (val < sVal) return true;
  }
  return false;
};

const isYearDisabled = (year: number, isStart: boolean): boolean => {
  if (year < minSelectableYear.value || year > maxSelectableYear.value) return true;
  if (!isStart && startYearOnly.value !== null && year < startYearOnly.value) return true;
  return false;
};

// Reset
const resetSelection = () => {
  startDateStr.value = null;
  endDateStr.value = null;
  startYearMonth.value = null;
  endYearMonth.value = null;
  startYearOnly.value = null;
  endYearOnly.value = null;
  emit('update:modelValue', null);
  emit('clear');
  emit('change', { start: null, end: null, mode: activeMode.value });
};

// Confirm
const confirmSelection = () => {
  if (!isRangeValid.value) return;

  let startRes: string | null = null;
  let endRes: string | null = null;

  if (activeMode.value === 'date' && startDateStr.value && endDateStr.value) {
    if (props.valueFormat === 'iso') {
      const s = new Date(startDateStr.value);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDateStr.value);
      e.setHours(23, 59, 59, 999);
      startRes = s.toISOString();
      endRes = e.toISOString();
    } else {
      startRes = startDateStr.value;
      endRes = endDateStr.value;
    }
  } else if (activeMode.value === 'month' && startYearMonth.value && endYearMonth.value) {
    const sy = startYearMonth.value.year;
    const sm = startYearMonth.value.month;
    const ey = endYearMonth.value.year;
    const em = endYearMonth.value.month;

    if (props.valueFormat === 'iso') {
      const s = new Date(sy, sm - 1, 1, 0, 0, 0, 0);
      const e = new Date(ey, em, 0, 23, 59, 59, 999);
      startRes = s.toISOString();
      endRes = e.toISOString();
    } else {
      startRes = `${sy}-${pad(sm)}`;
      endRes = `${ey}-${pad(em)}`;
    }
  } else if (activeMode.value === 'year' && startYearOnly.value !== null && endYearOnly.value !== null) {
    const sy = startYearOnly.value;
    const ey = endYearOnly.value;

    if (props.valueFormat === 'iso') {
      const s = new Date(sy, 0, 1, 0, 0, 0, 0);
      const e = new Date(ey, 11, 31, 23, 59, 59, 999);
      startRes = s.toISOString();
      endRes = e.toISOString();
    } else {
      startRes = `${sy}`;
      endRes = `${ey}`;
    }
  }

  if (startRes && endRes) {
    if (props.valueFormat === 'array') {
      emit('update:modelValue', [startRes, endRes]);
    } else {
      emit('update:modelValue', `${startRes},${endRes}`);
    }
    emit('change', { start: startRes, end: endRes, mode: activeMode.value });
  }

  dialog.value = false;
};

// Switch mode
const setMode = (mode: DateRangePickerMode) => {
  activeMode.value = mode;
  if (mode === 'month' && !startYearMonth.value) {
    startYearMonth.value = { year: currentYear, month: 1 };
    endYearMonth.value = { year: currentYear, month: currentMonth };
  } else if (mode === 'year' && startYearOnly.value === null) {
    startYearOnly.value = currentYear;
    endYearOnly.value = currentYear;
  }
};
</script>

<template>
  <div class="date-range-picker-container">
    <v-text-field
        :model-value="displayText"
        readonly
        :placeholder="placeholder || t('basic.time.selectDateRange')"
        :label="label"
        :disabled="disabled"
        :density="density"
        :variant="variant"
        prepend-inner-icon="mdi-calendar-range"
        :clearable="clearable"
        hide-details
        @click.stop="!disabled && (dialog = true)"
        @click:clear="resetSelection"
        class="date-range-trigger-input"
    />

    <v-dialog v-model="dialog" max-width="740px" persistent>
      <v-card class="date-range-dialog-card bg-surface">
        <!-- Header -->
        <v-card-title class="d-flex justify-space-between align-center px-4 py-3 border-b">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-calendar-clock" color="amber"></v-icon>
            <span class="text-subtitle-1 font-weight-bold">
              {{ dialogTitle || t('basic.time.dateRangePicker') }}
            </span>
          </div>

          <!-- Mode Switcher -->
          <div v-if="allowModeSwitch" class="d-flex align-center ga-1">
            <v-btn-toggle
                v-model="activeMode"
                mandatory
                density="compact"
                color="amber"
                variant="outlined"
                class="rounded-lg">
              <v-btn
                  v-if="availableModes.includes('date')"
                  value="date"
                  size="small"
                  @click="setMode('date')">
                <v-icon icon="mdi-calendar-today" size="14" class="mr-1"></v-icon>
                {{ t('basic.time.modes.date') }}
              </v-btn>
              <v-btn
                  v-if="availableModes.includes('month')"
                  value="month"
                  size="small"
                  @click="setMode('month')">
                <v-icon icon="mdi-calendar-month" size="14" class="mr-1"></v-icon>
                {{ t('basic.time.modes.month') }}
              </v-btn>
              <v-btn
                  v-if="availableModes.includes('year')"
                  value="year"
                  size="small"
                  @click="setMode('year')">
                <v-icon icon="mdi-calendar" size="14" class="mr-1"></v-icon>
                {{ t('basic.time.modes.year') }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Presets Quick Bar -->
          <div v-if="presets.length > 0" class="mb-4 d-flex align-center flex-wrap ga-2">
            <span class="text-caption opacity-60 mr-1">{{ t('basic.filter') }}:</span>
            <v-chip
                v-for="p in presets"
                :key="p.key"
                size="small"
                variant="tonal"
                color="amber"
                class="cursor-pointer font-weight-medium"
                @click="p.handler">
              {{ p.label }}
            </v-chip>
          </div>

          <!-- Mode 1: Date Range (YYYY-MM-DD ~ YYYY-MM-DD) -->
          <div v-if="activeMode === 'date'">
            <v-row>
              <v-col cols="12" sm="6">
                <div class="picker-section-box pa-2 rounded border">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption font-weight-bold text-amber">
                      {{ t('basic.time.startDate') }}
                    </span>
                    <span class="text-caption font-mono">{{ startDateStr || '--' }}</span>
                  </div>
                  <v-date-picker
                      v-model="startDateStr"
                      :min="effectiveMinYMD"
                      :max="endDateStr || effectiveMaxYMD"
                      hide-header
                      hide-weekdays
                      density="compact"
                      class="custom-date-picker w-100"
                  />
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="picker-section-box pa-2 rounded border">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption font-weight-bold text-amber">
                      {{ t('basic.time.endDate') }}
                    </span>
                    <span class="text-caption font-mono">{{ endDateStr || '--' }}</span>
                  </div>
                  <v-date-picker
                      v-model="endDateStr"
                      :min="startDateStr || effectiveMinYMD"
                      :max="effectiveMaxYMD"
                      hide-header
                      hide-weekdays
                      density="compact"
                      class="custom-date-picker w-100"
                  />
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Mode 2: Month Range (YYYY-MM ~ YYYY-MM) -->
          <div v-else-if="activeMode === 'month'">
            <v-row>
              <!-- Start Year-Month -->
              <v-col cols="12" sm="6">
                <div class="picker-section-box pa-3 rounded border">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-caption font-weight-bold text-amber">
                      {{ t('basic.time.startMonth') }}
                    </span>
                    <span class="text-caption font-mono font-weight-bold" v-if="startYearMonth">
                      {{ startYearMonth.year }}-{{ pad(startYearMonth.month) }}
                    </span>
                  </div>

                  <div class="mb-3">
                    <v-select
                        :model-value="startYearMonth?.year || currentYear"
                        :items="yearsList"
                        label="Year"
                        density="compact"
                        variant="outlined"
                        hide-details
                        @update:model-value="(y) => { if (!startYearMonth) startYearMonth = { year: Number(y), month: 1 }; else startYearMonth.year = Number(y); }"
                    />
                  </div>

                  <div class="month-grid">
                    <v-btn
                        v-for="m in monthsList"
                        :key="m"
                        size="small"
                        :variant="startYearMonth && startYearMonth.month === m ? 'flat' : 'tonal'"
                        :color="startYearMonth && startYearMonth.month === m ? 'amber' : undefined"
                        :disabled="isMonthDisabled(startYearMonth?.year || currentYear, m, true)"
                        @click="() => {
                          const y = startYearMonth?.year || currentYear;
                          startYearMonth = { year: y, month: m };
                        }"
                        class="month-cell-btn">
                      {{ pad(m) }}
                    </v-btn>
                  </div>
                </div>
              </v-col>

              <!-- End Year-Month -->
              <v-col cols="12" sm="6">
                <div class="picker-section-box pa-3 rounded border">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-caption font-weight-bold text-amber">
                      {{ t('basic.time.endMonth') }}
                    </span>
                    <span class="text-caption font-mono font-weight-bold" v-if="endYearMonth">
                      {{ endYearMonth.year }}-{{ pad(endYearMonth.month) }}
                    </span>
                  </div>

                  <div class="mb-3">
                    <v-select
                        :model-value="endYearMonth?.year || currentYear"
                        :items="yearsList"
                        label="Year"
                        density="compact"
                        variant="outlined"
                        hide-details
                        @update:model-value="(y) => { if (!endYearMonth) endYearMonth = { year: Number(y), month: 12 }; else endYearMonth.year = Number(y); }"
                    />
                  </div>

                  <div class="month-grid">
                    <v-btn
                        v-for="m in monthsList"
                        :key="m"
                        size="small"
                        :variant="endYearMonth && endYearMonth.month === m ? 'flat' : 'tonal'"
                        :color="endYearMonth && endYearMonth.month === m ? 'amber' : undefined"
                        :disabled="isMonthDisabled(endYearMonth?.year || currentYear, m, false)"
                        @click="() => {
                          const y = endYearMonth?.year || currentYear;
                          endYearMonth = { year: y, month: m };
                        }"
                        class="month-cell-btn">
                      {{ pad(m) }}
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Mode 3: Year Range (YYYY ~ YYYY) -->
          <div v-else-if="activeMode === 'year'">
            <v-row>
              <!-- Start Year -->
              <v-col cols="12" sm="6">
                <div class="picker-section-box pa-3 rounded border">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-caption font-weight-bold text-amber">
                      {{ t('basic.time.startYear') }}
                    </span>
                    <span class="text-caption font-mono font-weight-bold text-h6">
                      {{ startYearOnly || '--' }}
                    </span>
                  </div>

                  <div class="year-scroll-grid">
                    <v-btn
                        v-for="y in yearsList"
                        :key="y"
                        size="small"
                        :variant="startYearOnly === y ? 'flat' : 'tonal'"
                        :color="startYearOnly === y ? 'amber' : undefined"
                        :disabled="isYearDisabled(y, true)"
                        @click="startYearOnly = y"
                        class="year-cell-btn">
                      {{ y }}
                    </v-btn>
                  </div>
                </div>
              </v-col>

              <!-- End Year -->
              <v-col cols="12" sm="6">
                <div class="picker-section-box pa-3 rounded border">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-caption font-weight-bold text-amber">
                      {{ t('basic.time.endYear') }}
                    </span>
                    <span class="text-caption font-mono font-weight-bold text-h6">
                      {{ endYearOnly || '--' }}
                    </span>
                  </div>

                  <div class="year-scroll-grid">
                    <v-btn
                        v-for="y in yearsList"
                        :key="y"
                        size="small"
                        :variant="endYearOnly === y ? 'flat' : 'tonal'"
                        :color="endYearOnly === y ? 'amber' : undefined"
                        :disabled="isYearDisabled(y, false)"
                        @click="endYearOnly = y"
                        class="year-cell-btn">
                      {{ y }}
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Validation feedback -->
          <v-alert
              v-if="!isRangeValid && (displayText || startDateStr || startYearMonth || startYearOnly)"
              type="warning"
              density="compact"
              variant="tonal"
              class="mt-3">
            <span v-if="props.disableFuture && (endDateStr && endDateStr > todayStr)">
              {{ t('basic.time.futureDateError') }}
            </span>
            <span v-else-if="props.disablePast && (startDateStr && startDateStr < todayStr)">
              {{ t('basic.time.pastDateError') }}
            </span>
            <span v-else>
              {{ t('basic.time.endDateBeforeStartDateError') }}
            </span>
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

        <!-- Actions -->
        <v-card-actions class="pa-4">
          <v-btn variant="text" color="grey" @click="resetSelection">
            {{ t('basic.button.reset') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="dialog = false">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn
              color="amber"
              variant="flat"
              class="text-black font-weight-bold px-6"
              :disabled="!isRangeValid"
              @click="confirmSelection">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="less">
.date-range-picker-container {
  width: 100%;
}

.picker-section-box {
  background: rgba(255, 255, 255, 0.02);
  min-height: 280px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.year-scroll-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.month-cell-btn,
.year-cell-btn {
  font-family: monospace;
  font-size: 13px;
}

@media (max-width: 600px) {
  .picker-section-box {
    min-height: auto;
  }
}
</style>
