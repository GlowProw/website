/**
 * 时间与时区工具
 */
import { ref } from 'vue';

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
 * 按当前生效的用户时区格式化日期时间
 *
 * @param date 日期时间
 * @param options Intl.DateTimeFormatOptions 配置项
 * @param timeZone 可选指定时区，缺省为当前用户时区
 * @returns 格式化后的字符串
 */
export function formatDateInUserTimezone(
  date?: Date | string | number | null,
  options?: Intl.DateTimeFormatOptions,
  timeZone?: string
): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const tz = timeZone || getUserTimezone();
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      ...options,
    }).format(d);
  } catch {
    return d.toLocaleString();
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
