import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';

import PortalMainBasePage from '../src/views/portal/Index.vue'
import PortalPage from '../src/views/portal/Home.vue'

import AccountPage from '../src/views/user/account/Index.vue'
import AccountInformationPage from '../src/views/user/account/Information.vue'
import AccountAssemblysPage from '../src/views/user/account/assemblys.vue'

import LoginPage from '../src/views/user/login.vue'
import RegisterPage from '../src/views/user/register.vue'
import DisplayCabinetPage from '../src/views/displayCabinet/Index.vue'
import DisplayCabinetOverviewPage from '../src/views/displayCabinet/Overview.vue'
import ShipsPage from '../src/views/displayCabinet/ships/Index.vue'
import ShipDetailPage from '../src/views/displayCabinet/ships/Detail.vue'
import ItemsPage from '../src/views/displayCabinet/items/Index.vue'
import ItemDetailPage from '../src/views/displayCabinet/items/Detail.vue'
import ItemCategoryDetailPage from '../src/views/displayCabinet/items/Category.vue'

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

import MapsPage from '../src/views/Map.vue';
import TeamPage from '../src/views/Team.vue'
import AboutPage from '../src/views/About.vue'
import AchievementPage from '../src/views/Achievement.vue'
import NotFoundPage from '../src/views/NotFound.vue';
import {useI18n} from "vue-i18n";

import {useAuthStore} from "@/../stores";


const isLoginBeforeEnter = function (to: any, from: any, next) {
    const authStore = useAuthStore()

    if (authStore.user) {
        next();
    } else {
        next({path: '/account/login', query: {backUrl: to.fullPath}});
    }
}

const routes: Readonly<RouteRecordRaw[]> = [
    {
        path: '/',
        name: 'BasePortal',
        component: PortalMainBasePage,
        meta: {
            metaInfo: {
                title: 'home.title',
                keywords: 'home.meta.keywords'
            }
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
                beforeEnter: isLoginBeforeEnter,
                children: [
                    {
                        path: 'information',
                        name: 'AccountInformation',
                        component: AccountInformationPage
                    },
                    {
                        path: 'assemblys',
                        name: 'AccountAssemblys',
                        component: AccountAssemblysPage
                    },
                ]
            },
            {
                path: '/account/login',
                name: 'login',
                meta: {
                    metaInfo: {
                        title: 'login.title',
                        keywords: 'login.meta.keywords'
                    }
                },
                component: LoginPage
            },
            {
                path: '/account/register',
                name: 'register',
                meta: {
                    metaInfo: {
                        title: 'register.title',
                        keywords: 'register.meta.keywords'
                    }
                },
                component: RegisterPage
            },
            {
                path: '/team',
                name: 'Team',
                meta: {
                    metaInfo: {
                        title: 'teamUp.title',
                        keywords: 'teamUp.meta.keywords'
                    }
                },
                component: TeamPage,
            },
        ]
    },
    {
        path: '/display-cabinet',
        name: 'DisplayCabinet',
        component: DisplayCabinetPage,
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
                component: ShipsPage,
            },
            {
                path: 'ships/:id',
                name: 'ShipDetail',
                component: ShipDetailPage,
            },
            {
                path: 'items',
                name: 'Items',
                component: ItemsPage,
            },
            {
                path: 'item/:id',
                name: 'ItemDetail',
                component: ItemDetailPage,
            },
            {
                path: 'item/category/:name',
                name: 'ItemCategoryDetail',
                component: ItemCategoryDetailPage,
            },
            {
                path: 'ultimates',
                name: 'Ultimates',
                component: UltimatesPage,
            },
            {
                path: 'ultimate/:id',
                name: 'UltimateDetail',
                component: UltimateDetailPage,
            }
        ]
    },
    {
        path: '/calendar',
        name: 'Calendar',
        meta: {
            metaInfo: {
                title: 'calendar.title',
                keywords: 'calendar.meta.keywords'
            }
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
            metaInfo: {
                title: 'assembly.title',
                keywords: 'assembly.meta.keywords'
            }
        },
        name: 'Assembly',
        component: AssemblePage,
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
            }
        ]
    },

    {
        path: '/maps',
        name: 'maps',
        component: MapsPage,
    },
    {
        path: '/about',
        name: 'About',
        component: AboutPage,
    },
    {
        path: '/achievement',
        name: 'Achievement',
        component: AchievementPage
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

router.beforeEach((to, _from, next) => {
    try {
        const {t} = useI18n();

        if (to.meta.metaInfo) {
            let metaInfo: any = to.meta.metaInfo;
            if (metaInfo.keywords && t(metaInfo.keywords) !== metaInfo.keywords) metaInfo.keywords = "Glow Prow," + t(metaInfo.keywords);
            else metaInfo.keywords = "Glow Prow,glow-prow";
            if (metaInfo.title) metaInfo.title = t(metaInfo.title);
            else metaInfo.title = "";
            if (metaInfo.description && t(metaInfo.description) !== metaInfo.description) metaInfo.description = t(metaInfo.description);
            else metaInfo.description = "";
        }
    } catch (err) {
    } finally {
        next();
    }
});

export default router;
