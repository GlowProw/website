import type { RouteRecordRaw } from 'vue-router';
import { initItemAssets } from '../guards';

const QuestPage = () => import('@/views/quest/Index.vue');
const QuestListPage = () => import('@/views/quest/List.vue');
const QuestDetailPage = () => import('@/views/quest/Detail.vue');

// 任务系统路由集合
export const questRoutes: RouteRecordRaw[] = [
    {
        path: '/quest',
        name: 'Quest',
        component: QuestPage,
        beforeEnter: initItemAssets,
        redirect: to => ({ name: 'Quests', params: { lang: to.params.lang } }),
        children: [
            {
                path: '',
                name: 'Quests',
                component: QuestListPage,
                meta: {
                    title: 'quest.title',
                    keywords: 'quest.meta.keywords'
                },
            },
            {
                path: ':id',
                name: 'QuestDetail',
                component: QuestDetailPage,
                meta: {
                    title: 'quest.detail.title',
                    keywords: 'quest.meta.keywords'
                },
            },
        ]
    },
    {
        path: '/quests',
        redirect: to => ({ name: 'Quests', params: { lang: to.params.lang } })
    },
    {
        path: '/quests/:id',
        redirect: to => ({ name: 'QuestDetail', params: to.params })
    },
];
