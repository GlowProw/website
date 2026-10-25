import { createRouter, createWebHistory, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
import { SUPPORTED_LANGS } from '@/config/languages';
import { scrollBehavior, setupRouterGuards } from './guards';
import { portalRoutes } from './modules/portal';
import { codexRoutes } from './modules/codex';
import { assemblyRoutes } from './modules/assembly';
import { masteryRoutes } from './modules/mastery';
import { rankingRoutes } from './modules/ranking';
import { questRoutes } from './modules/quest';
import { calendarRoutes } from './modules/calendar';
import { widgetsRoutes } from './modules/widgets';
import { miscRoutes } from './modules/misc';

const PortalPage = () => import('@/views/portal/Home.vue');
const NotFoundPage = () => import('@/views/NotFound.vue');

// 聚合所有业务模块基础路由
const baseAppRoutes: readonly RouteRecordRaw[] = [
    ...portalRoutes,
    ...codexRoutes,
    ...assemblyRoutes,
    ...masteryRoutes,
    ...rankingRoutes,
    ...questRoutes,
    ...calendarRoutes,
    ...widgetsRoutes,
    ...miscRoutes,
];

/**
 * 遍历基础路由树，为所有顶级路径注入多语言前缀正则参数
 */
function createLocalizedRoutes(rawRoutes: readonly RouteRecordRaw[]): RouteRecordRaw[] {
    const langPattern = SUPPORTED_LANGS.join('|');
    return rawRoutes.map(r => {
        const langPath = r.path === '/'
            ? `/:lang(${langPattern})`
            : `/:lang(${langPattern})${r.path}`;
        return {
            ...r,
            path: langPath,
        };
    });
}

// 包含多语言前缀路由、根重定向入口与 404 兜底路由的完整路由表
const routes: readonly RouteRecordRaw[] = [
    // 全局多语言专属路由 (/:lang/...)
    ...createLocalizedRoutes(baseAppRoutes),
    // 根入口
    {
        path: '/',
        name: 'RootEntry',
        component: PortalPage,
    },
    // 未带语言前缀或未匹配路由的兜底捕获（由 beforeEach 守卫自动补全语言前缀并重定向）
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundPage,
    },
];

// 创建路由实例（兼容浏览器端与 Node SSG 环境）
const router = createRouter({
    history: typeof window !== 'undefined' ? createWebHistory() : createMemoryHistory(),
    routes: routes as RouteRecordRaw[],
    scrollBehavior,
});

setupRouterGuards(router);

export { routes, scrollBehavior, setupRouterGuards, SUPPORTED_LANGS };
export default router;
