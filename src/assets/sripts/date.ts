/**
 * 时间与时区工具
 */
import { ref } from 'vue';
import { getAppI18n } from '@/i18n';
import { DEFAULT_LANG } from '@/config/languages';

// 时区本地持久化存储键
const TIMEZONE_STORAGE_KEY = 'app_user_timezone';

/**
 * 获取浏览器原生系统时区
 *
 * @returns 默认 IANA 时区字符串
 */
export function getSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
  } catch {
    return 'Asia/Shanghai';
  }
}

/**
 * 响应式当前时区状态
 */
export const activeTimezone = ref<string>(loadInitialTimezone());

/**
 * 加载初始时区配置
 */
function loadInitialTimezone(): string {
  if (typeof window === 'undefined') return 'Asia/Shanghai';
  try {
    const saved = window.localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (saved && typeof saved === 'string') {
      return saved.trim();
    }
  } catch {
    // 忽略异常
  }
  return getSystemTimezone();
}

/**
 * 获取当前生效的时区
 *
 * @returns 优先返回用户设定时区，兜底系统原生时区
 */
export function getUserTimezone(): string {
  return activeTimezone.value || getSystemTimezone();
}

/**
 * 切换并持久化用户时区
 *
 * @param timezone IANA 时区标识（如 Asia/Shanghai）
 */
export function setUserTimezone(timezone: string): void {
  if (!timezone) return;
  activeTimezone.value = timezone;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
    } catch {
      // 忽略存储异常
    }
  }
}

export interface TimezoneOption {
  value: string;
  title: string;
  offset: string;
  isSystem?: boolean;
}

/**
 * 获取时区相对 UTC 的当前偏移格式化字符串（如 UTC+08:00）
 *
 * @param timeZone IANA 时区字符串
 * @returns 形如 UTC+08:00 的文本
 */
function getTimezoneOffsetString(timeZone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      const match = tzPart.value.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
      if (match) {
        let offset = match[1];
        if (!offset.includes(':')) {
          offset += ':00';
        }
        return `UTC${offset}`;
      }
      return tzPart.value.replace('GMT', 'UTC');
    }
  } catch {
    // 忽略
  }
  return 'UTC';
}

// 常用代表性时区预设清单
const PRESET_TIMEZONES = [
  { value: 'Asia/Shanghai', title: '北京、上海、香港、台北 (Asia/Shanghai)' },
  { value: 'Asia/Tokyo', title: '东京、首尔 (Asia/Tokyo)' },
  { value: 'Asia/Singapore', title: '新加坡、吉隆坡 (Asia/Singapore)' },
  { value: 'Asia/Bangkok', title: '曼谷、河内、雅加达 (Asia/Bangkok)' },
  { value: 'Asia/Dubai', title: '迪拜 (Asia/Dubai)' },
  { value: 'Asia/Kolkata', title: '孟买、加尔各答 (Asia/Kolkata)' },
  { value: 'Europe/London', title: '伦敦、都柏林 (Europe/London)' },
  { value: 'Europe/Paris', title: '巴黎、柏林、罗马、马德里 (Europe/Paris)' },
  { value: 'Europe/Moscow', title: '莫斯科 (Europe/Moscow)' },
  { value: 'America/New_York', title: '纽约、美东 (America/New_York)' },
  { value: 'America/Chicago', title: '芝加哥、美中 (America/Chicago)' },
  { value: 'America/Denver', title: '丹佛、美山 (America/Denver)' },
  { value: 'America/Los_Angeles', title: '洛杉矶、美西 (America/Los_Angeles)' },
  { value: 'America/Sao_Paulo', title: '圣保罗 (America/Sao_Paulo)' },
  { value: 'Australia/Sydney', title: '悉尼、墨尔本 (Australia/Sydney)' },
  { value: 'Pacific/Auckland', title: '奥克兰、惠灵顿 (Pacific/Auckland)' },
  { value: 'Pacific/Honolulu', title: '檀香山、夏威夷 (Pacific/Honolulu)' },
  { value: 'UTC', title: '世界协调时 (UTC)' },
];

/**
 * 获取可供选择的时区选项列表
 *
 * @returns 时区选项数组
 */
export function getTimezoneOptions(): TimezoneOption[] {
  const sys = getSystemTimezone();
  const list: TimezoneOption[] = PRESET_TIMEZONES.map((item) => ({
    value: item.value,
    title: `[${getTimezoneOffsetString(item.value)}] ${item.title}`,
    offset: getTimezoneOffsetString(item.value),
    isSystem: item.value === sys,
  }));

  // 若当前系统时区不在预设列表中，自动置顶插入
  if (!list.some((i) => i.value === sys)) {
    list.unshift({
      value: sys,
      title: `[${getTimezoneOffsetString(sys)}] 系统时区 (${sys})`,
      offset: getTimezoneOffsetString(sys),
      isSystem: true,
    });
  }

  return list;
}

