import type { RouteRecordRaw } from 'vue-router';
import { initItemAssets } from '../guards';

const CodexPage = () => import('@/views/codex/Index.vue');
const CodexCodexOverviewPage = () => import('@/views/codex/CodexOverview.vue');
const ShipsPage = () => import('@/views/codex/ships/Index.vue');
const ShipDetailPage = () => import('@/views/codex/ships/Detail.vue');
const ItemsPage = () => import('@/views/codex/items/Index.vue');
const ItemDetailPage = () => import('@/views/codex/items/Detail.vue');
const CommoditiesPage = () => import('@/views/codex/commodities/Index.vue');
const CommoditieDetailPage = () => import('@/views/codex/commodities/Detail.vue');
const ModsPage = () => import('@/views/codex/modifications/Index.vue');
const ModDetailPage = () => import('@/views/codex/modifications/Detail.vue');
const MaterialsPage = () => import('@/views/codex/materials/Index.vue');
const MaterialDetailPage = () => import('@/views/codex/materials/Detail.vue');
const CosmeticsPage = () => import('@/views/codex/cosmetics/Index.vue');
const CosmeticDetailPage = () => import('@/views/codex/cosmetics/Detail.vue');
const SetsPage = () => import('@/views/codex/sets/Index.vue');
const SetDetailPage = () => import('@/views/codex/sets/Detail.vue');
const TreasureMapsPage = () => import('@/views/codex/treasureMaps/Index.vue');
const TreasureMapDetailPage = () => import('@/views/codex/treasureMaps/Detail.vue');
const TreasureMapComparisonPage = () => import('@/views/codex/treasureMaps/Comparison.vue');
const MapLocationPage = () => import('@/views/codex/mapLocations/Index.vue');
const MapLocationsDetailPage = () => import('@/views/codex/mapLocations/Detail.vue');
const NpcsPage = () => import('@/views/codex/npcs/Index.vue');
const NpcDetailPage = () => import('@/views/codex/npcs/Detail.vue');
const EnemiesPage = () => import('@/views/codex/enemies/Index.vue');
const EnemyDetailPage = () => import('@/views/codex/enemies/Detail.vue');
const EmpireSkillsPage = () => import('@/views/codex/empireSkills/Index.vue');
const EmpireSkillDetailPage = () => import('@/views/codex/empireSkills/Detail.vue');
const CodexMasterysPage = () => import('@/views/codex/masterys/Index.vue');
const CodexMasteryDetailPage = () => import('@/views/codex/masterys/Detail.vue');
const UltimatesPage = () => import('@/views/codex/ultimates/Index.vue');
const UltimateDetailPage = () => import('@/views/codex/ultimates/Detail.vue');

