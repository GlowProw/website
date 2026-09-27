<script lang="ts">
export default { name: 'DateRangePicker' }
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

const { t, te, locale } = useI18n();
const { mobile } = useDisplay();

const dialog = ref(false);
const activeMode = ref<DateRangePickerMode>(props.mode);

// 辅助工具方法：数字补零与日期解析
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
  // 如果传入的是时间戳数字字符串
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

// 范围边界限制计算
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

const minSelectableYear = computed<number>(() => {
  if (effectiveMinDate.value) return effectiveMinDate.value.getFullYear();
  return 1970;
});

const maxSelectableYear = computed<number>(() => {
  if (effectiveMaxDate.value) return effectiveMaxDate.value.getFullYear();
  return currentYear + 25;
});

// 年月日日期范围模式的状态与交互逻辑
const startDateStr = ref<string | null>(null);
const endDateStr = ref<string | null>(null);
const hoverDateStr = ref<string | null>(null);

// 左右双月份面板年份与月份状态
const leftYear = ref<number>(currentYear);
const leftMonth = ref<number>(currentMonth);

const rightYear = computed<number>(() => {
  return leftMonth.value === 12 ? leftYear.value + 1 : leftYear.value;
});

const rightMonth = computed<number>(() => {
  return leftMonth.value === 12 ? 1 : leftMonth.value + 1;
});

const prevMonthNav = () => {
  if (leftMonth.value === 1) {
    leftMonth.value = 12;
    leftYear.value--;
  } else {
    leftMonth.value--;
  }
};

const nextMonthNav = () => {
  if (leftMonth.value === 12) {
    leftMonth.value = 1;
    leftYear.value++;
  } else {
    leftMonth.value++;
  }
};

const prevYearNav = () => {
  leftYear.value--;
};

const nextYearNav = () => {
  leftYear.value++;
};

// 星期表头列表
const weekdayHeaders = computed(() => {
  const isEn = String(locale.value).toLowerCase().startsWith('en');
  if (isEn) {
    return ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  }
  return ['一', '二', '三', '四', '五', '六', '日'];
});

interface CalendarCell {
  dateStr: string;
  dayNumber: number;
  year: number;
  month: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isHoverEnd: boolean;
}

const buildMonthCells = (year: number, month: number): CalendarCell[] => {
  const cells: CalendarCell[] = [];

  const daysInCurrentMonth = new Date(year, month, 0).getDate();

  const prevYearNum = month === 1 ? year - 1 : year;
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const daysInPrevMonth = new Date(prevYearNum, prevMonthNum, 0).getDate();

  const nextYearNum = month === 12 ? year + 1 : year;
  const nextMonthNum = month === 12 ? 1 : month + 1;

  // 当月第一天的星期几，按周一作为每周第一天进行换算
  const firstJsDay = new Date(year, month - 1, 1).getDay();
  const leadingCount = firstJsDay === 0 ? 6 : firstJsDay - 1;

  // 根据选中的起止日期以及当前鼠标悬停日期计算区间
  const s = startDateStr.value;
  const e = endDateStr.value;
  const h = hoverDateStr.value;

  let normStart: string | null = null;
  let normEnd: string | null = null;

  if (s && e) {
    normStart = s <= e ? s : e;
    normEnd = s <= e ? e : s;
  } else if (s && !e && h) {
    normStart = s <= h ? s : h;
    normEnd = s <= h ? h : s;
  } else if (s && !e) {
    normStart = s;
    normEnd = null;
  }

  const createCell = (y: number, m: number, d: number, isCur: boolean): CalendarCell => {
    const dStr = `${y}-${pad(m)}-${pad(d)}`;
    const isToday = dStr === todayStr;

    let isDisabled = false;
    if (effectiveMinYMD.value && dStr < effectiveMinYMD.value) {
      isDisabled = true;
    }
    if (effectiveMaxYMD.value && dStr > effectiveMaxYMD.value) {
      isDisabled = true;
    }

    let isStart = false;
    let isEnd = false;
    let isInRange = false;
    let isHoverEnd = false;

    if (normStart && normEnd) {
      isStart = (dStr === normStart);
      isEnd = (dStr === normEnd);
      isInRange = (dStr > normStart && dStr < normEnd);
    } else if (normStart) {
      isStart = (dStr === normStart);
    }

    if (s && !e && h && dStr === h && h !== s) {
      isHoverEnd = true;
    }

    return {
      dateStr: dStr,
      dayNumber: d,
      year: y,
      month: m,
      isCurrentMonth: isCur,
      isToday,
      isDisabled,
      isStart,
      isEnd,
      isInRange,
      isHoverEnd
    };
  };

  // 上月补充的日期
  for (let i = leadingCount - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push(createCell(prevYearNum, prevMonthNum, day, false));
  }

  // 当前月份的日期
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    cells.push(createCell(year, month, d, true));
  }

  // 下月补充的日期，凑满42格日历布局
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push(createCell(nextYearNum, nextMonthNum, d, false));
  }

  return cells;
};

