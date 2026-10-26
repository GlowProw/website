import { getCurrentSeasonId, storage } from '@/assets/sripts';
import { useAuthStore } from '@/../stores/userAccountStore';
import { useAssetsStore } from '@/../stores/assetsStore';
import { useCDNAssetsServiceStore } from '~/stores/cdnAssetsStore';
import { normalizeLang, DEFAULT_LANG, isSupportedLang } from '@/config/languages';

// 静态文件白名单路径，不进行语言重定向与页面滚动
export const staticFilePaths = ['/robots.txt', '/sitemap.xml', '/ads.txt'];

/**
 * 获取当前进行中或最新发布的赛季 ID
 */
export const getLatestSeasonId = (): string => {
    return getCurrentSeasonId('crimsonWaters');
};

/**
 * 登录前置守卫：未登录时拦截并跳转到登录页面
 */
export const isLoginBeforeEnter = function (to: any, from: any, next: any) {
    const authStore = useAuthStore();

    if (authStore.user) {
        next();
    } else {
        next({ path: '/account/signin', query: { backUrl: to.fullPath } });
    }
};

/**
 * 初始化用户个人资料信息
 */
export const initAccountInfo = async function (to: any, from: any, next: any) {
    const authStore = useAuthStore();

    try {
        await authStore.fetchAccountProfile();
    } catch (e) {
        console.error(e);
    }
};

/**
 * 初始化物品本地资产与 CDN 资源
 */
export const initItemAssets = () => {
    const { init } = useAssetsStore();
    init();
    initCDNAssets();
};

/**
 * 从本地存储中预加载 CDN 资源配置
 */
export const initCDNAssets = () => {
    const { loadFromStorage } = useCDNAssetsServiceStore();
    loadFromStorage();
};

/**
 * 自定义路由切换滚动行为控制
 */
export const scrollBehavior = (to: any, from: any, savedPosition: any) => {
    if (staticFilePaths.includes(to.path)) {
        return false;
    }

    if (typeof window === 'undefined') {
        return { top: 0 };
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            // 检查是否有 scrollTop=false 查询参数
            const scrollTopParam = <boolean | string>to.query.scrollTop;
            if (scrollTopParam === 'false' || scrollTopParam == false) {
                resolve(false);
                return;
            }

            if (to.hash) {
                resolve({
                    el: to.hash,
                    behavior: 'smooth',
                    top: (typeof document !== 'undefined' && document.querySelector('header')) ? 70 : 0
                });
            } else if (savedPosition) {
                resolve(savedPosition);
            } else {
                resolve({ top: 0, behavior: 'smooth' });
            }
        }, 300);
    });
};

/**
 * 配置全局路由守卫与动态 resolve 语言补全
 */
export function setupRouterGuards(r: any) {
    if (r && typeof r.resolve === 'function' && !r.__hasCustomResolve) {
        const origResolve = r.resolve.bind(r);
        r.resolve = (to: any, currentLocation: any) => {
            let normalizedTo = to;
            if (typeof to === 'object' && to !== null) {
                if ('name' in to && to.name && (!to.params || !to.params.lang)) {
                    const pathStr = (currentLocation?.path || r.currentRoute?.value?.path || '') as string;
                    const pathFirstSeg = pathStr.split('/').filter(Boolean)[0];
                    const langFromPath = pathFirstSeg && isSupportedLang(pathFirstSeg) ? pathFirstSeg : '';

                    const currentLang = (currentLocation?.params?.lang as string)
                        || (r.currentRoute?.value?.params?.lang as string)
                        || langFromPath
                        || DEFAULT_LANG;

                    normalizedTo = {
                        ...to,
                        params: {
                            ...(to.params || {}),
                            lang: (to.params && to.params.lang) ? to.params.lang : currentLang,
                        }
                    };
                }
            }
            return origResolve(normalizedTo, currentLocation);
        };
        r.__hasCustomResolve = true;
    }

    r.beforeEach((to: any, from: any, next: any) => {
        if (staticFilePaths.includes(to.path)) {
            return false;
        }

        const segments = to.path.split('/').filter(Boolean);
        const firstSegment = segments[0];

        // 如果包含合法的语言前缀
        if (firstSegment && isSupportedLang(firstSegment)) {
            if (typeof window !== 'undefined') {
                storage.local.set('lang', { value: firstSegment });
            }
            return next();
        }

        // 客户端未带语言前缀的路径自动补全语言并重定向
        if (typeof window !== 'undefined') {
            const rawStored = storage.local.get('lang')?.data?.value;
            const stored = (typeof rawStored === 'object' && rawStored !== null && rawStored.value) ? rawStored.value : rawStored;
            const targetLang = (typeof stored === 'string' && isSupportedLang(stored))
                ? stored
                : (normalizeLang(navigator.language) || DEFAULT_LANG);

            const cleanPath = to.path === '/' ? '' : to.path;
            return next({ path: `/${targetLang}${cleanPath}`, query: to.query, hash: to.hash, replace: true });
        }

        next();
    });
}
