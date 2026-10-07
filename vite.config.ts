import Vue from '@vitejs/plugin-vue'
import Vuetify, {transformAssetUrls} from 'vite-plugin-vuetify'
import {VitePWA} from 'vite-plugin-pwa'
import {defineConfig, loadEnv} from 'vite'
import Sitemap from 'vite-plugin-sitemap'
import path from "path";
import type {ViteSSGOptions} from 'vite-ssg'

import config from "./package.json"
import fs from 'node:fs';
import {DEFAULT_LANG, SUPPORTED_LANGS} from './src/config/languages';
import {STRUCTURED_DATA_MAP} from './src/config/structuredData';

/**
 * 同步生成公共语言重定向脚本，确保与 languages.ts 配置保持严格一致
 */
function ensureLangRedirectScript() {
    const supportedStr = JSON.stringify(SUPPORTED_LANGS);
    const defaultLangStr = JSON.stringify(DEFAULT_LANG);
    const scriptContent = `(function(){var supported=${supportedStr};var defaultLang=${defaultLangStr};var path=window.location.pathname;var hasLang=supported.some(function(l){return path==='/'+l||path.indexOf('/'+l+'/')===0;});if(!hasLang&&(path==='/'||path==='')){var rawStored=localStorage.getItem('snb.production:lang')||localStorage.getItem('snb.development:lang')||localStorage.getItem('lang');var lang=defaultLang;if(rawStored){try{var p=JSON.parse(rawStored);var val=(p&&p.data&&p.data.value)?p.data.value:(p&&p.value?p.value:p);if(typeof val==='object'&&val!==null&&val.value)val=val.value;if(typeof val==='string'&&supported.includes(val))lang=val;}catch(e){}}else{var nav=navigator.language||navigator.userLanguage||defaultLang;if(nav.indexOf('TW')!==-1||nav.indexOf('HK')!==-1||nav.indexOf('Hant')!==-1)lang='zh-TW';else if(nav.indexOf('zh')!==-1)lang='zh-CN';else lang='en-US';}if(!supported.includes(lang))lang=defaultLang;window.location.replace('/'+lang+(path==='/'?'':path));}})();`;
    const targetPath = path.resolve(__dirname, 'public/assets/lang-redirect.js');
    try {
        fs.mkdirSync(path.dirname(targetPath), {recursive: true});
        fs.writeFileSync(targetPath, scriptContent, 'utf8');
    } catch (e) {
    }
}

ensureLangRedirectScript();

/**
 * 直接从 glow-prow-data-languages 里 fs 读取 JSON 数据并聚合
 * 完全绕过 .ts 入口文件（避免 Node.js ESM 不编译 .ts 的问题）
 * 自动扫描 src/data/<lang>/ 下所有 .json 文件，新增语言/数据文件无需改这里
 */
function loadSnbI18nData(): Record<string, any> {
    const base = path.resolve(__dirname, 'node_modules/glow-prow-data-languages/src/data');
    const result: Record<string, any> = {};

    for (const lang of fs.readdirSync(base)) {
        const langDir = path.join(base, lang);
        if (!fs.statSync(langDir).isDirectory()) continue;

        const out: Record<string, any> = {};
        for (const file of fs.readdirSync(langDir)) {
            if (!file.endsWith('.json')) continue;
            const key = file.replace(/\.json$/, '');
            out[key] = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf8'));
        }

        // items = items + items_ammunition（和 glow-prow-data-languages/src/index.ts 保持一致）
        if (out.items && out.items_ammunition) {
            out.items = {...out.items, ...out.items_ammunition};
            delete out.items_ammunition;
        }
        result[lang] = out;
    }
    return result;
}

const snbI18nPlugin = {
    name: 'snb-i18n-data',
    resolveId(id: string) {
        if (id === 'virtual:snb-i18n-data') return '\0' + id;
    },
    load(id: string) {
        if (id !== '\0virtual:snb-i18n-data') return;
        // this.meta.ssr 在 vite build --ssr 时为 true，client build 时为 false
        // SSR: 聚合真实 3MB JSON 数据内联进 SSR bundle（prerender 需要）
        // Client: 返回空对象 stub（运行时由 remote_i18n 从 CDN 远程加载覆盖）
        if ((this as any).meta?.ssr) {
            const data = loadSnbI18nData();
            return `export default ${JSON.stringify(data)}`;
        }
        return `export default { zh_CN: {}, en_US: {}, zh_TW: {} }`;
    },
};

