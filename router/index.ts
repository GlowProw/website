import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import i18n from "@/i18n";

import PortalMainBasePage from '@/views/portal/Index.vue'
import PortalPage from '@/views/portal/Home.vue'

import AccountPage from '@/views/user/account/Index.vue'
import AccountInformationPage from '@/views/user/account/Information.vue'
import AccountProfilePicturePage from '@/views/user/account/profilePicture.vue'
import AccountAssemblysPage from '@/views/user/account/assemblys.vue'
import AccountCommentsPage from '@/views/user/account/comments.vue'
import AccountTeamUpsPage from '@/views/user/account/teamup.vue'
import AccountMapsPage from '@/views/user/account/maps.vue'
import AccountSmugglersReport from '@/views/user/account/smugglersReport.vue'
import AccountSpacePage from '@/views/user/Space.vue'

import AccountAdminPage from '@/views/user/admin/Index.vue'
import AccountAdminPrivilegeManagementPage from '@/views/user/admin/PrivilegeManagement.vue'

import SigninPage from '@/views/user/Signin.vue'
import SignupPage from '@/views/user/Signup.vue'
import CodexPage from '@/views/codex/Index.vue'
import CodexOverviewPage from '@/views/codex/Overview.vue'
import RankingDesignedItemsPage from '@/views/rankingDesignedItems/Index.vue'
import RankingDesignedItemsBrowsePage from '@/views/rankingDesignedItems/Browse.vue'
import RankingDesignedItemsWorkshopPage from '@/views/rankingDesignedItems/workshop/Index.vue'
import RankingDesignedItemsPublishPage from '@/views/rankingDesignedItems/Publish.vue'

import ShipsPage from '@/views/codex/ships/Index.vue'
import ShipDetailPage from '@/views/codex/ships/Detail.vue'

import ItemsPage from '@/views/codex/items/Index.vue'
import ItemDetailPage from '@/views/codex/items/Detail.vue'

import CommoditiesPage from '@/views/codex/commodities/Index.vue'
import CommoditieDetailPage from '@/views/codex/commodities/Detail.vue'

import ModsPage from '@/views/codex/modifications/Index.vue'
import ModDetailPage from '@/views/codex/modifications/Detail.vue'

import MaterialsPage from '@/views/codex/materials/Index.vue'
import MaterialDetailPage from '@/views/codex/materials/Detail.vue'

import CosmeticsPage from '@/views/codex/cosmetics/Index.vue'
import CosmeticDetailPage from '@/views/codex/cosmetics/Detail.vue'

import SetsPage from '@/views/codex/sets/Index.vue'
import SetDetailPage from '@/views/codex/sets/Detail.vue'

import TreasureMapsPage from '@/views/codex/treasureMaps/Index.vue'
import TreasureMapDetailPage from '@/views/codex/treasureMaps/Detail.vue'

import MapLocationPage from '@/views/codex/mapLocations/Index.vue'
import MapLocationsDetailPage from '@/views/codex/mapLocations/Detail.vue'

import NpcsPage from '@/views/codex/npcs/Index.vue'
import NpcDetailPage from '@/views/codex/npcs/Detail.vue'

import EmpireSkillSimulationPage from '@/views/empireSkillSimulation/Index.vue'

import UltimatesPage from '@/views/codex/ultimates/Index.vue'
import UltimateDetailPage from '@/views/codex/ultimates/Detail.vue'

import CalendarPage from '@/views/calendar/Index.vue'
import CalendarHistoryPage from '@/views/calendar/History.vue'

import AssemblePage from '@/views/assembly/Index.vue'
import AssembleWorkshopPage from '@/views/assembly/workshop/Index.vue'
import AssemblePublishPage from '@/views/assembly/Publish.vue'
import AssemblyBrowsePage from '@/views/assembly/Browse.vue'
import AssemblyDetailPage from '@/views/assembly/Detail.vue'
import AssemblySharePage from '@/views/assembly/Share.vue'

