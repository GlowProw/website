/**
 * 活动提醒计算工具
 * 负责计算下一次提醒的触发时机、提前提醒、有效期检测以及格式化倒计时
 */
import type { MultilingualText, ReminderNextTriggerInfo, ReminderTask } from '@/assets/types/Reminder';

/**
 * 解析并获取多语言文本（轻量级无依赖实现，避免 Worker 打包进完整 i18n 字典）
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
            const raw = localStorage.getItem('lang');
            if (raw) {
                const parsed = JSON.parse(raw);
                currentLocale = parsed?.data?.value?.value || parsed?.value?.value || parsed?.value || parsed || '';
            }
        } catch {}
    }
    if (!currentLocale) currentLocale = 'zh-CN';
    const fallback = 'zh-CN';

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
 * 完整计算任务的下一次触发信息（包含提前提醒与有效期判定）
 */
export function calculateTaskNextTriggerInfo(
    task: ReminderTask,
    now: number = Date.now()
): ReminderNextTriggerInfo {
    if (!task || !task.enabled) {
        return {
            nextTriggerTime: null,
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
                remainingSeconds: 0,
                formattedCountdown: '--:--',
                status: 'expired'
            };
        }

        // 如果尚未到达有效期开始时间
        if (validFrom !== null && now < validFrom) {
            const fromStartEvent = calculateBaseEventTime(task, validFrom - 1);
            const advanceMs = (task.advanceNoticeEnabled && task.advanceMinutes) ? task.advanceMinutes * 60000 : 0;
            const nextTrigger = fromStartEvent ? (advanceMs > 0 ? fromStartEvent - advanceMs : fromStartEvent) : validFrom;

            return {
                nextTriggerTime: nextTrigger,
                remainingSeconds: Math.max(0, Math.floor((validFrom - now) / 1000)),
                formattedCountdown: '--:--',
                status: 'not_started'
            };
        }
    }

    // 计算提前提醒时间
    const advanceMinutes = (task.advanceNoticeEnabled && task.advanceMinutes && task.advanceMinutes > 0)
        ? task.advanceMinutes
        : 0;
    const advanceMs = advanceMinutes * 60 * 1000;

    let nextTriggerTime: number | null = null;
    let isAdvance = false;

    if (task.scheduleType === 'once') {
        const target = parseDateTime(task.targetTime);
        if (target === null) {
            return {
                nextTriggerTime: null,
                remainingSeconds: 0,
                formattedCountdown: '--:--',
                status: 'paused'
            };
        }

        if (advanceMs > 0) {
            const advTarget = target - advanceMs;
            if (now < advTarget) {
                nextTriggerTime = advTarget;
                isAdvance = true;
            } else if (now < target) {
                nextTriggerTime = target;
                isAdvance = false;
            } else {
                return {
                    nextTriggerTime: target,
                    remainingSeconds: 0,
                    formattedCountdown: '00:00:00',
                    status: 'expired'
                };
            }
        } else {
            if (now < target) {
                nextTriggerTime = target;
                isAdvance = false;
            } else {
                return {
                    nextTriggerTime: target,
                    remainingSeconds: 0,
                    formattedCountdown: '00:00:00',
                    status: 'expired'
                };
            }
        }
    } else {
        // 周期性任务
        const baseEvent = calculateBaseEventTime(task, now);
        if (baseEvent === null) {
            return {
                nextTriggerTime: null,
                remainingSeconds: 0,
                formattedCountdown: '--:--',
                status: 'paused'
            };
        }

        if (advanceMs > 0) {
            const advTime = baseEvent - advanceMs;
            if (now < advTime) {
                nextTriggerTime = advTime;
                isAdvance = true;
            } else {
                // 当前时间处于提前提醒与正点之间，下一次提醒为正点
                nextTriggerTime = baseEvent;
                isAdvance = false;
            }
        } else {
            nextTriggerTime = baseEvent;
            isAdvance = false;
        }
    }

    // 再次核实是否超出有效期区间
    if (task.validityType === 'range') {
        const validTo = parseDateTime(task.validTo);
        if (validTo !== null && nextTriggerTime !== null && nextTriggerTime > validTo) {
            return {
                nextTriggerTime: null,
                remainingSeconds: 0,
                formattedCountdown: '--:--',
                status: 'expired'
            };
        }
    }

    if (nextTriggerTime === null) {
        return {
            nextTriggerTime: null,
            remainingSeconds: 0,
            formattedCountdown: '--:--',
            status: 'paused'
        };
    }

    const diffMs = nextTriggerTime - now;
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

    return {
        nextTriggerTime,
        remainingSeconds,
        formattedCountdown,
        status,
        isAdvanceNotice: isAdvance,
        advanceMinutes: advanceMinutes
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
    advanceMinutes: number;
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
            const advanceMs = (task.advanceNoticeEnabled && task.advanceMinutes) ? task.advanceMinutes * 60000 : 0;
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
    const advanceMinutes = (task.advanceNoticeEnabled && task.advanceMinutes && task.advanceMinutes > 0)
        ? task.advanceMinutes
        : 0;
    const advanceMs = advanceMinutes * 60 * 1000;

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
                        advanceMinutes,
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

