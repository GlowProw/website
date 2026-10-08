/**
 * 活动提醒计算工具
 * 负责计算下一次提醒的触发时机、提前提醒、有效期检测以及格式化倒计时
 */
import type { MultilingualText, ReminderNextTriggerInfo, ReminderTask } from '@/assets/types/Reminder';
import { DEFAULT_LANG, FALLBACK_LANG } from '@/config/languages';
import Storage from './storage';

const storage = new Storage();

/**
 * 解析并获取多语言文本
 * 兼顾主线程与 Web Worker 运行环境
 */
export function getLocalizedText(
    text: MultilingualText | undefined | null,
    targetLocale?: string
): string {
    if (!text) return '';
    if (typeof text === 'string') return text;
    if (typeof text !== 'object') return String(text);

    let currentLocale: string = targetLocale || '';
    if (!currentLocale && typeof window !== 'undefined') {
        try {
            if (window.location && window.location.pathname) {
                const pathSeg = window.location.pathname.split('/').filter(Boolean)[0];
                if (pathSeg && (pathSeg === 'zh-CN' || pathSeg === 'zh-TW' || pathSeg === 'en-US')) {
                    currentLocale = pathSeg;
                }
            }
            if (!currentLocale) {
                const res = storage.local.get('lang');
                if (res.code === 0 && res.data) {
                    const v = res.data.value;
                    currentLocale = (v && typeof v === 'object' ? v.value : v) || '';
                }
            }
        } catch { }
    }
    if (!currentLocale) currentLocale = DEFAULT_LANG;
    const fallback = FALLBACK_LANG;

    const findInDict = (localeKey: string | undefined): string | null => {
        if (!localeKey || typeof localeKey !== 'string') return null;

        if (text[localeKey] !== undefined && text[localeKey] !== '') {
            return text[localeKey];
        }

        const underscoreKey = localeKey.replace(/-/g, '_');
        if (text[underscoreKey] !== undefined && text[underscoreKey] !== '') {
            return text[underscoreKey];
        }

        const hyphenKey = localeKey.replace(/_/g, '-');
        if (text[hyphenKey] !== undefined && text[hyphenKey] !== '') {
            return text[hyphenKey];
        }

        const normalizedTarget = localeKey.toLowerCase().replace(/[-_]/g, '');
        for (const [k, v] of Object.entries(text)) {
            if (k.toLowerCase().replace(/[-_]/g, '') === normalizedTarget && v !== undefined && v !== '') {
                return v;
            }
        }

        const shortKey = localeKey.split(/[-_]/)[0].toLowerCase();
        for (const [k, v] of Object.entries(text)) {
            if (k.toLowerCase().split(/[-_]/)[0] === shortKey && v !== undefined && v !== '') {
                return v;
            }
        }

        return null;
    };

    const valByLocale = findInDict(currentLocale);
    if (valByLocale !== null) return valByLocale;

    const valByFallback = findInDict(fallback);
    if (valByFallback !== null) return valByFallback;

    const firstVal = Object.values(text).find(v => typeof v === 'string' && v.trim() !== '');
    return firstVal || '';
}

/**
 * 获取任务本地化标题（优先通过 i18n key 翻译，再读取多语言对象）
 */
export function getTaskLocalizedTitle(
    task: ReminderTask | undefined | null,
    targetLocale?: string,
    t?: (key: string, values?: any, lang?: string) => string
): string {
    if (!task) return '';
    if (task.titleKey && t) {
        const trans = t(task.titleKey, null, targetLocale);
        if (trans && trans !== task.titleKey) return trans;
    }
    return getLocalizedText(task.title, targetLocale);
}

/**
 * 获取任务本地化说明/备注（优先通过 i18n key 翻译，再读取多语言对象）
 */
export function getTaskLocalizedNote(
    task: ReminderTask | undefined | null,
    targetLocale?: string,
    t?: (key: string, values?: any, lang?: string) => string
): string {
    if (!task) return '';
    if (task.noteKey && t) {
        const trans = t(task.noteKey, null, targetLocale);
        if (trans && trans !== task.noteKey) return trans;
    }
    if (task.descKey && t) {
        const trans = t(task.descKey, null, targetLocale);
        if (trans && trans !== task.descKey) return trans;
    }
    return getLocalizedText(task.note || task.description, targetLocale);
}

/**
 * 解析日期时间字符串或时间戳为毫秒时间戳
 */
