import type { RouteRecordRaw } from 'vue-router';
import { initItemAssets } from '../guards';

const WidgetIndexPage = () => import('@/widgets/Index.vue');
const WidgetAssemblyPage = () => import('@/widgets/assembly/Index.vue');
const WidgetMasteryPage = () => import('@/widgets/mastery/Index.vue');
const WidgetShipPage = () => import('@/widgets/ship/Index.vue');
const WidgetItemPage = () => import('@/widgets/item/Index.vue');
const WidgetMaterialPage = () => import('@/widgets/material/Index.vue');
const WidgetNpcPage = () => import('@/widgets/npc/Index.vue');
const WidgetModPage = () => import('@/widgets/modifications/Index.vue');
const WidgetCosmeticPage = () => import('@/widgets/cosmetic/Index.vue');
const WidgetCommoditiePage = () => import('@/widgets/commoditie/Index.vue');
const WidgetTreasureMapPage = () => import('@/widgets/treasureMap/Index.vue');
const WidgetUltimatePage = () => import('@/widgets/ultimate/Index.vue');
const WidgetSetPage = () => import('@/widgets/set/Index.vue');
const WidgetMapLocationPage = () => import('@/widgets/mapLocation/Index.vue');
const WidgetEmpireSkillPage = () => import('@/widgets/empireSkills/Index.vue');
const WidgetStateOfWarPage = () => import('@/widgets/stateOfWar/Index.vue');
const WidgetDailyReportPage = () => import('@/widgets/dailyReport/Index.vue');
const WidgetModSlotPage = () => import('@/widgets/modSlot/Index.vue');
const WidgetCombatEffectPage = () => import('@/widgets/combatEffect/Index.vue');
const WidgetInfamyPage = () => import('@/widgets/infamy/Index.vue');

// 嵌入式 Widgets 挂件系统路由集合
export const widgetsRoutes: RouteRecordRaw[] = [
    {
        path: '/widgets',
        name: 'Widgets',
        component: WidgetIndexPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: 'assembly/:uid',
                name: 'AssemblyWidget',
                component: WidgetAssemblyPage,
            },
            {
                path: 'mastery/:uid',
                name: 'MasteryWidget',
                component: WidgetMasteryPage,
            },
            {
                path: 'ship/:id',
                name: 'ShipWidget',
                component: WidgetShipPage,
            },
            {
                path: 'item/:id',
                name: 'ItemWidget',
                component: WidgetItemPage,
            },
            {
                path: 'material/:id',
                name: 'MaterialWidget',
                component: WidgetMaterialPage,
            },
            {
                path: 'npc/:id',
                name: 'NPCWidget',
                component: WidgetNpcPage,
            },
            {
                path: 'modification/:id',
                name: 'ModWidget',
                component: WidgetModPage,
            },
            {
                path: 'cosmetic/:id',
                name: 'CosmeticWidget',
                component: WidgetCosmeticPage,
            },
            {
                path: 'commoditie/:id',
                name: 'CommoditieWidget',
                component: WidgetCommoditiePage,
            },
            {
                path: 'treasureMap/:id',
                name: 'TreasureMapWidget',
                component: WidgetTreasureMapPage,
            },
            {
                path: 'ultimate/:id',
                name: 'UltimateWidget',
                component: WidgetUltimatePage,
            },
            {
                path: 'set/:id',
                name: 'SetWidget',
                component: WidgetSetPage,
            },
            {
                path: 'mapLocation/:id',
                name: 'MapLocationWidget',
                component: WidgetMapLocationPage,
            },
            {
                path: 'empireSkill/:id',
                name: 'EmpireSkillWidget',
                component: WidgetEmpireSkillPage,
            },
            {
                path: 'empireSkills/:id',
                redirect: to => ({ name: 'EmpireSkillWidget', params: to.params }),
            },
            {
                path: 'stateOfWar',
                name: 'StateOfWarWidget',
                component: WidgetStateOfWarPage,
            },
            {
                path: 'stateOfWar/:seasonId',
                name: 'StateOfWarSeasonWidget',
                component: WidgetStateOfWarPage,
            },
            {
                path: 'dailyReport',
                name: 'DailyReportWidget',
                component: WidgetDailyReportPage,
            },
            {
                path: 'dailyReport/:seasonId',
                name: 'DailyReportSeasonWidget',
                component: WidgetDailyReportPage,
            },
            {
                path: 'modSlot',
                name: 'ModSlotWidget',
                component: WidgetModSlotPage,
            },
            {
                path: 'combatEffect',
                name: 'CombatEffectWidget',
                component: WidgetCombatEffectPage,
            },
            {
                path: 'infamy',
                name: 'InfamyWidget',
                component: WidgetInfamyPage,
            }
        ]
    }
];
