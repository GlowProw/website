import type { RouteRecordRaw } from 'vue-router';
import { getLatestSeasonId } from '../guards';

const CalendarPage = () => import('@/views/calendar/Index.vue');
const CalendarHistoryPage = () => import('@/views/calendar/History.vue');

// 赛季日历与历史活动路由集合
export const calendarRoutes: RouteRecordRaw[] = [
    {
        path: '/calendar',
        name: 'Calendar',
        meta: {
            title: 'calendar.title',
            keywords: 'calendar.meta.keywords'
        },
        component: CalendarPage,
        redirect: to => ({ name: 'CalendarCurrentSeason', params: { ...to.params, seasonId: getLatestSeasonId() } }),
        children: [
            {
                path: 'history',
                name: 'CalendarHistoryDefault',
                component: CalendarHistoryPage,
            },
            {
                path: ':seasonId',
                name: 'CalendarCurrentSeason',
                component: CalendarHistoryPage,
            },
            {
                path: ':seasonId/history',
                name: 'CalendarHistorySeason',
                component: CalendarHistoryPage,
            }
        ]
    }
];
