import {createRouter, createWebHistory} from 'vue-router';
import i18n from "../src/i18n.ts";

import PortalMainBasePage from '../src/views/portal/Index.vue'
import PortalPage from '../src/views/portal/Home.vue'
import AccountPage from '../src/views/user/Index.vue'
import LoginPage from '../src/views/user/login.vue'
import RegisterPage from '../src/views/user/register.vue'
import DisplayCabinetPage from '../src/views/displayCabinet/Index.vue'
import DisplayCabinetOverviewPage from '../src/views/displayCabinet/Overview.vue'
import ShipsPage from '../src/views/displayCabinet/ships/Index.vue'
import ShipDetailPage from '../src/views/displayCabinet/ships/Detail.vue'
import ItemsPage from '../src/views/displayCabinet/items/Index.vue'
import ItemDetailPage from '../src/views/displayCabinet/items/Detail.vue'
import ItemCategoryDetailPage from '../src/views/displayCabinet/items/Category.vue'

import CalendarPage from '../src/views/calendar/Index.vue'
import CalendarHistoryPage from '../src/views/calendar/History.vue'
import CalendarHistorysPage from '../src/views/calendar/Historys.vue'

import MapsPage from '../src/views/Map.vue';
import TeamPage from '../src/views/Team.vue'
import AboutPage from '../src/views/About.vue'
import AchievementPage from '../src/views/Achievement.vue'
import NotFoundPage from '../src/views/NotFound.vue';

const routes = [
    {
        path: '/',
        name: 'BasePortal',
        component: PortalMainBasePage,
        children: [
            {
                path: '/',
                name: 'PortalHome',
                component: PortalPage
            },
            {
                path: '/account/home',
                name: 'accountHome',
                component: AccountPage,
            },
            {
                path: '/account/login',
                name: 'login',
                component: LoginPage
            },
            {
                path: '/account/register',
                name: 'register',
                component: RegisterPage
            },
            {
                path: '/team',
                name: 'Team',
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
            }
        ]
    },
    {
        path: '/calendar',
        name: 'Calendar',
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

    // 嵌套路由示例
    // {
    //     path: '/user/:id',
    //     name: 'User',
    //     component: () => import('../views/User.vue'), // 懒加载组件
    //     children: [
    //         {
    //             path: 'profile', // 匹配 /user/:id/profile
    //             component: () => import('../views/UserProfile.vue'),
    //         },
    //         {
    //             path: 'posts', // 匹配 /user/:id/posts
    //             component: () => import('../views/UserPosts.vue'),
    //         },
    //     ],
    // },
    // 404 路由（必须放在最后）
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundPage,
    },
];

const router = createRouter({
    history: createWebHistory(), // 使用 History 模式
    routes,
});

router.beforeEach((to, from, next) => {
    try {
        if (to.meta.metaInfo) {
            let _metainfo = to.meta.metaInfo;
            if (_metainfo.keywords && i18n.t(_metainfo.keywords) !== _metainfo.keywords) _metainfo.keywords = "bfban,BFBAN," + i18n.t(_metainfo.keywords);
            else _metainfo.keywords = "bfban,BFBAN";
            if (_metainfo.title) _metainfo.title = i18n.t(_metainfo.title);
            else _metainfo.title = "";
            if (_metainfo.description && i18n.t(_metainfo.description) !== _metainfo.description) _metainfo.description = i18n.t(_metainfo.description);
            else _metainfo.description = "";
        }
    } catch (err) {
    } finally {
        next();
    }
});

export default router;