export function parseDateTime(val?: number | string | null): number | null {
    if (!val) return null;
    if (typeof val === 'number') {
        return isNaN(val) ? null : val;
    }
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return null;
        if (/^\d+$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);
            return isNaN(num) ? null : num;
        }
        // 将 "YYYY-MM-DD HH:mm" 标准化为 ISO 兼容格式
        const standardStr = trimmed.replace(' ', 'T');
        const timestamp = new Date(standardStr).getTime();
        return isNaN(timestamp) ? null : timestamp;
    }
    return null;
}

/**
 * 计算事件本身的基准触发时间戳（不含提前提醒偏移）
 */
export function calculateBaseEventTime(task: ReminderTask, fromTime: number = Date.now()): number | null {
    if (!task) return null;

    // 一次性提醒任务：直接使用设定的目标时间
    if (task.scheduleType === 'once') {
        return parseDateTime(task.targetTime);
    }

    // 周期重复任务
    if (task.scheduleType === 'repeat') {
        // 固定时间间隔循环（支持：天 / 小时 / 分钟 / 秒）
        if (task.repeatType === 'interval') {
            const unit = task.repeatIntervalUnit || 'hour';
            const val = Math.max(0.01, Number(task.repeatIntervalValue ?? task.repeatIntervalHours) || 1);
            const now = new Date(fromTime);

            if (unit === 'second') {
                const intervalMs = Math.max(1000, Math.round(val * 1000));
                return Math.floor(fromTime / intervalMs + 1) * intervalMs;
            }

            if (unit === 'minute') {
                const intervalMs = Math.round(val * 60 * 1000);
                // 针对整除 60 的标准分钟（如 1、5、10、15、30 分钟），对齐系统整分钟整秒
                if (val >= 1 && 60 % val === 0) {
                    const currentSec = now.getSeconds();
                    const currentMin = now.getMinutes();
                    if (val === 1) {
                        const nextMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), currentMin + 1, 0, 0);
                        return nextMin.getTime();
                    }
                    const nextTargetMin = (Math.floor(currentMin / val) + 1) * val;
                    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), nextTargetMin, 0, 0);
                    return targetDate.getTime();
                }
                return Math.floor(fromTime / intervalMs + 1) * intervalMs;
            }

            if (unit === 'hour') {
                const intervalMs = val * 3600 * 1000;
                // 针对标准整小时，对齐系统整点
                if (val === 1) {
                    const nextHourDate = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        now.getHours() + 1,
                        0,
                        0,
                        0
                    );
                    return nextHourDate.getTime();
                }

                if (val >= 1 && 24 % val === 0) {
                    const currentHour = now.getHours();
                    const nextTargetHour = (Math.floor(currentHour / val) + 1) * val;
                    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextTargetHour, 0, 0, 0);
                    return targetDate.getTime();
                }

                return Math.floor(fromTime / intervalMs + 1) * intervalMs;
            }

            if (unit === 'day') {
                const days = Math.max(1, Math.round(val));
                const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 0, 0, 0, 0);
                return nextDay.getTime();
            }

            const fallbackIntervalMs = val * 3600 * 1000;
            return Math.floor(fromTime / fallbackIntervalMs + 1) * fallbackIntervalMs;
        }

        // 按星期几和具体时间重复（例如每周二 14:00）
        const repeatDays = (Array.isArray(task.repeatDays) && task.repeatDays.length > 0)
            ? task.repeatDays
            : [1, 2, 3, 4, 5, 6, 7];

        const timeStr = task.repeatTime || '00:00';
        const [hoursStr, minutesStr] = timeStr.split(':');
        const targetHours = parseInt(hoursStr || '0', 10);
        const targetMinutes = parseInt(minutesStr || '0', 10);

        const now = new Date(fromTime);
        let nextCandidate: number | null = null;

        // 遍历未来一周内的每一天，找到符合星期要求且早于当前时间的最近时间点
        for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
            const checkDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + dayOffset,
                targetHours,
                targetMinutes,
                0,
                0
            );

            const jsDay = checkDate.getDay();
            const normalizedDay = jsDay === 0 ? 7 : jsDay;

            if (repeatDays.includes(normalizedDay)) {
                const candidateTime = checkDate.getTime();
                if (candidateTime > fromTime) {
                    if (nextCandidate === null || candidateTime < nextCandidate) {
                        nextCandidate = candidateTime;
                    }
                }
            }
        }

        return nextCandidate;
    }

    return null;
}

/**
 * 获取任务设置的提前提醒毫秒数
 */