/**
 * 获取当前全局生效的应用语言标识
 *
 * @returns 当前语言代码（如 zh-CN, en-US, zh-TW）
 */
export function getAppLocale(): string {
  try {
    const appI18n = getAppI18n();
    const loc = appI18n?.global?.locale;
    const val = typeof loc === 'object' && loc !== null ? loc.value : loc;
    if (typeof val === 'string' && val) return val;
  } catch {
    // 忽略异常
  }
  return DEFAULT_LANG;
}

/**
 * 统一规范化时间为毫秒时间戳
 * 自动识别秒级 Unix 时间戳 (< 1e11)、毫秒时间戳、Date 对象及日期字符串
 *
 * @param date 时间数据（Date | string | number | unknown）
 * @returns 毫秒时间戳（无效时返回 0）
 */
export function normalizeTimestamp(date?: Date | string | number | null | unknown): number {
  if (!date) return 0;
  if (date instanceof Date) {
    const t = date.getTime();
    return isNaN(t) ? 0 : t;
  }
  const num = typeof date === 'string' && !isNaN(Number(date)) && date.trim() !== '' ? Number(date) : date;
  if (typeof num === 'number') {
    if (isNaN(num)) return 0;
    return num < 1e11 ? num * 1000 : num;
  }
  const parsed = new Date(date as any).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 转换时间戳为毫秒的别名函数（与历史实现命名保持兼容）
 */
export const formatTimestamp = normalizeTimestamp;

/**
 * 按当前生效的用户时区格式化日期时间
 *
 * @param date 日期时间
 * @param options Intl.DateTimeFormatOptions 配置项
 * @param timeZone 可选指定时区，缺省为当前用户时区
 * @param locale 可选指定语言代码，缺省为当前应用语言
 * @returns 格式化后的字符串
 */
export function formatDateInUserTimezone(
  date?: Date | string | number | null | unknown,
  options?: Intl.DateTimeFormatOptions,
  timeZone?: string,
  locale?: string
): string {
  if (!date) return '';
  const ts = normalizeTimestamp(date);
  if (!ts) return '';
  const d = new Date(ts);

  const tz = timeZone || getUserTimezone();
  const loc = locale || getAppLocale();
  try {
    return new Intl.DateTimeFormat(loc, {
      timeZone: tz,
      ...options,
    }).format(d);
  } catch {
    return d.toLocaleString(loc);
  }
}

/**
 * 格式化时间为指定/用户时区的精确小时字符串 (YYYY-MM-DD HH:00)
 *
 * @param date 日期时间
 * @param timeZone 可选指定时区
 * @returns 形如 2026-10-27 14:00 的文本
 */
export function formatHourInUserTimezone(
  date?: Date | string | number | null,
  timeZone?: string
): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const tz = timeZone || getUserTimezone();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const h = parts.find((p) => p.type === 'hour')?.value;
    return `${y}-${m}-${day} ${h}:00`;
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
  }
}

/**
 * 格式化相对发布时间（完整多语言支持，超出相对天数后回退为当前时区与语言的常规时间）
 *
 * @param date 日期时间字符串、时间戳或 Date 对象
 * @param t 可选的 i18n 翻译函数
 * @param options 配置选项（最大相对天数 maxDays、指定时区 timeZone、指定语言 locale 等）
 * @returns 格式化后的时间文本
 */
export function formatRelativeTime(
  date?: Date | string | number | null | unknown,
  t?: (key: string, values?: any) => string,
  options?: {
    maxDays?: number;
    timeZone?: string;
    locale?: string;
  }
): string {
  if (!date) return '';
  const raw = typeof date === 'string' && !isNaN(Number(date)) && date.trim() !== '' ? Number(date) : date;
  const d = raw instanceof Date ? raw : new Date(raw as any);
  if (isNaN(d.getTime())) return '';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const maxDays = options?.maxDays ?? 30;

  const translate = (key: string, params?: Record<string, any>): string => {
    try {
      if (typeof t === 'function') {
        return t(key, params);
      }
      const appI18n = getAppI18n();
      const composer = appI18n?.global;
      if (composer && typeof composer.t === 'function') {
        return composer.t(key, params || {});
      }
    } catch {
      // 忽略多语言上下文未就绪异常
    }
    return key;
  };

  if (diffSec < 60) {
    return translate('basic.relativeTime.justNow');
  }

  if (diffMin < 60) {
    return translate('basic.relativeTime.minutesAgo', { n: Math.max(1, diffMin) });
  }

  if (diffHour < 24) {
    return translate('basic.relativeTime.hoursAgo', { n: Math.max(1, diffHour) });
  }

  if (diffDay < maxDays) {
    return translate('basic.relativeTime.daysAgo', { n: Math.max(1, diffDay) });
  }

  return formatDateInUserTimezone(
    d,
    {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    },
    options?.timeZone,
    options?.locale
  );
}