/**
 * 从 router/index.ts 中动态提取所有路由路径
 * 通过正则提取 path 定义，而不是直接 import 执行。
 */
const getDynamicDataRoutes = () => {
    // 从 glow-prow-data 中提取动态物品、材料、船只等详情页路由
    const dataPath = path.resolve(__dirname, 'node_modules/glow-prow-data/src/data');
    if (!fs.existsSync(dataPath)) return [];

    const result: string[] = [];
    const mapping = {
        'items.json': '/codex/item/',
        'materials.json': '/codex/material/',
        'ships.json': '/codex/ship/',
        'commodities.json': '/codex/commoditie/',
        'ultimates.json': '/codex/ultimate/',
        'modifications.json': '/codex/modification/',
        'sets.json': '/codex/set/',
        'treasureMaps.json': '/codex/treasureMap/',
        'mapLocations.json': '/codex/mapLocation/',
        'npcs.json': '/codex/npc/',
        'empireSkills.json': '/codex/empireSkill/',
        'masterys.json': '/codex/mastery/',
    };

    Object.entries(mapping).forEach(([file, prefix]) => {
        const filePath = path.join(dataPath, file);
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                Object.keys(data).forEach(id => {
                    if (file === 'empireSkills.json' && id === 'root') return;
                    result.push(`${prefix}${id}`);
                });
            } catch (e) {
                console.error(`Error parsing ${filePath}:`, e);
            }
        }
    });

    // 从 mapLocations.resources.json 提取资源分类页面路由
    const resourcesPath = path.join(dataPath, 'mapLocations.resources.json');
    if (fs.existsSync(resourcesPath)) {
        try {
            const resData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
            const categories = new Set<string>();
            Object.values(resData).forEach((loc: any) => {
                if (loc.category) categories.add(loc.category);
            });
            categories.forEach(cat => {
                result.push(`/codex/mapLocation/${cat}`);
            });
        } catch (e) {
            console.error(`Error parsing ${resourcesPath}:`, e);
        }
    }

    return result;
}

// 执行 SSG 静态预渲染的语言列表，仅预热'zh-CN', 'en-US'
const SSG_PRERENDER_LANGS = ['zh-CN', 'en-US'];

const SKIP_SSG_ROUTES = [
    '/test',
    '/:pathMatch',
];

const getRoutes = () => {
    const rawStatic = [
        '',
        'codex',
        'codex/ships',
        'codex/items',
        'codex/commodities',
        'codex/modifications',
        'codex/materials',
        'codex/cosmetics',
        'codex/sets',
        'codex/treasureMaps',
        'codex/treasureMaps/comparison',
        'codex/mapLocations',
        'codex/npcs',
        'codex/empireSkills',
        'codex/masterys',
        'codex/ultimates',
        'map',
        'map/view',
        'assembly',
        'assembly/browse',
        'calendar',
        'calculator',
        'drop',
        'smugglers-report',
        'smugglers-report/view',
        'stateOfWar',
        'reminder',
        'reminder/view',
        'setting',
        'setting/routine',
        'setting/ads',
        'setting/storage',
        'setting/about',
        'setting/wishlist',
        'setting/log',
        'setting/subscriptions',
        'setting/advanced',
        'apps',
        'apps/view',
        'apps/qq-bot',
        'team',
        'search',
        'ranking-designed-items',
        'ranking-designed-items/browse',
    ];

    const dynamicRoutes = getDynamicDataRoutes();

    const basePaths = new Set<string>();
    rawStatic.forEach(p => basePaths.add(p ? `/${p}` : '/'));
    dynamicRoutes.forEach(p => basePaths.add(p.startsWith('/') ? p : `/${p}`));

    const allLocalizedRoutes: string[] = ['/'];
    SSG_PRERENDER_LANGS.forEach(lang => {
        basePaths.forEach(p => {
            const clean = p === '/' ? '' : p;
            allLocalizedRoutes.push(`/${lang}${clean}`);
        });
    });

    return Array.from(new Set(allLocalizedRoutes)).sort();
};