// 图鉴系统各品类路由集合
export const codexRoutes: RouteRecordRaw[] = [
    {
        path: '/codex',
        name: 'Codex',
        component: CodexPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: '',
                name: 'codexOverview',
                component: CodexCodexOverviewPage,
                meta: {
                    title: 'codex.meta.title',
                    keywords: 'codex.meta.keywords'
                },
            },
            {
                path: 'ships',
                name: 'Ships',
                meta: {
                    title: 'codex.ships.title',
                    keywords: 'codex.ships.meta.keywords'
                },
                component: ShipsPage,
            },
            {
                path: 'ship/:id',
                name: 'ShipDetail',
                meta: {
                    title: 'codex.ship.title',
                    keywords: 'codex.ship.meta.keywords'
                },
                component: ShipDetailPage,
            },
            {
                path: 'items',
                name: 'Items',
                meta: {
                    title: 'codex.items.title',
                    keywords: 'codex.items.meta.keywords'
                },
                component: ItemsPage,
            },
            {
                path: 'item/:id',
                name: 'ItemDetail',
                meta: {
                    title: 'codex.item.title',
                    keywords: 'codex.item.meta.keywords'
                },
                component: ItemDetailPage,
            },
            {
                path: 'commodities',
                name: 'Commodities',
                meta: {
                    title: 'codex.commodities.title',
                    keywords: 'codex.commodities.meta.keywords'
                },
                component: CommoditiesPage,
            },
            {
                path: 'commoditie/:id',
                name: 'CommoditieDetail',
                meta: {
                    title: 'codex.commoditie.title',
                    keywords: 'codex.commoditie.meta.keywords'
                },
                component: CommoditieDetailPage,
            },
            {
                path: 'ultimates',
                name: 'Ultimates',
                meta: {
                    title: 'codex.ultimates.title',
                    keywords: 'codex.ultimates.meta.keywords'
                },
                component: UltimatesPage,
            },
            {
                path: 'ultimate/:id',
                name: 'UltimateDetail',
                meta: {
                    title: 'codex.ultimate.title',
                    keywords: 'codex.ultimate.meta.keywords'
                },
                component: UltimateDetailPage,
            },
            {
                path: 'modifications',
                name: 'Mods',
                meta: {
                    title: 'codex.modifications.title',
                    keywords: 'codex.modifications.meta.keywords'
                },
                component: ModsPage,
            },
            {
                path: 'modification/:id',
                name: 'ModDetail',
                meta: {
                    title: 'codex.modification.title',
                    keywords: 'codex.modification.meta.keywords'
                },
                component: ModDetailPage,
            },
            {
                path: 'materials',
                name: 'Materials',
                meta: {
                    title: 'codex.materials.title',
                    keywords: 'codex.materials.meta.keywords'
                },
                component: MaterialsPage,
            },
            {
                path: 'material/:id',
                name: 'MaterialDetail',
                meta: {
                    title: 'codex.material.title',
                    keywords: 'codex.material.meta.keywords'
                },
                component: MaterialDetailPage,
            },
            {
                path: 'cosmetics',
                name: 'Cosmetics',
                meta: {
                    title: 'codex.commoditys.title',
                    keywords: 'codex.commoditys.meta.keywords'
                },
                component: CosmeticsPage,
            },
            {
                path: 'cosmetic/:id',
                name: 'CosmeticDetail',
                meta: {
                    title: 'codex.cosmetic.title',
                    keywords: 'codex.cosmetic.meta.keywords'
                },
                component: CosmeticDetailPage,
            },
            {
                path: 'sets',
                name: 'Sets',
                meta: {
                    title: 'codex.sets.title',
                    keywords: 'codex.sets.meta.keywords'
                },
                component: SetsPage,
            },
            {
                path: 'set/:id',
                name: 'SetDetail',
                meta: {
                    title: 'codex.set.title',
                    keywords: 'codex.set.meta.keywords'
                },
                component: SetDetailPage,
            },
            {
                path: 'treasureMaps/comparison',
                name: 'TreasureMapComparison',
                meta: {
                    title: 'codex.treasureMaps.comparison.title',
                    keywords: 'codex.treasureMaps.meta.keywords'
                },
                component: TreasureMapComparisonPage,
            },
            {
                path: 'treasureMaps',
                name: 'TreasureMaps',
                meta: {
                    title: 'codex.treasureMaps.title',
                    keywords: 'codex.treasureMaps.meta.keywords'
                },
                component: TreasureMapsPage,
            },
            {
                path: 'treasureMap/:id',
                name: 'TreasureMapDetail',
                meta: {
                    title: 'codex.treasureMap.title',
                    keywords: 'codex.treasureMap.meta.keywords'
                },
                component: TreasureMapDetailPage,
            },
            {
                path: 'mapLocations',
                name: 'MapLocations',
                meta: {
                    title: 'codex.mapLocations.title',
                    keywords: 'codex.mapLocations.meta.keywords'
                },
                component: MapLocationPage,
            },
            {
                path: 'mapLocation/:id',
                name: 'MapLocationDetail',
                meta: {
                    title: 'codex.mapLocation.title',
                    keywords: 'codex.mapLocation.meta.keywords'
                },
                component: MapLocationsDetailPage,
            },
            {
                path: 'npcs',
                name: 'Npcs',
                meta: {
                    title: 'codex.npcs.title',
                    keywords: 'codex.npcs.meta.keywords'
                },
                component: NpcsPage,
            },
            {
                path: 'npc/:id',
                name: 'NpcDetail',
                meta: {
                    title: 'codex.npc.title',
                    keywords: 'codex.npc.meta.keywords'
                },
                component: NpcDetailPage,
            },
            {
                path: 'enemies',
                name: 'Enemies',
                meta: {
                    title: 'codex.enemies.title',
                    keywords: 'codex.enemies.meta.keywords'
                },
                component: EnemiesPage,
            },
            {
                path: 'enemy/:id',
                name: 'EnemyDetail',
                meta: {
                    title: 'codex.enemy.title',
                    keywords: 'codex.enemy.meta.keywords'
                },
                component: EnemyDetailPage,
            },
            {
                path: 'empireSkills',
                name: 'EmpireSkills',
                meta: {
                    title: 'codex.empireSkills.title',
                    keywords: 'codex.empireSkills.meta.keywords'
                },
                component: EmpireSkillsPage,
            },
            {
                path: 'empireSkill/:id',
                name: 'EmpireSkillDetail',
                meta: {
                    title: 'codex.empireSkill.title',
                    keywords: 'codex.empireSkill.meta.keywords'
                },
                component: EmpireSkillDetailPage,
            },
            {
                path: 'empireSkills/:id',
                redirect: to => ({ name: 'EmpireSkillDetail', params: to.params }),
            },
            {
                path: 'masterys',
                name: 'Masterys',
                meta: {
                    title: 'codex.masterys.title',
                    keywords: 'codex.masterys.meta.keywords'
                },
                component: CodexMasterysPage,
            },
            {
                path: 'mastery/:id',
                name: 'MasteryDetail',
                meta: {
                    title: 'codex.mastery.title',
                    keywords: 'codex.mastery.meta.keywords'
                },
                component: CodexMasteryDetailPage,
            },
            {
                path: 'masterys/:id',
                redirect: to => ({ name: 'MasteryDetail', params: to.params }),
            },
            {
                path: 'quest',
                redirect: to => ({ name: 'Quests', params: { lang: to.params.lang } })
            },
            {
                path: 'quests',
                redirect: to => ({ name: 'Quests', params: { lang: to.params.lang } })
            },
            {
                path: 'quest/:id',
                redirect: to => ({ name: 'QuestDetail', params: to.params })
            },
            {
                path: 'quests/:id',
                redirect: to => ({ name: 'QuestDetail', params: to.params }),
            },
        ]
    }
];
