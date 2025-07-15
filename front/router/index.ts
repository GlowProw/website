import {createRouter, createWebHistory} from 'vue-router';
import PortalMainBasePage from '../src/views/portal/index.vue'
import PortalPage from '../src/views/portal/home.vue'
import AccountPage from '../src/views/user/index.vue'
import LoginPage from '../src/views/user/login.vue'
import RegisterPage from '../src/views/user/register.vue'

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

export default router;