/**
 * 格式化持续时长（支持多语言）
 *
 * @param ms 毫秒数
 * @param t 可选的 i18n 翻译函数
 * @param options 配置项
 * @returns 格式化后的时长文本（如 "2 小时 15 分钟" / "2h 15m"）
 */
export function formatDuration(
  ms: number,
  t?: (key: string, values?: any) => string,
  options?: {
    showSeconds?: boolean;
    locale?: string;
  }
): string {
  if (ms <= 0) return '';

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const translate = (key: string, params?: Record<string, any>): string => {
    try {
      if (typeof t === 'function') {
        return t(key, params);
      }
      const appI18n = getAppI18n();
      const composer = appI18n?.global;
      if (composer && typeof composer.t === 'function') {
        return composer.t(key, params || {});
      }
    } catch {
      // 忽略多语言上下文未就绪异常
    }
    return key;
  };

  if (totalDays > 0) {
    const d = totalDays;
    const h = totalHours % 24;
    return h > 0
      ? translate('basic.duration.daysHours', { days: d, hours: h, d, h })
      : translate('basic.duration.days', { days: d, d });
  }

  if (totalHours > 0) {
    const h = totalHours;
    const m = totalMinutes % 60;
    return m > 0
      ? translate('basic.duration.hoursMinutes', { hours: h, minutes: m, h, m })
      : translate('basic.duration.hours', { hours: h, h });
  }

  if (totalMinutes > 0) {
    const m = totalMinutes;
    const s = totalSeconds % 60;
    if (options?.showSeconds && s > 0) {
      return translate('basic.duration.minutesSeconds', { minutes: m, seconds: s, m, s });
    }
    return translate('basic.duration.minutes', { minutes: m, m });
  }

  const s = Math.max(1, totalSeconds);
  return translate('basic.duration.seconds', { seconds: s, s });
}

/**
 * 格式化目标到期剩余时间 / 倒计时文案（支持多语言，到期自动回退为过期文本）
 *
 * @param targetTime 目标过期时间（时间戳/Date/字符串）
 * @param t 可选的 i18n 翻译函数
 * @param options 配置选项（expiredText: 自定义过期文本）
 * @returns 格式化后的剩余时间文本
 */
export function formatRemainingTime(
  targetTime?: Date | string | number | null | unknown,
  t?: (key: string, values?: any) => string,
  options?: {
    expiredText?: string;
    showSeconds?: boolean;
    locale?: string;
  }
): string {
  if (!targetTime) return '';
  const expiresMs = normalizeTimestamp(targetTime);
  if (!expiresMs) return '';

  const diffMs = expiresMs - Date.now();
  if (diffMs <= 0) {
    if (options?.expiredText) return options.expiredText;
    try {
      if (typeof t === 'function') return t('basic.duration.expired');
      const appI18n = getAppI18n();
      const composer = appI18n?.global;
      if (composer && typeof composer.t === 'function') {
        return composer.t('basic.duration.expired');
      }
    } catch {
      // 忽略异常
    }
    return '';
  }

  return formatDuration(diffMs, t, options);
}

export default class Time {
  DATE;

  constructor() {
    this.DATE = new Date()
  }

  /**
   * 获取当前时间戳
   */
  get nowTimeStamp() {
    return this.DATE.getTime()
  }

  /**
   * 更新为最新时间对象
   */
  update() {
    this.DATE = new Date()
    return this
  }

  /**
   * 程序启动时间
   */
  get appStart() {
    return 1541260800000;
  }

  /**
   * 程序启动 Date 对象
   */
  get appStartDate() {
    return new Date(this.appStart)
  }

  /**
   * 获取当前生效时区
   */
  get timezone() {
    return getUserTimezone()
  }

  /**
   * 计算剩余天数
   * @param endData 目标日期
   * @returns {number | null} 剩余天数，如果不在赛季内则返回 null
   */
  calcRemainingDays(endData: string | number | Date): number | null {
    const endDate = new Date(endData)
    const now = new Date()
    const currentDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate())

    const targetPureDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate())

    const remainingMs = targetPureDate.getTime() - currentDate.getTime()
    const remainingDays = Math.floor(remainingMs / 86400000)

    return remainingDays >= 0 ? remainingDays : 0;
  }
}