export function getAdvanceMs(task: ReminderTask): number {
    if (!task || !task.advanceNoticeEnabled) return 0;
    const unit = task.advanceUnit || 'minute';
    const val = task.advanceValue ?? task.advanceMinutes ?? 0;
    if (val <= 0) return 0;
    if (unit === 'second') return Math.max(1000, Math.round(val * 1000));
    if (unit === 'hour') return Math.max(1000, Math.round(val * 3600 * 1000));
    return Math.max(1000, Math.round(val * 60 * 1000));
}

/**
 * 格式化提前时间文案 (例如: "30 秒", "5 分钟", "1 小时")
 */
export function formatAdvanceText(
    unit: 'hour' | 'minute' | 'second' = 'minute',
    val: number = 1,
    t?: (key: string, values?: any) => string
): string {
    const unitKey = `reminder.units.${unit}`;
    const unitText = t ? t(unitKey) : (unit === 'second' ? '秒' : unit === 'hour' ? '小时' : '分钟');
    return `${val} ${unitText}`;
}

/**
 * 完整计算任务的下一次触发信息（包含提前提醒与有效期判定）
 * 注意：倒计时严格以真实目标到点时间进行计算，开启提前提醒不缩短原始倒计时！
 */
export function calculateTaskNextTriggerInfo(
    task: ReminderTask,
    now: number = Date.now()
): ReminderNextTriggerInfo {
    if (!task || !task.enabled) {
        return {
            nextTriggerTime: null,
            targetEventTime: null,
            remainingSeconds: 0,
            formattedCountdown: '--:--',
            status: 'paused'
        };
    }

    // 校验任务有效期区间
    if (task.validityType === 'range') {
        const validFrom = parseDateTime(task.validFrom);
        const validTo = parseDateTime(task.validTo);

        // 如果已超出有效期截止时间
        if (validTo !== null && now > validTo) {
            return {
                nextTriggerTime: null,
                targetEventTime: null,
                remainingSeconds: 0,
                formattedCountdown: '--:--',
                status: 'expired'
            };
        }

        // 如果尚未到达有效期开始时间
        if (validFrom !== null && now < validFrom) {
            const fromStartEvent = calculateBaseEventTime(task, validFrom - 1) || validFrom;
            return {
                nextTriggerTime: fromStartEvent,
                targetEventTime: fromStartEvent,
                remainingSeconds: Math.max(0, Math.floor((validFrom - now) / 1000)),
                formattedCountdown: '--:--',
                status: 'not_started'
            };
        }
    }

    // 计算基准事件到点时间戳（任务真实的倒计时目标时间）
    let targetEventTime: number | null = null;

    if (task.scheduleType === 'once') {
        targetEventTime = parseDateTime(task.targetTime);
    } else {
        targetEventTime = calculateBaseEventTime(task, now);
    }

    if (targetEventTime === null) {
        return {
            nextTriggerTime: null,
            targetEventTime: null,
            remainingSeconds: 0,
            formattedCountdown: '--:--',
            status: 'paused'
        };
    }

    // 校验是否超出有效期截止时间
    if (task.validityType === 'range') {
        const validTo = parseDateTime(task.validTo);
        if (validTo !== null && targetEventTime > validTo) {
            return {
                nextTriggerTime: null,
                targetEventTime: null,
                remainingSeconds: 0,
                formattedCountdown: '--:--',
                status: 'expired'
            };
        }
    }

    // 倒计时核心计算：严密以真实目标时间 targetEventTime 倒数！
    const diffMs = targetEventTime - now;

    if (task.scheduleType === 'once' && diffMs <= 0) {
        return {
            nextTriggerTime: targetEventTime,
            targetEventTime: targetEventTime,
            remainingSeconds: 0,
            formattedCountdown: '00:00:00',
            status: 'expired'
        };
    }

    const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));

    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    let formattedCountdown = '';
    if (days > 0) {
        formattedCountdown = `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
        formattedCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    let status: 'active' | 'imminent' | 'expired' | 'paused' | 'not_started' = 'active';
    if (remainingSeconds <= 300 && remainingSeconds > 0) {
        status = 'imminent';
    }

    // 提前提醒状态判定：当开启提前提醒且当前剩余时间已进入提前提醒区间内时标记 isAdvanceNotice
    const advanceMs = getAdvanceMs(task);
    const isAdvance = advanceMs > 0 && diffMs > 0 && diffMs <= advanceMs;

    const advanceUnit = task.advanceUnit || 'minute';
    const advanceValue = task.advanceValue ?? task.advanceMinutes ?? 0;
    const advanceMinutes = advanceUnit === 'second'
        ? advanceValue / 60
        : advanceUnit === 'hour'
            ? advanceValue * 60
            : advanceValue;

    return {
        nextTriggerTime: targetEventTime,
        targetEventTime: targetEventTime,
        remainingSeconds,
        formattedCountdown,
        status,
        isAdvanceNotice: isAdvance,
        advanceUnit,
        advanceValue,
        advanceText: formatAdvanceText(advanceUnit, advanceValue),
        advanceMinutes
    };
}

/**
 * 快速计算下一次触发时间戳
 */
export function calculateNextTriggerTime(task: ReminderTask, fromTime: number = Date.now()): number | null {
    return calculateTaskNextTriggerInfo(task, fromTime).nextTriggerTime;
}

/**
 * 格式化倒计时和状态
 */
export function formatCountdown(
    nextTriggerTime: number | null,
    now: number = Date.now(),
    isEnabled: boolean = true,
    scheduleType: string = 'repeat'
): ReminderNextTriggerInfo {
    if (!isEnabled || nextTriggerTime === null) {
        return {
            nextTriggerTime,
            remainingSeconds: 0,
            formattedCountdown: '--:--',
            status: 'paused'
        };
    }

    const diffMs = nextTriggerTime - now;
    const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));

    if (diffMs <= 0 && scheduleType === 'once') {
        return {
            nextTriggerTime,
            remainingSeconds: 0,
            formattedCountdown: '00:00:00',
            status: 'expired'
        };
    }

    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    let formattedCountdown = '';
    if (days > 0) {
        formattedCountdown = `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
        formattedCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    let status: 'active' | 'imminent' | 'expired' | 'paused' = 'active';
    if (remainingSeconds <= 300 && remainingSeconds > 0) {
        status = 'imminent';
    }

    return {
        nextTriggerTime,
        remainingSeconds,
        formattedCountdown,
        status
    };
}

