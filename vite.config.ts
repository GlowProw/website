import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import Sitemap from 'vite-plugin-sitemap'
import path from "path";

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
        'cosmetics.json': '/codex/commodity/',
        'sets.json': '/codex/set/',
        'treasureMaps.json': '/codex/treasureMap/',
        'mapLocations.json': '/codex/mapLocation/',
        'npcs.json': '/codex/npc/',
    };

    Object.entries(mapping).forEach(([file, prefix]) => {
        const filePath = path.join(dataPath, file);
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                Object.keys(data).forEach(id => {
                    result.push(`${prefix}${id}`);
                });
            } catch (e) {
                console.error(`Error parsing ${filePath}:`, e);
            }
        }
    });

    return result;
}

const getRoutes = () => {
    const routerPath = path.resolve(__dirname, 'router/index.ts');
    const staticRoutes: string[] = [];

    if (fs.existsSync(routerPath)) {
        const content = fs.readFileSync(routerPath, 'utf8');
        const stack: { path: string, indent: number }[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const pathMatch = line.match(/path\s*:\s*['"]([^'":*]+)['"]/);

            if (pathMatch) {
                const indent = line.search(/\S/);
                let p = pathMatch[1];

                while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
                    stack.pop();
                }

                let fullPath = p;
                if (!p.startsWith('/') && stack.length > 0) {
                    const parent = stack[stack.length - 1].path;
                    fullPath = (parent.endsWith('/') ? parent : parent + '/') + p;
                } else if (!p.startsWith('/')) {
                    fullPath = '/' + p;
                }

                if (fullPath.length > 1 && fullPath.endsWith('/')) fullPath = fullPath.slice(0, -1);
                if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;

                staticRoutes.push(fullPath);

                let hasChildren = false;
                for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
                    if (lines[j].includes('children:')) {
                        hasChildren = true;
                        break;
                    }
                    if (lines[j].includes('path:') && lines[j].search(/\S/) <= indent) break;
                }

                if (hasChildren) {
                    stack.push({ path: fullPath, indent: indent });
                }
            }
        }
    }

    const dynamicRoutes = getDynamicDataRoutes();
    return Array.from(new Set([...staticRoutes, ...dynamicRoutes])).sort();
}

export default defineConfig({
    base: '/',
    plugins: [
        Vue({
            template: { transformAssetUrls },
        }),
        Vuetify({ autoImport: true }),
        VitePWA({
            registerType: 'autoUpdate',
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
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
            }
        }),
        Sitemap({
            hostname: 'https://glow-prow.org.cn',
            dynamicRoutes: getRoutes(),
            changefreq: 'weekly',
            priority: 0.8,
            lastmod: new Date(),
        })
    ],
    optimizeDeps: {
        exclude: [
            "glow-prow-assets",
            "glow-prow-data",
            "vuetify", "fsevents", "file-type", "'@zumer/snapdom'"
        ],
    },
    define: { 'process.env': {} },
    build: {
        assetsDir: 'static/images',
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
            keep_classnames: true,
            keep_fnames: true,
            compress: {
                keep_classnames: true,
                keep_fnames: true,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: [
                    'console.log',
                    'console.debug',
                    'console.info',
                    'console.warn',
                    'console.table',
                    'console.dir'
                ],
            },
        },
        rollupOptions: {
            output: {
                preserveModulesRoot: 'node_modules/glow-prow-data',
                manualChunks(id) {
                    if (id.includes('glow-prow-data')) {
                        return 'glow-prow-data'
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
            // import assets
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
            }
        }
    },
})
