import type { RouteRecordRaw } from 'vue-router';
import { initItemAssets } from '../guards';

const EmpireSkillSimulationPage = () => import('@/views/empireSkillSimulation/Index.vue');
const MasteryPage = () => import('@/views/mastery/Index.vue');
const MasteryViewPage = () => import('@/views/mastery/View.vue');
const MasterySharePage = () => import('@/views/mastery/Share.vue');

// 赛季精通与帝国技能模拟路由集合
export const masteryRoutes: RouteRecordRaw[] = [
    {
        path: '/empire-skill-simulation',
        name: 'EmpireSkillSimulation',
        component: EmpireSkillSimulationPage,
        meta: {
            title: 'header.functions.empire-skill-simulation.title',
            keywords: 'header.functions.empire-skill-simulation.keywords'
        },
        beforeEnter: initItemAssets,
    },
    {
        path: '/mastery',
        component: MasteryPage,
        meta: {
            title: 'header.functions.mastery.title',
            keywords: 'header.functions.mastery.keywords'
        },
        beforeEnter: initItemAssets,
        children: [
            {
                path: '',
                name: 'Mastery',
                component: MasteryViewPage,
                meta: {
                    title: 'header.functions.mastery.title',
                    keywords: 'header.functions.mastery.keywords'
                },
            },
            {
                path: 'share',
                name: 'MasteryShare',
                component: MasterySharePage,
                meta: {
                    title: 'mastery.share.title',
                    keywords: 'header.functions.mastery.keywords'
                },
            },
        ]
    }
];