/**
 * 获得实际可进行 SSG 静态预渲染的有效路由集合（剔除私有、依赖登录及重客户端 SPA 页面）
 */
const getPrerenderRoutes = () => {
    const allRoutes = getRoutes();
    const langPattern = new RegExp(`^/(${SUPPORTED_LANGS.join('|')})`);
    return allRoutes.filter(p => {
        if (p.includes(':')) return false;
        const clean = p.replace(langPattern, '') || '/';
        return !SKIP_SSG_ROUTES.some(s => clean === s || clean.startsWith(s + '/'));
    });
};

/**
 * 获得提交给搜索引擎的规范 Sitemap 路由
 * 仅包含已静态预渲染、内容完整且规范的 URL（排除根路径 '/'，避免与规范多语言首页重复）
 */
const getSitemapRoutes = () => {
    return getPrerenderRoutes().filter(p => p !== '/');
};

let renderedPageCount = 0;

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appHost = env.APP_HOST || '';
    const appHostname = appHost.startsWith('http') ? appHost : `https://${appHost}`;

    return {
        envPrefix: ['VITE_', 'APP_'],
        base: '/',
        plugins: [
            snbI18nPlugin,
            Vue({
                template: {transformAssetUrls},
            }),
            Vuetify({autoImport: true}),
            VitePWA({
                registerType: 'prompt',
                includeAssets: ['favicon.ico', 'favicon.png'],
                devOptions: {
                    enabled: false,
                    type: 'module',
                },
                manifest: {
                    name: 'Glow Prow | 闪耀船首',
                    short_name: '闪耀船首',
                    description: '《碧海黑帆 (Skull and Bones)》全能游戏百科与交互地图助手：全收集地图、船只配置模拟、全物品图鉴、走私差事与帝国技能树。',
                    lang: 'zh-CN',
                    start_url: '/',
                    scope: '/',
                    display: 'standalone',
                    background_color: '#000000',
                    theme_color: '#222222',
                    icons: [
                        {
                            src: 'favicon.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'favicon.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ],
                    translations: {
                        'zh-TW': {
                            name: 'Glow Prow | 閃耀船首',
                            short_name: '閃耀船首',
                            description: '《怒海戰記 (Skull and Bones)》全能遊戲百科與交互地圖助手：全收集地圖、船隻配置模擬、全物品圖鑑、走私差事與帝國技能樹。'
                        },
                        'en-US': {
                            name: 'Glow Prow | Skull and Bones Database & Map',
                            short_name: 'Glow Prow',
                            description: 'Skull and Bones comprehensive database and interactive map helper: collection map, ship loadout simulation, item codex, smugglers, and empire skills.'
                        }
                    }
                } as any,
                workbox: {
                    globPatterns: ['index.html', 'manifest*.webmanifest', '**/*.{js,css,ico,png,svg,webp,avif,woff2}'],
                    maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB
                    navigateFallback: '/index.html',
                    navigateFallbackDenylist: [
                        /^\/sitemap\.xml$/,
                        /^\/robots\.txt$/,
                        /^\/ads\.txt$/,
                        /^\/2b62795cf566484f8bc243e7055ae616\.txt$/,
                        /^\/WW_verify_.*\.txt$/,
                        /^\/favicon\.ico$/,
                        /^\/favicon\.png$/,
                    ],
                }
            }),
            (() => {
                const plugin: any = Sitemap({
                    hostname: appHostname,
                    dynamicRoutes: getSitemapRoutes(),
                    changefreq: 'weekly',
                    priority: 0.8,
                    lastmod: new Date()
                });
                const origCloseBundle = plugin.closeBundle;
                plugin.closeBundle = function (this: any, error?: any) {
                    if (error) return;
                    const outDir = path.resolve(__dirname, 'dist');
                    if (!fs.existsSync(outDir)) return;
                    return origCloseBundle?.call(this, error);
                };
                return plugin;
            })()
        ],
        optimizeDeps: {
            exclude: [
                "glow-prow-assets",
                "glow-prow-data",
                "vuetify", "fsevents", "file-type", "'@zumer/snapdom'"
            ],
        },
        // import.meta.env.SSR 由 vite-ssg 自动注入：
        //   SSR 构建（预渲染）= true，客户端 hydration = false
        // 这里显式声明避免某些 vite 版本缺失默认值
        define: {
            'process.env': {},
            '__APP_VERSION__': JSON.stringify(config.version),
        },
        ssr: {
            noExternal: ['vuetify'],
        },
        esbuild: {
            keepNames: true,
            drop: ['console', 'debugger'],
        },
        build: {
            ssrManifest: true,
            assetsDir: 'static/images',
            chunkSizeWarningLimit: 1000,
            minify: 'esbuild',
            rollupOptions: {
                output: {
                    preserveModulesRoot: 'node_modules/glow-prow-data',
                    manualChunks(id) {
                        if (id.includes('glow-prow-data')) {
                            return 'glow-prow-data'
                        }
                        if (id.includes('@xenova/transformers') || id.includes('onnxruntime')) {
                            return 'transformers'
                        }
                        if (id.includes('@tensorflow')) {
                            return 'tensorflow'
                        }
                    },
                    assetFileNames: (assetInfo: any) => {
                        if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
                            return `assets/[name].${config.name}.[hash][extname]`
                        }
                        return `assets/[name].${config.name}.[hash][extname]`
                    }
                }
            }
        },
        resolve: {
            alias: {
                // 导入资源别名
                '@glow-prow-assets': path.resolve(__dirname, 'node_modules/glow-prow-assets'),
                '@': path.resolve(__dirname, './src'),
                '~': path.resolve(__dirname, './'),
            },
            extensions: [
                '.js',
                '.json',
                '.jsx',
                '.mjs',
                '.ts',
                '.tsx',
                '.vue',
            ],
        },
        server: {
            port: 8080,
            proxy: {
                "/api": {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                    rewrite: (path: any) => path.replace(/^\/api/, ''),
                },
                "/assets-proxy": {
                    target: 'http://localhost:8088',
                    changeOrigin: true,
                    rewrite: (path: any) => path.replace(/^\/assets-proxy/, '/api'),
                },
                "/mode": {
                    target: 'http://localhost:8088',
                    changeOrigin: true,
                },
                // 远程游戏数据翻译 CDN 代理
                "/lang-api": {
                    target: 'https://lang.glow-prow.top',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path: any) => path.replace(/^\/lang-api/, '/src/data'),
                }
            }
        },
        publicDir: 'public',

        // vite-ssg 配置
        ssgOptions: {
            script: 'async',
            formatting: 'minify',
            mock: false,
            concurrency: 5,
            // 预渲染所有静态路由与公开百科数据路由，跳过未填充参数的路由及私有路由
            includedRoutes(paths: string[], routes: any[]) {
                return getPrerenderRoutes();
            },
            onBeforePageRender(route: string, indexHTML: string, ctx: any) {
                // 确保页面输出目录安全存在，防止并发写入时的目录竞态异常
                const relativeRouteFile = `${(route.endsWith('/') ? `${route}index` : route).replace(/^\//g, '')}.html`;
                const targetDir = path.resolve(__dirname, 'dist', path.dirname(relativeRouteFile));
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, {recursive: true});
                }
                return undefined;
            },
            onPageRendered(route: string, renderedHTML: string, ctx: any) {
                renderedPageCount++;
                if (renderedPageCount % 10 === 0 && typeof (globalThis as any).gc === 'function') {
                    try {
                        (globalThis as any).gc();
                    } catch (e) {
                    }
                }

                // 显式清理已渲染页面上下文中的组件和路由实例引用，辅助 V8 垃圾回收释放内存
                if (ctx) {
                    if (ctx.app) {
                        try {
                            if (ctx.app._context) {
                                ctx.app._context.provides = Object.create(null);
                                ctx.app._context.components = Object.create(null);
                                ctx.app._context.directives = Object.create(null);
                                ctx.app._context.mixins = [];
                                ctx.app._context.app = null;
                            }
                            if (ctx.app.unmount) ctx.app.unmount();
                            ctx.app._instance = null;
                            ctx.app._container = null;
                            ctx.app._context = null;
                        } catch (e) {
                        }
                    }
                    if (ctx.router) {
                        try {
                            if (ctx.router.currentRoute) {
                                ctx.router.currentRoute.value = null;
                            }
                        } catch (e) {
                        }
                    }
                    if (ctx.head) {
                        try {
                            if (typeof ctx.head.dispose === 'function') {
                                ctx.head.dispose();
                            }
                            if (ctx.head.entries) {
                                ctx.head.entries.clear();
                            }
                            if (ctx.head.plugins) {
                                ctx.head.plugins.clear();
                            }
                        } catch (e) {
                        }
                    }
                }

                // 1. 确定当前页面的语言
                let lang = DEFAULT_LANG;
                for (const l of SUPPORTED_LANGS) {
                    if (route.startsWith(`/${l}`) || route === `/${l}`) {
                        lang = l;
                        break;
                    }
                }

                let html = renderedHTML;

                // 2. 将重复的 350+ 行内联 vuetify-theme-stylesheet 替换为外部静态 CSS 文件引用
                html = html.replace(
                    /<style id="vuetify-theme-stylesheet">[\s\S]*?<\/style>/,
                    '<link rel="stylesheet" href="/assets/vuetify-theme.css" id="vuetify-theme-stylesheet">'
                );

                // 3. 根据页面语言动态匹配对应的 WebManifest
                html = html.replace(
                    /<link rel="manifest" href="[^"]*">/,
                    `<link rel="manifest" href="/manifest.${lang}.webmanifest">`
                );

                // 4. 多语言路由页面无需语言重定向脚本，直接剔除以精简体积
                const isLangRoute = SUPPORTED_LANGS.some(l => route.startsWith(`/${l}`) || route === `/${l}`);
                if (isLangRoute) {
                    html = html.replace(/<script src="\/assets\/lang-redirect\.js"><\/script>\s*/, '');
                }

                // 5. 清理原本可能遗留的旧 JSON-LD，并注入当前语言的紧凑 JSON-LD
                html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
                const ldJsonData = STRUCTURED_DATA_MAP[lang] || STRUCTURED_DATA_MAP[DEFAULT_LANG];
                const ldJsonScript = `<script type="application/ld+json">${JSON.stringify(ldJsonData)}</script>`;
                html = html.replace('</head>', `${ldJsonScript}</head>`);

                // 6. 还原 <meta> 和 <link> 标签中被 HTML DOM 序列化转义的 URL 参数 (&amp; -> &)
                html = html.replace(/(<(?:meta|link)\s+[^>]*?(?:content|href)="[^"]*?")/gi, (match) => {
                    return match.replace(/&amp;/g, '&');
                });

                // 7. 高效 HTML 静态代码压缩 (Minify)：
                const preservedBlocks: string[] = [];
                // 保护 pre / code / textarea 标签内容中的原始换行与格式
                html = html.replace(/<(pre|code|textarea)[\s\S]*?<\/\1>/gi, (match) => {
                    preservedBlocks.push(match);
                    return `___PRESERVED_BLOCK_${preservedBlocks.length - 1}___`;
                });

                // - 移除 HTML 开发者注释（严格保留 Vue 3 SSR 水合标记 <!--[-->, <!--]-->, <!----> 等）
                html = html.replace(/<!--(?!\[if|\/?\[|!)[\s\S]*?-->/g, '');
                // - 移除大量无用的 style="" 冗余属性
                html = html.replace(/\s+style=""(?=[\s>])/g, '');
                // - 压缩标签之间的换行与连续空白（闭合标签与下一标签之间的多余空白折叠）
                html = html.replace(/>\s*[\r\n]+\s*</g, '><');
                // - 移除行首空格缩进以精简传输体积
                html = html.replace(/^[ \t]+/gm, '');
                // - 将标签内部多个连续水平空格压缩为单个空格
                html = html.replace(/[ \t]{2,}/g, ' ');

                // 还原受保护的代码块
                preservedBlocks.forEach((block, idx) => {
                    html = html.replace(`___PRESERVED_BLOCK_${idx}___`, block);
                });

                return html.trim();
            },
            onFinished() {
                // SSG 完成后的钩子
            },
        } as ViteSSGOptions,
    };
});
