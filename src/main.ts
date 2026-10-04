/**
 * 主程序入口 (main.ts) — vite-ssg SSG 模式
 */

// Node SSR 环境下为 Vuetify / JSDOM 补全缺失的全局浏览器对象
if (typeof globalThis !== 'undefined') {
    if (typeof (globalThis as any).ResizeObserver === 'undefined') {
        (globalThis as any).ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }
    if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
        (globalThis as any).IntersectionObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }
    if (typeof (globalThis as any).matchMedia === 'undefined') {
        (globalThis as any).matchMedia = (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        });
    }
    if (typeof (globalThis as any).visualViewport === 'undefined') {
        (globalThis as any).visualViewport = {
            width: 1920,
            height: 1080,
            offsetLeft: 0,
            offsetTop: 0,
            pageLeft: 0,
            pageTop: 0,
            scale: 1,
            addEventListener: () => {},
            removeEventListener: () => {},
        };
    }
}

import App from './App.vue'
import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from './i18n'
import vuetify from './vuetify'
import { routes, scrollBehavior } from '../router'
import { initGlobalErrorCapture } from './assets/sripts/error_logger'

// 导出 createApp，vite-ssg 在构建时调用以渲染每个路由
export const createApp = ViteSSG(
    App,
    {
        routes,
        base: '/',
        scrollBehavior,
    },
    ({ app, router, isClient }) => {
        const pinia = createPinia()

        // pinia-plugin-persistedstate 依赖 localStorage，仅在客户端使用
        if (isClient) {
            pinia.use(piniaPluginPersistedstate)
        }

        app.use(pinia)
        app.use(i18n)
        app.use(vuetify)

        // 错误捕获仅客户端
        if (isClient) {
            initGlobalErrorCapture(app)
        }

        // 恢复路由守卫：拦截 /robots.txt 等静态文件路径
        const staticFilePaths = ['/robots.txt', '/sitemap.xml', '/ads.txt'];
        router.beforeEach((to, from, next) => {
            if (staticFilePaths.includes(to.path)) {
                return false;
            }
            next();
        });
    }
)