import MapsPage from '@/views/map/Index.vue';
import MapViewPage from '@/views/map/View.vue';

import TeamPage from '@/views/Team.vue'
import SearchPage from '@/views/Search.vue'

import SmugglersReportPage from '@/views/smugglers/Index.vue'
import SmugglersReportDetailPage from '@/views/smugglers/View.vue'

import SettingPage from '@/views/setting/Index.vue'
import SettingAdPage from '@/views/setting/Ad.vue'
import SettingRoutinePage from '@/views/setting/Routine.vue'
import SettingStoragePage from '@/views/setting/Storage.vue'

import AboutPage from '@/views/setting/About.vue'
import NotFoundPage from '@/views/NotFound.vue';

import Test from '@/views/Test.vue'

import {useAuthStore} from "@/../stores/userAccountStore";
import {useAssetsStore} from "@/../stores/assetsStore";
import {useHead} from "@unhead/vue";
import {apis} from "@/assets/sripts";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const isLoginBeforeEnter = function (to: any, from: any, next: any) {
    const authStore = useAuthStore()

    if (authStore.user) {
        next()
    } else {
        next({path: '/account/signin', query: {backUrl: to.fullPath}})
    }
}

const isAdminBeforeEnter = (to: any, from: any, next: any) => {
    const authStore = useAuthStore(),
        role: string[] = authStore?.user?.role ?? []

    if (role.includes('admin') || role.includes('super') || role.includes('dev') || role.includes('root')) {
        next()
    } else {
        next({path: '/', query: {backUrl: to.fullPath}})
    }
}

const initAccountInfo = async function (to: any, from: any, next: any) {
    const authStore = useAuthStore()

    try {
        const result = await apis.userApi().getMe()

        authStore.updateAccountAttr(result.data)
    } catch (e) {
        console.error(e)
    }
}

const initItemAssets = () => {
    const {init} = useAssetsStore()
    init()
    initCDNAssets()
}

const initCDNAssets = () => {
    const {loadFromStorage} = useCDNAssetsServiceStore()
    loadFromStorage()
}

