import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv } from 'vite'
import type { UserConfig } from 'vite'
import Sitemap from 'vite-plugin-sitemap'
import path from "path";
import type { ViteSSGOptions } from 'vite-ssg'

import config from "./package.json"
import fs from 'node:fs';

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
        'questlog.json': '/quest/',
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

const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en-US'];

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
        'quest',
        'quest/list',
        'calendar',
        'calendar/history',
        'assembly',
        'assembly/workshop',
        'assembly/publish',
        'assembly/browse',
        'map',
        'apps',
        'apps/qqbot',
        'team',
        'search',
        'setting',
        'setting/routine',
        'setting/ads',
        'setting/storage',
        'setting/about',
        'setting/pwa',
        'setting/wishlist',
        'setting/log',
        'setting/subscriptions',
        'setting/advanced',
        'smugglers-report',
        'smugglers-report/view',
        'stateOfWar',
        'stateOfWar/view',
        'empire-skill-simulation',
        'mastery',
        'mastery/view',
        'mastery/share',
        'calculator',
        'drop',
        'reminder',
        'reminder/view',
    ];

    const dynamicRoutes = getDynamicDataRoutes();

    const basePaths = new Set<string>();
    rawStatic.forEach(p => basePaths.add(p ? `/${p}` : '/'));
    dynamicRoutes.forEach(p => basePaths.add(p.startsWith('/') ? p : `/${p}`));

    const allLocalizedRoutes: string[] = ['/'];
    SUPPORTED_LANGS.forEach(lang => {
        basePaths.forEach(p => {
            const clean = p === '/' ? '' : p;
            allLocalizedRoutes.push(`/${lang}${clean}`);
        });
    });

    return Array.from(new Set(allLocalizedRoutes)).sort();
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appHost = env.APP_HOST || env.VITE_APP_HOST || 'glow-prow.top';
    const appHostname = appHost.startsWith('http') ? appHost : `https://${appHost}`;

    return {
        envPrefix: ['VITE_', 'APP_'],
        base: '/',
        plugins: [
            Vue({
                template: { transformAssetUrls },
            }),
            Vuetify({ autoImport: true }),
            VitePWA({
                registerType: 'prompt',
                includeAssets: ['favicon.ico', 'favicon.png'],
                devOptions: {
                    enabled: false,
                    type: 'module',
                },
                manifest: {
                    name: 'Glow Prow',
                    short_name: 'GlowProw',
                    description: 'Glow Prow Client',
                    theme_color: '#222222ff',
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
                    ]
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,ico,png,svg,webp,avif,woff2}'],
                    maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB
                    navigateFallback: '/index.html',
                    navigateFallbackDenylist: [
                        /^\/sitemap\.xml$/,
                        /^\/robots\.txt$/,
                        /^\/ads\.txt$/,
                        /^\/5c65fd69dada4307bab754a14cf3d16c\.txt$/,
                        /^\/favicon\.ico$/,
                        /^\/favicon\.png$/,
                    ],
                }
            }),
            (() => {
                const plugin: any = Sitemap({
                    hostname: appHostname,
                    dynamicRoutes: getRoutes(),
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
    define: { 'process.env': {} },
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
            }
        }
    },
    publicDir: 'public',

    // vite-ssg 配置
    ssgOptions: {
        script: 'async',
        formatting: 'none',
        mock: false,
        concurrency: 5,
        // 预渲染所有静态路由与公开百科数据路由，跳过未填充参数的路由及私有路由
        includedRoutes(paths: string[], routes: any[]) {
            const allRoutes = getRoutes();
            const skip = [
                '/account',
                '/widgets',
                '/test',
                '/space',
                '/:pathMatch',
            ];
            return allRoutes.filter(p => {
                if (p.includes(':')) return false;
                const clean = p.replace(/^\/(zh-CN|zh-TW|en-US)/, '') || '/';
                return !skip.some(s => clean.startsWith(s));
            });
        },
        onBeforePageRender(route: string, indexHTML: string, ctx: any) {
            // 确保页面输出目录安全存在，防止并发写入时的目录竞态异常
            const relativeRouteFile = `${(route.endsWith('/') ? `${route}index` : route).replace(/^\//g, '')}.html`;
            const targetDir = path.resolve(__dirname, 'dist', path.dirname(relativeRouteFile));
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            return undefined;
        },
        onPageRendered(route: string, renderedHTML: string, ctx: any) {
            // 将重复的 350+ 行内联 vuetify-theme-stylesheet 替换为外部静态 CSS 文件引用
            return renderedHTML.replace(
                /<style id="vuetify-theme-stylesheet">[\s\S]*?<\/style>/,
                '<link rel="stylesheet" href="/assets/vuetify-theme.css" id="vuetify-theme-stylesheet">'
            );
        },
        onFinished() {
            // SSG 完成后的钩子
        },
        } as ViteSSGOptions,
    };
});