const leftMonthCells = computed(() => buildMonthCells(leftYear.value, leftMonth.value));
const rightMonthCells = computed(() => buildMonthCells(rightYear.value, rightMonth.value));

const onDateCellClick = (cell: CalendarCell) => {
  if (cell.isDisabled) return;

  if (!startDateStr.value || (startDateStr.value && endDateStr.value)) {
    // 重新开始选择起始日期
    startDateStr.value = cell.dateStr;
    endDateStr.value = null;
    hoverDateStr.value = null;
  } else if (startDateStr.value && !endDateStr.value) {
    // 选择结束日期完成范围确认
    if (cell.dateStr >= startDateStr.value) {
      endDateStr.value = cell.dateStr;
    } else {
      // 点击了比开始时间更早的日期，则作为新的开始日期
      startDateStr.value = cell.dateStr;
    }
    hoverDateStr.value = null;
  }
};

const onDateCellHover = (cell: CalendarCell) => {
  if (startDateStr.value && !endDateStr.value && !cell.isDisabled) {
    hoverDateStr.value = cell.dateStr;
  }
};

const onCalendarMouseLeave = () => {
  hoverDateStr.value = null;
};

// 年月月份范围模式的状态与交互逻辑
const startMonthStr = ref<string | null>(null);
const endMonthStr = ref<string | null>(null);
const hoverMonthStr = ref<string | null>(null);
const monthPickerYear = ref<number>(currentYear);

const prevMonthYearNav = () => {
  monthPickerYear.value--;
};

const nextMonthYearNav = () => {
  monthPickerYear.value++;
};

const monthsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const getMonthName = (m: number) => {
  const isEn = String(locale.value).toLowerCase().startsWith('en');
  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return isEn ? enMonths[m - 1] : `${m}月`;
};

interface MonthCell {
  monthStr: string;
  monthNumber: number;
  name: string;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
}

const monthCells = computed<MonthCell[]>(() => {
  const y = monthPickerYear.value;
  const s = startMonthStr.value;
  const e = endMonthStr.value;
  const h = hoverMonthStr.value;

  let normStart: string | null = null;
  let normEnd: string | null = null;

  if (s && e) {
    normStart = s <= e ? s : e;
    normEnd = s <= e ? e : s;
  } else if (s && !e && h) {
    normStart = s <= h ? s : h;
    normEnd = s <= h ? h : s;
  } else if (s && !e) {
    normStart = s;
    normEnd = null;
  }

  return monthsList.map(m => {
    const mStr = `${y}-${pad(m)}`;
    let isDisabled = false;

    if (effectiveMinDate.value) {
      const minM = `${effectiveMinDate.value.getFullYear()}-${pad(effectiveMinDate.value.getMonth() + 1)}`;
      if (mStr < minM) isDisabled = true;
    }
    if (effectiveMaxDate.value) {
      const maxM = `${effectiveMaxDate.value.getFullYear()}-${pad(effectiveMaxDate.value.getMonth() + 1)}`;
      if (mStr > maxM) isDisabled = true;
    }

    let isStart = false;
    let isEnd = false;
    let isInRange = false;

    if (normStart && normEnd) {
      isStart = (mStr === normStart);
      isEnd = (mStr === normEnd);
      isInRange = (mStr > normStart && mStr < normEnd);
    } else if (normStart) {
      isStart = (mStr === normStart);
    }

    return {
      monthStr: mStr,
      monthNumber: m,
      name: getMonthName(m),
      isDisabled,
      isStart,
      isEnd,
      isInRange
    };
  });
});