const routes: Readonly<RouteRecordRaw[]> = [
    {
        path: '/',
        name: 'BasePortal',
        component: PortalMainBasePage,
        meta: {
            title: 'home.title',
            keywords: 'home.meta.keywords'
        },
        children: [
            {
                path: '/',
                name: 'PortalHome',
                component: PortalPage
            },
            {
                path: '/account',
                name: 'AccountHome',
                component: AccountPage,
                redirect: '/account/information',
                meta: {
                    title: 'account.title',
                    keywords: 'account.meta.keywords'
                },
                beforeEnter: (to, from, next) => {
                    isLoginBeforeEnter(to, from, next)
                    initAccountInfo(to, from, next)
                },
                children: [
                    {
                        path: 'information',
                        name: 'AccountInformation',
                        component: AccountInformationPage
                    },
                    {
                        path: 'profile-picture',
                        name: 'AccountProfilePicture',
                        component: AccountProfilePicturePage
                    },

                    {
                        path: 'assemblys',
                        name: 'AccountAssemblys',
                        component: AccountAssemblysPage
                    },
                    {
                        path: 'comments',
                        name: 'AccountComments',
                        component: AccountCommentsPage
                    },
                    {
                        path: 'teamups',
                        name: 'AccountTeamUps',
                        component: AccountTeamUpsPage
                    },
                    {
                        path: 'maps',
                        name: 'AccountMaps',
                        component: AccountMapsPage
                    },
                    {
                        path: 'smugglersReport',
                        name: 'AccountSmugglersReport',
                        component: AccountSmugglersReport
                    },
                ]
            },
            {
                path: '/admin',
                name: 'AccountAdminHome',
                component: AccountAdminPage,
                redirect: '/admin/privilege-management',
                meta: {
                    title: 'admin.title',
                    keywords: 'admin.meta.keywords'
                },
                beforeEnter: (to, from, next) => {
                    isLoginBeforeEnter(to, from, next)
                    initAccountInfo(to, from, next)
                    isAdminBeforeEnter(to, from, next)
                },
                children: [
                    {
                        path: 'privilege-management',
                        name: 'PrivilegeManagement',
                        component: AccountAdminPrivilegeManagementPage
                    },
                ]
            },
            {
                path: '/space/:id',
                name: 'AccountSpace',
                component: AccountSpacePage,
            },
            {
                path: '/account/signin',
                name: 'signin',
                meta: {
                    title: 'signin.title',
                    keywords: 'signin.meta.keywords'
                },
                component: SigninPage
            },
            {
                path: '/account/signup',
                name: 'signup',
                meta: {
                    title: 'signup.title',
                    keywords: 'signup.meta.keywords'
                },
                component: SignupPage
            },
            {
                path: '/team',
                name: 'Team',
                meta: {
                    title: 'teamUp.title',
                    keywords: 'teamUp.meta.keywords'
                },
                component: TeamPage,
                beforeEnter: initItemAssets,
            },
            {
                path: '/search',
                name: 'Search',
                meta: {
                    title: 'search.title',
                    keywords: 'search.meta.keywords'
                },
                component: SearchPage,
            },
            {
                path: '/setting',
                name: 'PortalSetting',
                component: SettingPage,
                beforeEnter: initCDNAssets,
                redirect: '/setting/routine',
                children: [
                    {
                        path: 'routine',
                        name: 'PortalSettingRoutine',
                        component: SettingRoutinePage,
                    },
                    {
                        path: 'ads',
                        name: 'PortalSettingAds',
                        component: SettingAdPage,
                    },
                    {
                        path: 'storage',
                        name: 'PortalSettingStorage',
                        component: SettingStoragePage,
                    },
                    {
                        path: 'about',
                        name: 'PortalSettingAbout',
                        component: AboutPage,
                    }
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
        redirect: '/smugglers-report/view',
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
        path: '/codex',
        name: 'Codex',
        component: CodexPage,
        beforeEnter: initItemAssets,
        meta: {
            title: 'codex.title',
            keywords: 'codex.keywords'
        },
        redirect: '/codex',
        children: [
            {
                path: '',
                name: 'codexOverview',
                component: CodexOverviewPage,
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
                path: 'mods',
                name: 'Mods',
                meta: {
                    title: 'codex.modifications.title',
                    keywords: 'codex.mods.meta.keywords'
                },
                component: ModsPage,

            },
            {
                path: 'mod/:id',
                name: 'ModDetail',
                meta: {
                    title: 'codex.mod.title',
                    keywords: 'codex.mod.meta.keywords'
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
                    title: 'codex.cosmetics.title',
                    keywords: 'codex.cosmetics.meta.keywords'
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
                    title: 'codex.treasureMaps.title',
                    keywords: 'codex.treasureMaps.meta.keywords'
                },
                component: TreasureMapDetailPage,
            },
            {
                path: 'mapLocations',
                name: 'MapLocations',
                meta: {
                    title: 'codex.treasureMaps.title',
                    keywords: 'codex.treasureMaps.meta.keywords'
                },
                component: MapLocationPage,
            },
            {
                path: 'mapLocation/:id',
                name: 'MapLocationDetail',
                meta: {
                    title: 'codex.treasureMaps.title',
                    keywords: 'codex.treasureMaps.meta.keywords'
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
        ]
    },
    {
        path: '/ranking-designed-items',
        name: 'rankingDesignedItems',
        component: RankingDesignedItemsPage,
        meta: {
            title: 'rankingDesignedItems.title',
            keywords: 'rankingDesignedItems.keywords'
        },
        beforeEnter: initItemAssets,
        redirect: '/ranking-designed-items/browse',
        children: [
            {
                path: 'browse',
                name: 'RankingDesignedItemsBrowse',
                component: RankingDesignedItemsBrowsePage,
            },
            {
                path: 'workshop',
                name: 'RankingDesignedItemsWorkshop',
                component: RankingDesignedItemsWorkshopPage,
            },
            {
                path: 'publish/:uid',
                name: 'PublishRankingDesignedItems',
                component: RankingDesignedItemsPublishPage,
            },
            {
                path: 'edit/:uid',
                name: 'EditRankingDesignedItems',
                component: RankingDesignedItemsPublishPage,
            },
        ]
    },
    {
        path: '/calendar',
        name: 'Calendar',
        meta: {
            title: 'calendar.title',
            keywords: 'calendar.meta.keywords'
        },
        component: CalendarPage,
        redirect: '/calendar/history',
        children: [
            {
                path: 'history',
                name: 'CalendarHistory',
                component: CalendarHistoryPage,
            }
        ]
    },
    {
        path: '/assembly',
        meta: {
            title: 'assembly.title',
            keywords: 'assembly.meta.keywords'
        },
        name: 'Assembly',
        component: AssemblePage,
        beforeEnter: initItemAssets,
        redirect: '/assembly/browse',
        children: [
            {
                path: 'workshop',
                name: 'AssemblyWorkshop',
                component: AssembleWorkshopPage,
                beforeEnter: isLoginBeforeEnter
            },
            {
                path: 'workshop/:uid/edit',
                name: 'AssemblyEdit',
                component: AssembleWorkshopPage,
                beforeEnter: isLoginBeforeEnter
            },
            {
                path: 'publish/:uid',
                name: 'PublishAssembly',
                component: AssemblePublishPage,
                beforeEnter: isLoginBeforeEnter
            },
            {
                path: 'edit/:uid',
                name: 'EditAssembly',
                component: AssemblePublishPage,
                beforeEnter: isLoginBeforeEnter
            },
            {
                path: 'browse',
                name: 'AssemblyBrowse',
                component: AssemblyBrowsePage,
            },
            {
                path: 'browse/:uuid/detail',
                name: 'AssemblyDetail',
                component: AssemblyDetailPage
            },
            {
                path: 'browse/:uuid/share',
                name: 'AssemblyShare',
                component: AssemblySharePage
            }
        ]
    },
    {
        path: '/empire-skill-simulation',
        name: 'empireSkillSimulation',
        component: EmpireSkillSimulationPage,
        meta: {
            title: 'header.functions.empire-skill-simulation.title',
            keywords: 'header.functions.empire-skill-simulation.keywords'
        },
        beforeEnter: initItemAssets,
    },

    {
        path: '/map',
        name: 'map',
        redirect: '/map/view',
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
        path: '/about',
        name: 'About',
        redirect: '/setting/about'
    },

    {
        path: '/test',
        name: 'test',
        component: Test,
        beforeEnter: initItemAssets
    },

    // 404 路由（必须放在最后）
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundPage,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 检查是否有 scrollTop=false 查询参数
                const scrollTopParam = <boolean | string>to.query.scrollTop;
                if (scrollTopParam === 'false' || scrollTopParam == false) {
                    // 不进行滚动
                    resolve(false)
                    return
                }

                if (to.hash) {
                    resolve({
                        el: to.hash,
                        behavior: 'smooth',
                        top: document.querySelector('header') ? 70 : 0
                    })
                } else if (savedPosition) {
                    resolve(savedPosition)
                } else {
                    resolve({top: 0, behavior: 'smooth'})
                }
            }, 300)
        })
    }
});

router.beforeEach((to) => {
    try {
        // @ts-ignore
        let t: any = i18n.global.t
        if (to.meta && to.meta.title) {
            let meta = []

            if (to.meta.keywords && to.meta.keywords != t(to.meta.keywords))
                meta.push({name: 'keywords', content: t(to.meta.keywords)})

            useHead({
                title: t(to.meta.title) + ' | ' + t('name'),
                meta,
            })
        }
    } catch (e) {
        console.error('router error:' + e)
    }
})

export default router;
