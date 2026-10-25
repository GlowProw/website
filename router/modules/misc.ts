import type { RouteRecordRaw } from 'vue-router';
import { getCurrentSeasonId } from '@/assets/sripts';
import { initItemAssets } from '../guards';

const StatisticsPage = () => import('@/views/statistics/Index.vue');
const StatisticsViewPage = () => import('@/views/statistics/View.vue');
const StatisticsSeasonPage = () => import('@/views/statistics/Season.vue');
const StatisticsCodexPage = () => import('@/views/statistics/Codex.vue');
const StatisticsSigninPage = () => import('@/views/statistics/Signin.vue');
const SmugglersReportPage = () => import('@/views/smugglers/Index.vue');
const SmugglersReportDetailPage = () => import('@/views/smugglers/View.vue');
const StateOfWarPage = () => import('@/views/stateOfWar/Index.vue');
const StateOfWarViewPage = () => import('@/views/stateOfWar/View.vue');
const CalculatorPage = () => import('@/views/calculator/Index.vue');
const MapsPage = () => import('@/views/map/Index.vue');
const MapViewPage = () => import('@/views/map/View.vue');
const AppsPage = () => import('@/views/apps/Index.vue');
const AppsViewPage = () => import('@/views/apps/View.vue');
const QQBotPage = () => import('@/views/apps/QQBot.vue');
const ApiDocsPage = () => import('@/views/apps/ApiDocs.vue');
const AIConnectorPage = () => import('@/views/apps/AIConnector.vue');
const DropPage = () => import('@/views/drop/Index.vue');
const ReminderIndexPage = () => import('@/views/reminder/Index.vue');
const ReminderViewPage = () => import('@/views/reminder/View.vue');
const Test = () => import('@/views/Test.vue');

// 统计、战况、工具箱、地图与杂项路由集合
export const miscRoutes: RouteRecordRaw[] = [
    {
        path: '/statistics',
        name: 'Statistics',
        component: StatisticsPage,
        redirect: to => ({ name: 'StatisticsView', params: { lang: to.params.lang } }),
        children: [
            {
                path: '',
                name: 'StatisticsView',
                component: StatisticsViewPage,
                redirect: to => ({ name: 'StatisticsSeason', params: { lang: to.params.lang } }),
                children: [
                    {
                        path: 'season',
                        name: 'StatisticsSeason',
                        component: StatisticsSeasonPage,
                        meta: {
                            title: 'statistics.season.title'
                        }
                    },
                    {
                        path: 'codex',
                        name: 'StatisticsCodex',
                        component: StatisticsCodexPage,
                        meta: {
                            title: 'statistics.codex.title'
                        }
                    },
                    {
                        path: 'signin',
                        name: 'StatisticsSignin',
                        component: StatisticsSigninPage,
                        meta: {
                            title: 'statistics.signin.title'
                        }
                    },
                ]
            },
        ]
    },
    {
        path: '/smugglers-report',
        name: 'SmugglersReport',
        meta: {
            title: 'smugglersReport.title',
            keywords: 'smugglersReport.meta.keywords'
        },
        redirect: to => ({ name: 'SmugglersReportDetail', params: to.params }),
        component: SmugglersReportPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: 'view',
                name: 'SmugglersReportDetail',
                component: SmugglersReportDetailPage,
            }
        ]
    },
    {
        path: '/stateOfWar',
        name: 'StateOfWar',
        meta: {
            title: 'stateOfWar.title',
            keywords: 'stateOfWar.meta.keywords'
        },
        redirect: to => ({ name: 'StateOfWarSeasonView', params: { ...to.params, seasonId: getCurrentSeasonId() } }),
        component: StateOfWarPage,
        children: [
            {
                path: 'view',
                name: 'StateOfWarDefaultView',
                redirect: to => ({ name: 'StateOfWarSeasonView', params: { ...to.params, seasonId: getCurrentSeasonId() } }),
            },
            {
                path: ':seasonId/view',
                name: 'StateOfWarSeasonView',
                component: StateOfWarViewPage,
            }
        ]
    },
    {
        path: '/calculator',
        name: 'Calculator',
        component: CalculatorPage,
        meta: {
            title: 'calculator.title',
            keywords: 'calculator.meta.keywords'
        },
        beforeEnter: initItemAssets,
    },
    {
        path: '/map',
        name: 'Map',
        redirect: to => ({ name: 'mapView', params: { lang: to.params.lang } }),
        component: MapsPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: 'view',
                name: 'mapView',
                component: MapViewPage
            }
        ]
    },
    {
        path: '/apps',
        name: 'Apps',
        redirect: to => ({ name: 'AppsView', params: { lang: to.params.lang } }),
        component: AppsPage,
        children: [
            {
                path: 'view',
                name: 'AppsView',
                component: AppsViewPage
            },
            {
                path: 'qq-bot',
                name: 'QQBot',
                component: QQBotPage
            },
            {
                path: 'api-docs',
                alias: ['apiDocs'],
                name: 'ApiDocs',
                component: ApiDocsPage
            },
            {
                path: 'ai-connector',
                alias: ['aiSkills', 'ai-skills', 'ai-skill', 'skills'],
                name: 'AIConnector',
                component: AIConnectorPage
            }
        ]
    },
    {
        path: '/docs',
        redirect: to => ({ name: 'ApiDocs', params: { lang: to.params.lang } })
    },
    {
        path: '/api-docs',
        redirect: to => ({ name: 'ApiDocs', params: { lang: to.params.lang } })
    },
    {
        path: '/about',
        name: 'About',
        redirect: to => ({ name: 'PortalSettingAbout', params: { lang: to.params.lang } })
    },
    {
        path: '/drop',
        name: 'Drop',
        component: DropPage,
        meta: {
            title: 'drop.title',
            keywords: 'drop.meta.keywords'
        }
    },
    {
        path: '/reminder',
        name: 'Reminder',
        redirect: to => ({ name: 'ReminderView', params: { lang: to.params.lang } }),
        component: ReminderIndexPage,
        children: [
            {
                path: 'view',
                name: 'ReminderView',
                component: ReminderViewPage,
                meta: {
                    title: 'reminder.title',
                    keywords: 'reminder.meta.keywords'
                }
            }
        ]
    },
    {
        path: '/test',
        name: 'Test',
        component: Test,
        beforeEnter: initItemAssets
    },
];
