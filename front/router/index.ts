import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';

import PortalMainBasePage from '../src/views/portal/Index.vue'
import PortalPage from '../src/views/portal/Home.vue'

import AccountPage from '../src/views/user/account/Index.vue'
import AccountInformationPage from '../src/views/user/account/Information.vue'
import AccountProfilePicturePage from '@/views/user/account/profilePicture.vue'
import AccountAssemblysPage from '../src/views/user/account/assemblys.vue'
import AccountCommentsPage from '../src/views/user/account/comments.vue'
import AccountTeamUpsPage from '../src/views/user/account/teamup.vue'
import AccountSpacePage from '../src/views/user/Space.vue'

import LoginPage from '../src/views/user/login.vue'
import SignupPage from '@/views/user/Signup.vue'
import DisplayCabinetPage from '../src/views/displayCabinet/Index.vue'
import DisplayCabinetOverviewPage from '../src/views/displayCabinet/Overview.vue'
import RankingDesignedItemsPage from '../src/views/rankingDesignedItems/Index.vue'
import RankingDesignedItemsBrowsePage from '../src/views/rankingDesignedItems/Browse.vue'
import RankingDesignedItemsWorkshopPage from '../src/views/rankingDesignedItems/workshop/Index.vue'
import RankingDesignedItemsPublishPage from '../src/views/rankingDesignedItems/Publish.vue'
import ShipsPage from '../src/views/displayCabinet/ships/Index.vue'
import ShipDetailPage from '../src/views/displayCabinet/ships/Detail.vue'
import ItemsPage from '../src/views/displayCabinet/items/Index.vue'
import ItemDetailPage from '../src/views/displayCabinet/items/Detail.vue'
import ItemCategoryDetailPage from '../src/views/displayCabinet/items/Category.vue'
import ModsPage from '@/views/displayCabinet/mods/Index.vue'
import ModDetailPage from '@/views/displayCabinet/mods/Detail.vue'
import MaterialsPage from '../src/views/displayCabinet/materials/Index.vue'
import MaterialDetailPage from '../src/views/displayCabinet/materials/Detail.vue'
import CosmeticsPage from '../src/views/displayCabinet/cosmetics/Index.vue'
import CosmeticDetailPage from '../src/views/displayCabinet/cosmetics/Detail.vue'
import TreasureMapsPage from '../src/views/displayCabinet/treasureMaps/Index.vue'
import TreasureMapDetailPage from '../src/views/displayCabinet/treasureMaps/Detail.vue'
import EmpireSkillSimulationPage from '../src/views/empireSkillSimulation/Index.vue'

import UltimatesPage from '../src/views/displayCabinet/ultimates/Index.vue'
import UltimateDetailPage from '../src/views/displayCabinet/ultimates/Detail.vue'

import CalendarPage from '../src/views/calendar/Index.vue'
import CalendarHistoryPage from '../src/views/calendar/History.vue'
import CalendarHistorysPage from '../src/views/calendar/Historys.vue'

import AssemblePage from '../src/views/assembly/Index.vue'
import AssembleWorkshopPage from '../src/views/assembly/workshop/Index.vue'
import AssemblePublishPage from '../src/views/assembly/Publish.vue'
import AssemblyBrowsePage from '../src/views/assembly/Browse.vue'
import AssemblyDetailPage from '../src/views/assembly/Detail.vue'
import AssemblySharePage from '../src/views/assembly/Share.vue'

import MapsPage from '../src/views/map/Index.vue';
import MapViewPage from '../src/views/map/View.vue';

import TeamPage from '../src/views/Team.vue'
import AboutPage from '../src/views/About.vue'
import NotFoundPage from '../src/views/NotFound.vue';

import Test from '@/views/Test.vue'

import {useAuthStore} from "~/stores/userAccountStore";
import {useAssetsStore} from "~/stores/assetsStore";
import i18n from "@/i18n";
import {useHead} from "@unhead/vue";
import {api} from "@/assets/sripts/index";
import {useHttpToken} from "@/assets/sripts/http_util";

const isLoginBeforeEnter = function (to: any, from: any, next) {
    const authStore = useAuthStore()

    if (authStore.user) {
        next();
    } else {
        next({path: '/account/login', query: {backUrl: to.fullPath}});
    }
}

const initAccountInfo = async function (to, from, next) {
    const authStore = useAuthStore(),
        httpToken = useHttpToken()

    try {
        const result = await httpToken.get(api["user_me"]),
            d = result.data;

        if (d.error == 1)
            return Error(d)

        authStore.updateAccountAttr(d.data)
    } catch (e) {
        console.error(e)
    }
}