export interface TaskPendingTrigger {
    triggerKey: string;
    isAdvance: boolean;
    advanceUnit?: 'hour' | 'minute' | 'second';
    advanceValue?: number;
    advanceMinutes: number;
    advanceText?: string;
    eventTime: number;
}

/**
 * 检查当前时间点 task 是否有待触发的通知（正点到达 或 提前提醒）
 * @param task 提醒任务
 * @param now 当前时间戳（默认 Date.now()）
 * @param isAlreadyTriggered 判定某个触发 key 是否已触发过的回调函数
 */
export function checkTaskPendingTriggers(
    task: ReminderTask,
    now: number = Date.now(),
    isAlreadyTriggered: (key: string) => boolean
): TaskPendingTrigger[] {
    if (!task || !task.enabled) return [];

    // 先进行有效期校验
    if (task.validityType === 'range') {
        const validFrom = parseDateTime(task.validFrom);
        const validTo = parseDateTime(task.validTo);
        if (validTo !== null && now > validTo) return [];
        if (validFrom !== null && now < validFrom) {
            const advanceMs = getAdvanceMs(task);
            if (advanceMs <= 0 || (now < validFrom - advanceMs)) {
                return [];
            }
        }
    }

    const occurrences: number[] = [];

    // 收集当前时间附近的可能触发时间点（涵盖已发生与近期即将发生）
    if (task.scheduleType === 'once') {
        const target = parseDateTime(task.targetTime);
        if (target !== null) {
            occurrences.push(target);
        }
    } else if (task.scheduleType === 'repeat') {
        if (task.repeatType === 'interval') {
            const unit = task.repeatIntervalUnit || 'hour';
            const val = Math.max(0.01, Number(task.repeatIntervalValue ?? task.repeatIntervalHours) || 1);

            if (unit === 'second') {
                const intervalMs = Math.max(1000, Math.round(val * 1000));
                const base = Math.floor(now / intervalMs) * intervalMs;
                occurrences.push(base, base + intervalMs);
            } else if (unit === 'minute') {
                const intervalMs = Math.round(val * 60 * 1000);
                if (val >= 1 && 60 % val === 0) {
                    const date = new Date(now);
                    const currentMin = date.getMinutes();
                    const currentSlotMin = Math.floor(currentMin / val) * val;
                    const prevSlotMin = currentSlotMin - val;
                    const nextSlotMin = currentSlotMin + val;

                    const tPrev = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), prevSlotMin, 0, 0).getTime();
                    const tCurr = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), currentSlotMin, 0, 0).getTime();
                    const tNext = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), nextSlotMin, 0, 0).getTime();
                    occurrences.push(tPrev, tCurr, tNext);
                } else {
                    const base = Math.floor(now / intervalMs) * intervalMs;
                    occurrences.push(base - intervalMs, base, base + intervalMs);
                }
            } else if (unit === 'hour') {
                const intervalMs = val * 3600 * 1000;
                if (val >= 1 && 24 % val === 0) {
                    const date = new Date(now);
                    const currentHour = date.getHours();
                    const currentSlotHour = Math.floor(currentHour / val) * val;
                    const prevSlotHour = currentSlotHour - val;
                    const nextSlotHour = currentSlotHour + val;

                    const tPrev = new Date(date.getFullYear(), date.getMonth(), date.getDate(), prevSlotHour, 0, 0, 0).getTime();
                    const tCurr = new Date(date.getFullYear(), date.getMonth(), date.getDate(), currentSlotHour, 0, 0, 0).getTime();
                    const tNext = new Date(date.getFullYear(), date.getMonth(), date.getDate(), nextSlotHour, 0, 0, 0).getTime();
                    occurrences.push(tPrev, tCurr, tNext);
                } else {
                    const base = Math.floor(now / intervalMs) * intervalMs;
                    occurrences.push(base - intervalMs, base, base + intervalMs);
                }
            } else if (unit === 'day') {
                const days = Math.max(1, Math.round(val));
                const date = new Date(now);
                const tPrev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - days, 0, 0, 0, 0).getTime();
                const tCurr = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
                const tNext = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0).getTime();
                occurrences.push(tPrev, tCurr, tNext);
            }
        } else if (task.repeatType === 'weekly') {
            const repeatDays = (Array.isArray(task.repeatDays) && task.repeatDays.length > 0)
                ? task.repeatDays
                : [1, 2, 3, 4, 5, 6, 7];
            const [hoursStr, minutesStr] = (task.repeatTime || '00:00').split(':');
            const targetHours = parseInt(hoursStr || '0', 10);
            const targetMinutes = parseInt(minutesStr || '0', 10);

            const date = new Date(now);
            for (let offset = -1; offset <= 2; offset++) {
                const checkDate = new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate() + offset,
                    targetHours,
                    targetMinutes,
                    0,
                    0
                );
                const jsDay = checkDate.getDay();
                const normalizedDay = jsDay === 0 ? 7 : jsDay;
                if (repeatDays.includes(normalizedDay)) {
                    occurrences.push(checkDate.getTime());
                }
            }
        }
    }

    const pendingTriggers: TaskPendingTrigger[] = [];
    const advanceMs = getAdvanceMs(task);
    const advanceUnit = task.advanceUnit || 'minute';
    const advanceValue = task.advanceValue ?? task.advanceMinutes ?? 0;
    const advanceMinutes = advanceUnit === 'second'
        ? advanceValue / 60
        : advanceUnit === 'hour'
            ? advanceValue * 60
            : advanceValue;
    const advanceText = formatAdvanceText(advanceUnit, advanceValue);

    // 触发有效时间窗口：在目标时间到达后的 90 秒内均视为有效触发期
    const TRIGGER_TOLERANCE_MS = 90000;

    for (const occurrence of occurrences) {
        // 校验 occurrence 是否在有效期区间内
        if (task.validityType === 'range') {
            const validFrom = parseDateTime(task.validFrom);
            const validTo = parseDateTime(task.validTo);
            if (validFrom !== null && occurrence < validFrom) continue;
            if (validTo !== null && occurrence > validTo) continue;
        }

        // 检查是否命中提前提醒时间
        if (advanceMs > 0) {
            const advTargetTime = occurrence - advanceMs;
            const diffAdv = now - advTargetTime;
            // 当前时间在提前提醒时间点到达后（容差 90s 内），且尚未达到正点
            if (diffAdv >= 0 && diffAdv <= TRIGGER_TOLERANCE_MS && now < occurrence) {
                const triggerKey = `${task.id}-adv-${occurrence}`;
                if (!isAlreadyTriggered(triggerKey)) {
                    pendingTriggers.push({
                        triggerKey,
                        isAdvance: true,
                        advanceUnit,
                        advanceValue,
                        advanceMinutes,
                        advanceText,
                        eventTime: occurrence
                    });
                }
            }
        }

        // 检查是否命中正点或截止触发
        const diffMain = now - occurrence;
        if (diffMain >= 0 && diffMain <= TRIGGER_TOLERANCE_MS) {
            const triggerKey = `${task.id}-main-${occurrence}`;
            if (!isAlreadyTriggered(triggerKey)) {
                pendingTriggers.push({
                    triggerKey,
                    isAdvance: false,
                    advanceMinutes: 0,
                    eventTime: occurrence
                });
            }
        }
    }

    return pendingTriggers;
}