const onMonthCellClick = (cell: MonthCell) => {
  if (cell.isDisabled) return;

  if (!startMonthStr.value || (startMonthStr.value && endMonthStr.value)) {
    startMonthStr.value = cell.monthStr;
    endMonthStr.value = null;
    hoverMonthStr.value = null;
  } else if (startMonthStr.value && !endMonthStr.value) {
    if (cell.monthStr >= startMonthStr.value) {
      endMonthStr.value = cell.monthStr;
    } else {
      startMonthStr.value = cell.monthStr;
    }
    hoverMonthStr.value = null;
  }
};

const onMonthCellHover = (cell: MonthCell) => {
  if (startMonthStr.value && !endMonthStr.value && !cell.isDisabled) {
    hoverMonthStr.value = cell.monthStr;
  }
};

// 年份范围模式的状态与交互逻辑
const startYearNum = ref<number | null>(null);
const endYearNum = ref<number | null>(null);
const hoverYearNum = ref<number | null>(null);
const yearDecadeStart = ref<number>(Math.floor(currentYear / 10) * 10);

const prevDecadeNav = () => {
  yearDecadeStart.value -= 10;
};

const nextDecadeNav = () => {
  yearDecadeStart.value += 10;
};

interface YearCell {
  year: number;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
}

const yearCells = computed<YearCell[]>(() => {
  const list: YearCell[] = [];
  const start = yearDecadeStart.value - 1;
  const end = yearDecadeStart.value + 10;

  const s = startYearNum.value;
  const e = endYearNum.value;
  const h = hoverYearNum.value;

  let normStart: number | null = null;
  let normEnd: number | null = null;

  if (s !== null && e !== null) {
    normStart = s <= e ? s : e;
    normEnd = s <= e ? e : s;
  } else if (s !== null && e === null && h !== null) {
    normStart = s <= h ? s : h;
    normEnd = s <= h ? h : s;
  } else if (s !== null) {
    normStart = s;
    normEnd = null;
  }

  for (let y = start; y <= end; y++) {
    let isDisabled = false;
    if (y < minSelectableYear.value || y > maxSelectableYear.value) {
      isDisabled = true;
    }

    let isStart = false;
    let isEnd = false;
    let isInRange = false;

    if (normStart !== null && normEnd !== null) {
      isStart = (y === normStart);
      isEnd = (y === normEnd);
      isInRange = (y > normStart && y < normEnd);
    } else if (normStart !== null) {
      isStart = (y === normStart);
    }

    list.push({
      year: y,
      isDisabled,
      isStart,
      isEnd,
      isInRange
    });
  }

  return list;
});

const onYearCellClick = (cell: YearCell) => {
  if (cell.isDisabled) return;

  if (startYearNum.value === null || (startYearNum.value !== null && endYearNum.value !== null)) {
    startYearNum.value = cell.year;
    endYearNum.value = null;
    hoverYearNum.value = null;
  } else if (startYearNum.value !== null && endYearNum.value === null) {
    if (cell.year >= startYearNum.value) {
      endYearNum.value = cell.year;
    } else {
      startYearNum.value = cell.year;
    }
    hoverYearNum.value = null;
  }
};

const onYearCellHover = (cell: YearCell) => {
  if (startYearNum.value !== null && endYearNum.value === null && !cell.isDisabled) {
    hoverYearNum.value = cell.year;
  }
};