const initItemAssets = () => {
    const {init} = useAssetsStore()
    init();
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
                redirect: '/account/home/information',
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
                ]
            },
            {
                path: '/space/:id',
                name: 'AccountSpace',
                component: AccountSpacePage,
            },
            {
                path: '/account/login',
                name: 'login',
                meta: {
                    title: 'login.title',
                    keywords: 'login.meta.keywords'
                },
                component: LoginPage
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
        ]
    },
    {
        path: '/display-cabinet',
        name: 'DisplayCabinet',
        component: DisplayCabinetPage,
        beforeEnter: initItemAssets,
        meta: {
            title: 'displayCabinet.title',
            keywords: 'displayCabinet.keywords'
        },
        redirect: '/display-cabinet/overview',
        children: [
            {
                path: 'overview',
                name: 'DisplayCabinetOverview',
                component: DisplayCabinetOverviewPage,
            },
            {
                path: 'ships',
                name: 'Ships',
                meta: {
                    title: 'displayCabinet.ships.title',
                    keywords: 'displayCabinet.ships.meta.keywords'
                },
                component: ShipsPage,
            },
            {
                path: 'ship/:id',
                name: 'ShipDetail',
                meta: {
                    title: 'displayCabinet.ship.title',
                    keywords: 'displayCabinet.ship.meta.keywords'
                },
                component: ShipDetailPage,
            },
            {
                path: 'items',
                name: 'Items',
                meta: {
                    title: 'displayCabinet.items.title',
                    keywords: 'displayCabinet.items.meta.keywords'
                },
                component: ItemsPage,
            },
            {
                path: 'item/:id',
                name: 'ItemDetail',
                meta: {
                    title: 'displayCabinet.item.title',
                    keywords: 'displayCabinet.item.meta.keywords'
                },
                component: ItemDetailPage,
            },
            {
                path: 'item/:fun/:key',
                name: 'ItemCategoryDetail',
                meta: {
                    title: 'displayCabinet.items.title',
                    keywords: 'displayCabinet.items.meta.keywords'
                },
                component: ItemCategoryDetailPage,
            },
            {
                path: 'ultimates',
                name: 'Ultimates',
                meta: {
                    title: 'displayCabinet.ultimates.title',
                    keywords: 'displayCabinet.ultimates.meta.keywords'
                },
                component: UltimatesPage,
            },
            {
                path: 'ultimate/:id',
                name: 'UltimateDetail',
                meta: {
                    title: 'displayCabinet.ultimate.title',
                    keywords: 'displayCabinet.ultimate.meta.keywords'
                },
                component: UltimateDetailPage,
            },
            {
                path: 'mods',
                name: 'Mods',
                meta: {
                    title: 'displayCabinet.mods.title',
                    keywords: 'displayCabinet.mods.meta.keywords'
                },
                component: ModsPage,

            },
            {
                path: 'mod/:id',
                name: 'ModDetail',
                meta: {
                    title: 'displayCabinet.mod.title',
                    keywords: 'displayCabinet.mod.meta.keywords'
                },
                component: ModDetailPage,
            },
            {
                path: 'materials',
                name: 'Materials',
                meta: {
                    title: 'displayCabinet.materials.title',
                    keywords: 'displayCabinet.materials.meta.keywords'
                },
                component: MaterialsPage,
            },
            {
                path: 'material/:id',
                name: 'MaterialDetail',
                meta: {
                    title: 'displayCabinet.material.title',
                    keywords: 'displayCabinet.material.meta.keywords'
                },
                component: MaterialDetailPage,
            },
            {
                path: 'cosmetics',
                name: 'Cosmetics',
                meta: {
                    title: 'displayCabinet.cosmetics.title',
                    keywords: 'displayCabinet.cosmetics.meta.keywords'
                },
                component: CosmeticsPage,
            },
            {
                path: 'cosmetic/:id',
                name: 'CosmeticDetail',
                meta: {
                    title: 'displayCabinet.cosmetic.title',
                    keywords: 'displayCabinet.cosmetic.meta.keywords'
                },
                component: CosmeticDetailPage,
            },
            {
                path: 'treasureMaps',
                name: 'TreasureMaps',
                meta: {
                    title: 'displayCabinet.treasureMaps.title',
                    keywords: 'displayCabinet.treasureMaps.meta.keywords'
                },
                component: TreasureMapsPage,
            },
            {
                path: 'treasureMap/:id',
                name: 'TreasureMapDetail',
                meta: {
                    title: 'displayCabinet.treasureMaps.title',
                    keywords: 'displayCabinet.treasureMaps.meta.keywords'
                },
                component: TreasureMapDetailPage,
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
            },
            {
                path: 'historys',
                name: 'CalendarHistorys',
                component: CalendarHistorysPage,
            },
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
        component: AboutPage,
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
        const t = i18n.global.t
        if (to.meta && to.meta.title) {
            let meta = []

            if (to.meta.keywords)
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
