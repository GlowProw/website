import type { ReminderPresetConfig } from '@/assets/types/Reminder';

/**
 * 活动提醒预设配置
 * 存放于 /src/config/reminderPresets.ts
 */
export const REMINDER_PRESETS: ReminderPresetConfig[] = [
    {
        id: 'preset-cheese-refresh',
        title: {
            zh_CN: '奶酪!',
            zh_TW: '奶酪!',
            en_US: 'Cheese!'
        },
        categories: ['activity'],
        description: {
            zh_CN: '奶酪刷新啦！',
            zh_TW: '奶酪刷新啦！',
            en_US: 'Cheese has refreshed!'
        },
        scheduleType: 'repeat',
        repeatType: 'interval',
        repeatIntervalUnit: 'hour',
        repeatIntervalValue: 1,
        repeatIntervalHours: 1,
        advanceNoticeEnabled: true,
        advanceMinutes: 1,
        validityType: 'permanent',
        notifyEnabled: true,
        note: {
            zh_CN: '奶酪刷新啦！可在地图各商贩处购买或刷新收集。',
            zh_TW: '奶酪刷新啦！可在地圖各商販處購買或刷新收集。',
            en_US: 'Cheese has refreshed! Check local vendors across the map.'
        }
    },
    {
        id: 'preset-helm-takeover',
        title: {
            zh_CN: '海舵社:接管机遇',
            zh_TW: '海舵社:接管機遇',
            en_US: 'The Helm: Hostile Takeover'
        },
        categories: ['activity'],
        description: {
            zh_CN: '下一个接管机遇刷新时间',
            zh_TW: '下一個接管機遇刷新時間',
            en_US: 'Next Hostile Takeover opportunity refresh time'
        },
        scheduleType: 'repeat',
        repeatType: 'interval',
        repeatIntervalUnit: 'hour',
        repeatIntervalValue: 1,
        repeatIntervalHours: 1,
        advanceNoticeEnabled: true,
        advanceMinutes: 5,
        validityType: 'permanent',
        notifyEnabled: true,
        note: {
            zh_CN: '海舵社接管机遇已刷新，请及时前往参与接管。',
            zh_TW: '海舵社接管機遇已刷新，請及時前往參與接管。',
            en_US: 'The Helm Hostile Takeover opportunity has refreshed. Join and secure the manufactory.'
        }
    },
    {
        id: 'preset-helm-war-event',
        title: {
            zh_CN: '战争事件',
            zh_TW: '戰爭事件',
            en_US: 'War Event'
        },
        categories: ['activity'],
        description: {
            zh_CN: '下一个战争事件刷新时间',
            zh_TW: '下一個戰爭事件刷新時間',
            en_US: 'Next War Event refresh time'
        },
        scheduleType: 'repeat',
        repeatType: 'interval',
        repeatIntervalUnit: 'minute',
        repeatIntervalValue: 30,
        advanceNoticeEnabled: true,
        advanceMinutes: 5,
        validityType: 'permanent',
        notifyEnabled: true,
        note: {
            zh_CN: '战争事件已开启，准备参与争夺与交锋。',
            zh_TW: '戰爭事件已開啟，準備參與爭奪与交鋒。',
            en_US: 'War Event has started. Prepare for battle and competition.'
        }
    },
    {
        id: 'preset-game-maintenance',
        title: {
            zh_CN: '游戏维护',
            zh_TW: '遊戲維護',
            en_US: 'Game Maintenance'
        },
        categories: ['system'],
        description: {
            zh_CN: '日常游戏维护时间，具体查看游戏公告',
            zh_TW: '日常遊戲維護時間，具體查看遊戲公告',
            en_US: 'Routine game maintenance. Check official announcements for details.'
        },
        scheduleType: 'repeat',
        repeatType: 'weekly',
        repeatDays: [2],
        repeatTime: '14:00',
        validityType: 'permanent',
        notifyEnabled: true,
        note: {
            zh_CN: '日常游戏维护时间，具体查看游戏官方公告与维护通知。',
            zh_TW: '日常遊戲維護時間，具體查看遊戲官方公告與維護通知。',
            en_US: 'Routine game maintenance time. Please check official game announcements.'
        }
    }
];

export default REMINDER_PRESETS;