// 外部传入数据的解析与双向同步
const parseIncomingValue = () => {
  if (!props.modelValue) {
    startDateStr.value = null;
    endDateStr.value = null;
    startMonthStr.value = null;
    endMonthStr.value = null;
    startYearNum.value = null;
    endYearNum.value = null;
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
    startMonthStr.value = `${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}`;
    startYearNum.value = sDate.getFullYear();

    // 自动切到开始日期所在的年月面板
    leftYear.value = sDate.getFullYear();
    leftMonth.value = sDate.getMonth() + 1;
    monthPickerYear.value = sDate.getFullYear();
    yearDecadeStart.value = Math.floor(sDate.getFullYear() / 10) * 10;
  }
  if (eDate) {
    endDateStr.value = formatDateToYMD(eDate);
    endMonthStr.value = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}`;
    endYearNum.value = eDate.getFullYear();
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

// 校验选择的范围是否有效
const isDateModeValid = computed(() => {
  return !!startDateStr.value && !!endDateStr.value && startDateStr.value <= endDateStr.value;
});

const isMonthModeValid = computed(() => {
  return !!startMonthStr.value && !!endMonthStr.value && startMonthStr.value <= endMonthStr.value;
});

const isYearModeValid = computed(() => {
  return startYearNum.value !== null && endYearNum.value !== null && startYearNum.value <= endYearNum.value;
});

const isRangeValid = computed(() => {
  if (activeMode.value === 'date') return isDateModeValid.value;
  if (activeMode.value === 'month') return isMonthModeValid.value;
  if (activeMode.value === 'year') return isYearModeValid.value;
  return false;
});

// 触发输入框内展示的文本
const displayText = computed(() => {
  if (activeMode.value === 'date') {
    if (startDateStr.value && endDateStr.value) {
      return `${startDateStr.value} ~ ${endDateStr.value}`;
    }
  } else if (activeMode.value === 'month') {
    if (startMonthStr.value && endMonthStr.value) {
      return `${startMonthStr.value} ~ ${endMonthStr.value}`;
    }
  } else if (activeMode.value === 'year') {
    if (startYearNum.value !== null && endYearNum.value !== null) {
      return `${startYearNum.value} ~ ${endYearNum.value}`;
    }
  }
  return '';
});

// 常用快捷区间选项
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
          leftYear.value = currentYear;
          leftMonth.value = currentMonth;
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
          leftYear.value = y.getFullYear();
          leftMonth.value = y.getMonth() + 1;
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
          leftYear.value = s.getFullYear();
          leftMonth.value = s.getMonth() + 1;
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
          leftYear.value = monday.getFullYear();
          leftMonth.value = monday.getMonth() + 1;
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
          leftYear.value = currentYear;
          leftMonth.value = currentMonth;
        }
      },
      {
        key: 'lastMonth',
        label: t('basic.time.presets.lastMonth'),
        visible: !isPastRestricted,
        handler: () => {
          const s = new Date(currentYear, currentMonth - 2, 1);
          const e = new Date(currentYear, currentMonth - 1, 0);
          startDateStr.value = formatDateToYMD(s);
          endDateStr.value = formatDateToYMD(e);
          leftYear.value = s.getFullYear();
          leftMonth.value = s.getMonth() + 1;
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
          leftYear.value = s.getFullYear();
          leftMonth.value = s.getMonth() + 1;
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
          leftYear.value = currentYear;
          leftMonth.value = 1;
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
          startMonthStr.value = `${currentYear}-${pad(currentMonth)}`;
          endMonthStr.value = `${currentYear}-${pad(currentMonth)}`;
          monthPickerYear.value = currentYear;
        }
      },
      {
        key: 'lastMonth',
        label: t('basic.time.presets.lastMonth'),
        visible: !isPastRestricted,
        handler: () => {
          const lm = currentMonth === 1 ? 12 : currentMonth - 1;
          const ly = currentMonth === 1 ? currentYear - 1 : currentYear;
          startMonthStr.value = `${ly}-${pad(lm)}`;
          endMonthStr.value = `${ly}-${pad(lm)}`;
          monthPickerYear.value = ly;
        }
      },
      {
        key: 'thisYear',
        label: t('basic.time.presets.thisYear'),
        visible: true,
        handler: () => {
          startMonthStr.value = `${currentYear}-01`;
          endMonthStr.value = `${currentYear}-${pad(isFutureRestricted ? currentMonth : 12)}`;
          monthPickerYear.value = currentYear;
        }
      },
      {
        key: 'lastYear',
        label: t('basic.time.presets.lastYear'),
        visible: !isPastRestricted,
        handler: () => {
          startMonthStr.value = `${currentYear - 1}-01`;
          endMonthStr.value = `${currentYear - 1}-12`;
          monthPickerYear.value = currentYear - 1;
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
          startYearNum.value = currentYear;
          endYearNum.value = currentYear;
          yearDecadeStart.value = Math.floor(currentYear / 10) * 10;
        }
      },
      {
        key: 'lastYear',
        label: t('basic.time.presets.lastYear'),
        visible: !isPastRestricted,
        handler: () => {
          startYearNum.value = currentYear - 1;
          endYearNum.value = currentYear - 1;
          yearDecadeStart.value = Math.floor((currentYear - 1) / 10) * 10;
        }
      },
      {
        key: 'last3Years',
        label: t('basic.time.presets.last3Years'),
        visible: !isPastRestricted,
        handler: () => {
          startYearNum.value = currentYear - 2;
          endYearNum.value = currentYear;
          yearDecadeStart.value = Math.floor((currentYear - 2) / 10) * 10;
        }
      },
      {
        key: 'last5Years',
        label: t('basic.time.presets.last5Years'),
        visible: !isPastRestricted,
        handler: () => {
          startYearNum.value = currentYear - 4;
          endYearNum.value = currentYear;
          yearDecadeStart.value = Math.floor((currentYear - 4) / 10) * 10;
        }
      }
    ].filter(p => p.visible);
  }

  return [];
});

// 重置已选内容
const resetSelection = () => {
  startDateStr.value = null;
  endDateStr.value = null;
  startMonthStr.value = null;
  endMonthStr.value = null;
  startYearNum.value = null;
  endYearNum.value = null;
  hoverDateStr.value = null;
  hoverMonthStr.value = null;
  hoverYearNum.value = null;
  emit('update:modelValue', null);
  emit('clear');
  emit('change', { start: null, end: null, mode: activeMode.value });
};

// 确认并保存选择
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
  } else if (activeMode.value === 'month' && startMonthStr.value && endMonthStr.value) {
    const [sy, sm] = startMonthStr.value.split('-').map(Number);
    const [ey, em] = endMonthStr.value.split('-').map(Number);

    if (props.valueFormat === 'iso') {
      const s = new Date(sy, sm - 1, 1, 0, 0, 0, 0);
      const e = new Date(ey, em, 0, 23, 59, 59, 999);
      startRes = s.toISOString();
      endRes = e.toISOString();
    } else {
      startRes = startMonthStr.value;
      endRes = endMonthStr.value;
    }
  } else if (activeMode.value === 'year' && startYearNum.value !== null && endYearNum.value !== null) {
    const sy = startYearNum.value;
    const ey = endYearNum.value;

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

// 切换选择模式
const setMode = (mode: DateRangePickerMode) => {
  activeMode.value = mode;
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

    <v-dialog v-model="dialog" max-width="780px" persistent>
      <v-card class="date-range-dialog-card bg-surface">
        <!-- 弹窗标题与模式切换 -->
        <v-card-title class="d-flex justify-space-between align-center px-4 py-3 border-b">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-calendar-clock" color="amber"></v-icon>
            <span class="text-subtitle-1 font-weight-bold">
              {{ dialogTitle || t('basic.time.dateRangePicker') }}
            </span>
          </div>

          <!-- 模式切换开关 -->
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
          <!-- 快捷时间预设 -->
          <div v-if="presets.length > 0" class="mb-4 d-flex align-center flex-wrap ga-2">
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

          <!-- 年月日双月范围网格 -->
          <div v-if="activeMode === 'date'" class="date-range-calendar-wrapper">
            <div class="dual-month-container" :class="{ 'is-mobile': mobile }">
              <!-- 左侧月份面板 -->
              <div class="month-panel" @mouseleave="onCalendarMouseLeave">
                <!-- 左侧面板头部导航 -->
                <div class="panel-header d-flex align-center justify-space-between px-2 py-1 mb-2">
                  <div class="d-flex align-center ga-1">
                    <v-btn icon="mdi-chevron-double-left" variant="text" size="x-small" @click="prevYearNav"></v-btn>
                    <v-btn icon="mdi-chevron-left" variant="text" size="x-small" @click="prevMonthNav"></v-btn>
                  </div>
                  <div class="font-weight-bold font-mono text-subtitle-2">
                    {{ leftYear }}年 {{ leftMonth }}月
                  </div>
                  <div class="d-flex align-center ga-1" v-if="mobile">
                    <v-btn icon="mdi-chevron-right" variant="text" size="x-small" @click="nextMonthNav"></v-btn>
                    <v-btn icon="mdi-chevron-double-right" variant="text" size="x-small" @click="nextYearNav"></v-btn>
                  </div>
                  <div v-else style="width: 52px;"></div>
                </div>

                <!-- 星期表头 -->
                <div class="calendar-weekdays-row">
                  <div v-for="(w, idx) in weekdayHeaders" :key="idx" class="weekday-cell" :class="{ 'is-weekend': idx >= 5 }">
                    {{ w }}
                  </div>
                </div>

                <!-- 日期单元格网格 -->
                <div class="calendar-days-grid">
                  <div
                      v-for="(cell, idx) in leftMonthCells"
                      :key="cell.dateStr + '-' + idx"
                      class="calendar-day-cell"
                      :class="{
                        'is-start': cell.isStart,
                        'is-end': cell.isEnd,
                        'is-in-range': cell.isInRange,
                        'is-today': cell.isToday,
                        'is-disabled': cell.isDisabled,
                        'other-month': !cell.isCurrentMonth
                      }"
                      @click="onDateCellClick(cell)"
                      @mouseenter="onDateCellHover(cell)">

                    <!-- 中间日期的连续高亮色带 -->
                    <div
                        v-if="cell.isInRange || (cell.isStart && (endDateStr || hoverDateStr) && (startDateStr !== (endDateStr || hoverDateStr))) || (cell.isEnd && startDateStr && (startDateStr !== endDateStr))"
                        class="range-bg-strip"
                        :class="{
                          'strip-start': cell.isStart && !cell.isEnd,
                          'strip-end': cell.isEnd && !cell.isStart,
                          'strip-middle': cell.isInRange,
                          'row-start': idx % 7 === 0,
                          'row-end': idx % 7 === 6
                        }">
                    </div>

                    <!-- 日期数字圆标 -->
                    <div
                        class="day-badge"
                        :class="{
                          'badge-selected': cell.isStart || cell.isEnd,
                          'badge-hover': cell.isHoverEnd
                        }">
                      {{ cell.dayNumber }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧月份面板（仅桌面端显示） -->
              <div v-if="!mobile" class="month-panel" @mouseleave="onCalendarMouseLeave">
                <!-- 右侧面板头部导航 -->
                <div class="panel-header d-flex align-center justify-space-between px-2 py-1 mb-2">
                  <div style="width: 52px;"></div>
                  <div class="font-weight-bold font-mono text-subtitle-2">
                    {{ rightYear }}年 {{ rightMonth }}月
                  </div>
                  <div class="d-flex align-center ga-1">
                    <v-btn icon="mdi-chevron-right" variant="text" size="x-small" @click="nextMonthNav"></v-btn>
                    <v-btn icon="mdi-chevron-double-right" variant="text" size="x-small" @click="nextYearNav"></v-btn>
                  </div>
                </div>

                <!-- 星期表头 -->
                <div class="calendar-weekdays-row">
                  <div v-for="(w, idx) in weekdayHeaders" :key="idx" class="weekday-cell" :class="{ 'is-weekend': idx >= 5 }">
                    {{ w }}
                  </div>
                </div>

                <!-- 日期单元格网格 -->
                <div class="calendar-days-grid">
                  <div
                      v-for="(cell, idx) in rightMonthCells"
                      :key="cell.dateStr + '-' + idx"
                      class="calendar-day-cell"
                      :class="{
                        'is-start': cell.isStart,
                        'is-end': cell.isEnd,
                        'is-in-range': cell.isInRange,
                        'is-today': cell.isToday,
                        'is-disabled': cell.isDisabled,
                        'other-month': !cell.isCurrentMonth
                      }"
                      @click="onDateCellClick(cell)"
                      @mouseenter="onDateCellHover(cell)">

                    <!-- 中间日期的连续高亮色带 -->
                    <div
                        v-if="cell.isInRange || (cell.isStart && (endDateStr || hoverDateStr) && (startDateStr !== (endDateStr || hoverDateStr))) || (cell.isEnd && startDateStr && (startDateStr !== endDateStr))"
                        class="range-bg-strip"
                        :class="{
                          'strip-start': cell.isStart && !cell.isEnd,
                          'strip-end': cell.isEnd && !cell.isStart,
                          'strip-middle': cell.isInRange,
                          'row-start': idx % 7 === 0,
                          'row-end': idx % 7 === 6
                        }">
                    </div>

                    <!-- 日期数字圆标 -->
                    <div
                        class="day-badge"
                        :class="{
                          'badge-selected': cell.isStart || cell.isEnd,
                          'badge-hover': cell.isHoverEnd
                        }">
                      {{ cell.dayNumber }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 年月月份范围网格 -->
          <div v-else-if="activeMode === 'month'" class="month-range-wrapper" @mouseleave="hoverMonthStr = null">
            <div class="panel-header d-flex align-center justify-space-between px-4 py-2 mb-3">
              <v-btn icon="mdi-chevron-double-left" variant="text" size="small" @click="prevMonthYearNav"></v-btn>
              <span class="font-weight-bold font-mono text-h6">{{ monthPickerYear }}年</span>
              <v-btn icon="mdi-chevron-double-right" variant="text" size="small" @click="nextMonthYearNav"></v-btn>
            </div>

            <div class="month-selection-grid">
              <div
                  v-for="(cell, idx) in monthCells"
                  :key="cell.monthStr"
                  class="month-cell-item"
                  :class="{
                    'is-start': cell.isStart,
                    'is-end': cell.isEnd,
                    'is-in-range': cell.isInRange,
                    'is-disabled': cell.isDisabled
                  }"
                  @click="onMonthCellClick(cell)"
                  @mouseenter="onMonthCellHover(cell)">

                <div
                    v-if="cell.isInRange || (cell.isStart && (endMonthStr || hoverMonthStr) && (startMonthStr !== (endMonthStr || hoverMonthStr))) || (cell.isEnd && startMonthStr && (startMonthStr !== endMonthStr))"
                    class="range-bg-strip"
                    :class="{
                      'strip-start': cell.isStart && !cell.isEnd,
                      'strip-end': cell.isEnd && !cell.isStart,
                      'strip-middle': cell.isInRange,
                      'row-start': idx % 4 === 0,
                      'row-end': idx % 4 === 3
                    }">
                </div>

                <div class="month-badge" :class="{ 'badge-selected': cell.isStart || cell.isEnd }">
                  {{ cell.name }}
                </div>
              </div>
            </div>
          </div>

          <!-- 年份范围网格 -->
          <div v-else-if="activeMode === 'year'" class="year-range-wrapper" @mouseleave="hoverYearNum = null">
            <div class="panel-header d-flex align-center justify-space-between px-4 py-2 mb-3">
              <v-btn icon="mdi-chevron-double-left" variant="text" size="small" @click="prevDecadeNav"></v-btn>
              <span class="font-weight-bold font-mono text-h6">{{ yearDecadeStart }} - {{ yearDecadeStart + 9 }}</span>
              <v-btn icon="mdi-chevron-double-right" variant="text" size="small" @click="nextDecadeNav"></v-btn>
            </div>

            <div class="year-selection-grid">
              <div
                  v-for="(cell, idx) in yearCells"
                  :key="cell.year"
                  class="year-cell-item"
                  :class="{
                    'is-start': cell.isStart,
                    'is-end': cell.isEnd,
                    'is-in-range': cell.isInRange,
                    'is-disabled': cell.isDisabled,
                    'out-decade': cell.year < yearDecadeStart || cell.year > yearDecadeStart + 9
                  }"
                  @click="onYearCellClick(cell)"
                  @mouseenter="onYearCellHover(cell)">

                <div
                    v-if="cell.isInRange || (cell.isStart && (endYearNum || hoverYearNum) && (startYearNum !== (endYearNum || hoverYearNum))) || (cell.isEnd && startYearNum && (startYearNum !== endYearNum))"
                    class="range-bg-strip"
                    :class="{
                      'strip-start': cell.isStart && !cell.isEnd,
                      'strip-end': cell.isEnd && !cell.isStart,
                      'strip-middle': cell.isInRange,
                      'row-start': idx % 4 === 0,
                      'row-end': idx % 4 === 3
                    }">
                </div>

                <div class="year-badge" :class="{ 'badge-selected': cell.isStart || cell.isEnd }">
                  {{ cell.year }}
                </div>
              </div>
            </div>
          </div>

          <!-- 范围校验错误提示 -->
          <v-alert
              v-if="!isRangeValid && (displayText || startDateStr || startMonthStr || startYearNum)"
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

        <!-- 底部操作按钮 -->
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

.range-summary-bar {
  background: rgba(255, 255, 255, 0.03);
}

.date-tag-box {
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
}

/* 双月日历排版样式 */
.dual-month-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  &.is-mobile {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.month-panel {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
}

.calendar-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.6;
  margin-bottom: 6px;
  padding: 4px 0;
}

.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
}

.calendar-day-cell {
  position: relative;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.25;
    pointer-events: none;
  }

  &.other-month {
    opacity: 0.35;
  }

  .range-bg-strip {
    position: absolute;
    top: 2px;
    bottom: 2px;
    background: rgba(255, 179, 0, 0.18);
    pointer-events: none;
    z-index: 1;

    &.strip-middle {
      left: 0;
      right: 0;
    }

    &.strip-start {
      left: 50%;
      right: 0;
    }

    &.strip-end {
      left: 0;
      right: 50%;
    }

    &.row-start {
      border-top-left-radius: 18px;
      border-bottom-left-radius: 18px;
    }

    &.row-end {
      border-top-right-radius: 18px;
      border-bottom-right-radius: 18px;
    }
  }

  .day-badge {
    position: relative;
    z-index: 2;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s ease;

    &.badge-selected {
      background: #FFB300 !important;
      color: #121212 !important;
      font-weight: 700 !important;
      box-shadow: 0 2px 8px rgba(255, 179, 0, 0.45);
    }

    &.badge-hover {
      border: 1.5px dashed #FFB300;
      background: rgba(255, 179, 0, 0.25);
    }
  }

  &:hover:not(.is-disabled) {
    .day-badge:not(.badge-selected) {
      background: rgba(255, 179, 0, 0.18);
      color: #FFB300;
    }
  }

  &.is-today:not(.is-start):not(.is-end) {
    .day-badge {
      border: 1px solid rgba(255, 179, 0, 0.6);
      color: #FFB300;
      font-weight: 600;
    }
  }
}

/* 月份与年份区间网格样式 */
.month-range-wrapper,
.year-range-wrapper {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
}

.month-selection-grid,
.year-selection-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 12px;
}

.month-cell-item,
.year-cell-item {
  position: relative;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.25;
    pointer-events: none;
  }

  &.out-decade {
    opacity: 0.35;
  }

  .range-bg-strip {
    position: absolute;
    top: 4px;
    bottom: 4px;
    background: rgba(255, 179, 0, 0.18);
    pointer-events: none;
    z-index: 1;

    &.strip-middle {
      left: 0;
      right: 0;
    }

    &.strip-start {
      left: 50%;
      right: 0;
    }

    &.strip-end {
      left: 0;
      right: 50%;
    }

    &.row-start {
      border-top-left-radius: 20px;
      border-bottom-left-radius: 20px;
    }

    &.row-end {
      border-top-right-radius: 20px;
      border-bottom-right-radius: 20px;
    }
  }

  .month-badge,
  .year-badge {
    position: relative;
    z-index: 2;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    font-family: monospace;
    transition: all 0.15s ease;

    &.badge-selected {
      background: #FFB300 !important;
      color: #121212 !important;
      font-weight: 700 !important;
      box-shadow: 0 2px 8px rgba(255, 179, 0, 0.45);
    }
  }

  &:hover:not(.is-disabled) {
    .month-badge:not(.badge-selected),
    .year-badge:not(.badge-selected) {
      background: rgba(255, 179, 0, 0.18);
      color: #FFB300;
    }
  }
}
</style>
