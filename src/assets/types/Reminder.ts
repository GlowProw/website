/**
 * 活动提醒 (Activity Reminder) 相关类型定义
 */

export type ReminderScheduleType = 'repeat' | 'once';
export type ReminderRepeatType = 'weekly' | 'interval';
export type ReminderIntervalUnit = 'day' | 'hour' | 'minute' | 'second';
export type ReminderAdvanceUnit = 'hour' | 'minute' | 'second';
export type ReminderValidityType = 'permanent' | 'range';

export type ReminderCategory = 'activity' | 'system' | 'favorite' | string;
export type MultilingualText = string | Record<string, string>;

export interface ReminderTask {
    id: string; // uuid: 任务唯一标识 (存储 key: task.{id})
    title: MultilingualText; // 活动标题 (支持多语言对象或直接字符串)
    categories?: ReminderCategory[]; // 任务分类 (可选，支持多选: 活动 / 系统 / 最爱)
    description?: MultilingualText; // 描述 (支持多语言对象或直接字符串)
    scheduleType: ReminderScheduleType; // 定时类型: 重复 / 一次性
    repeatType?: ReminderRepeatType; // 重复方式: 每周固定日期 / 固定时间间隔
    repeatDays?: number[]; // 重复包含周一至周日 [1, 2, 3, 4, 5, 6, 7] (1=周一, 7=周日)
    repeatTime?: string; // 触发时间 (HH:mm)，例如 "14:00"
    repeatIntervalUnit?: ReminderIntervalUnit; // 间隔时间单位: 天 / 小时 / 分钟 / 秒
    repeatIntervalValue?: number; // 间隔数值 (例如 1, 2, 30, 45)
    repeatIntervalHours?: number; // 兼容旧字段: 间隔小时数，例如 1 (每 1 小时)
    targetTime?: number | string; // 一次性截止/触发时间 (时间戳或 ISO 日期字符串)
    advanceNoticeEnabled?: boolean; // 是否开启提前提醒
    advanceUnit?: ReminderAdvanceUnit; // 提前提醒单位: 秒 / 分钟 / 小时 (默认: minute)
    advanceValue?: number; // 提前提醒数值 (例如 30秒, 5分钟, 1小时)
    advanceMinutes?: number; // 兼容旧字段: 提前提醒分钟数 (例如 1, 10, 30, 60 或自定义分钟)
    validityType?: ReminderValidityType; // 任务有效期类型: permanent (永久) | range (指定起止时间)
    validFrom?: number | string; // 有效期起始时间 (YYYY-MM-DD HH:mm 或时间戳)
    validTo?: number | string; // 有效期截止时间 (YYYY-MM-DD HH:mm 或时间戳)
    note?: MultilingualText; // 备注说明 (限制 5000 字)
    enabled: boolean; // 是否启用任务 (总开关/计时开关)
    notifyEnabled?: boolean; // 是否发送通知 (单独的通知开关，默认是 true)
    createdTime: number; // 创建时间戳
    updatedTime?: number; // 更新时间戳
    lastTriggeredTime?: number; // 最近一次触发时间戳
    lastAdvanceTriggeredTime?: number; // 最近一次提前提醒触发时间戳
    isPreset?: boolean; // 是否为预设任务
    presetKey?: string; // 预设标识
    titleKey?: string; // 兼容旧字段
    descKey?: string; // 兼容旧字段
    noteKey?: string; // 兼容旧字段
}

export interface ReminderPresetConfig {
    id: string;
    title: MultilingualText;
    titleKey?: string;
    categories?: ReminderCategory[];
    description?: MultilingualText;
    descKey?: string;
    scheduleType: ReminderScheduleType;
    repeatType: ReminderRepeatType;
    repeatDays?: number[];
    repeatTime?: string;
    repeatIntervalUnit?: ReminderIntervalUnit;
    repeatIntervalValue?: number;
    repeatIntervalHours?: number;
    targetTime?: number | string;
    advanceNoticeEnabled?: boolean;
    advanceUnit?: ReminderAdvanceUnit;
    advanceValue?: number;
    advanceMinutes?: number;
    validityType?: ReminderValidityType;
    validFrom?: number | string;
    validTo?: number | string;
    notifyEnabled?: boolean;
    note?: MultilingualText;
    noteKey?: string;
}

export interface ReminderNextTriggerInfo {
    nextTriggerTime: number | null;
    targetEventTime?: number | null;
    remainingSeconds: number;
    formattedCountdown: string;
    status: 'active' | 'imminent' | 'expired' | 'paused' | 'not_started';
    isAdvanceNotice?: boolean;
    advanceUnit?: ReminderAdvanceUnit;
    advanceValue?: number;
    advanceText?: string;
    advanceMinutes?: number;
}


