import type { ReminderPresetConfig } from '@/assets/types/Reminder';

/**
 * 活动提醒预设配置
 * 存放于 /src/config/reminderPresets.ts
 */
export const REMINDER_PRESETS: ReminderPresetConfig[] = [
    {
        id: 'preset-cheese-refresh',
        title: '奶酪！',
        titleKey: 'reminder.presets.cheese.title',
        description: '奶酪刷新啦！',
        descKey: 'reminder.presets.cheese.desc',
        scheduleType: 'repeat',
        repeatType: 'interval',
        repeatIntervalUnit: 'hour',
        repeatIntervalValue: 1,
        repeatIntervalHours: 1, // 每 1 小时触发
        advanceNoticeEnabled: true, // 提前提醒
        advanceMinutes: 1, // 提前 1 分钟
        validityType: 'permanent', // 有效期永久
        notifyEnabled: true, // 默认开启通知
        note: '奶酪刷新啦！可在地图各商贩处购买或刷新收集。',
        noteKey: 'reminder.presets.cheese.note'
    },
    {
        id: 'preset-helm-takeover',
        title: '海舵社:接管机遇',
        titleKey: 'reminder.presets.helmTakeover.title',
        description: '下一个接管机遇刷新时间',
        descKey: 'reminder.presets.helmTakeover.desc',
        scheduleType: 'repeat',
        repeatType: 'interval',
        repeatIntervalUnit: 'hour',
        repeatIntervalValue: 1,
        repeatIntervalHours: 1, // 每 1 小时触发
        advanceNoticeEnabled: true, // 提前提醒
        advanceMinutes: 5, // 提前 5 分钟
        validityType: 'permanent', // 有效期永久
        notifyEnabled: true, // 默认开启通知
        note: '海舵社接管机遇已刷新，请及时前往参与接管。',
        noteKey: 'reminder.presets.helmTakeover.note'
    },
    {
        id: 'preset-helm-war-event',
        title: '战争事件',
        titleKey: 'reminder.presets.helmWarEvent.title',
        description: '下一个战争事件刷新时间',
        descKey: 'reminder.presets.helmWarEvent.desc',
        scheduleType: 'repeat',
        repeatType: 'interval',
        repeatIntervalUnit: 'minute',
        repeatIntervalValue: 30, // 每 30 分钟触发
        advanceNoticeEnabled: true, // 提前提醒
        advanceMinutes: 5, // 提前 5 分钟
        validityType: 'permanent', // 有效期永久
        notifyEnabled: true, // 默认开启通知
        note: '战争事件已开启，准备参与争夺与交锋。',
        noteKey: 'reminder.presets.helmWarEvent.note'
    },
    {
        id: 'preset-game-maintenance',
        title: '游戏维护',
        titleKey: 'reminder.presets.maintenance.title',
        description: '日常游戏维护时间，具体查看游戏公告',
        descKey: 'reminder.presets.maintenance.desc',
        scheduleType: 'repeat',
        repeatType: 'weekly',
        repeatDays: [2], // 每周二 (Tuesday)
        repeatTime: '14:00', // 下午 2 点 (按系统时间 / 北京时间 14:00，对应服务器/新加坡早上 6:00 UTC)
        validityType: 'permanent', // 有效期永久
        notifyEnabled: true, // 默认开启通知
        note: '日常游戏维护时间，具体查看游戏官方公告与维护通知。',
        noteKey: 'reminder.presets.maintenance.note'
    }
];

export default REMINDER_PRESETS;
