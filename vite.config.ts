import Vue from '@vitejs/plugin-vue'
import Vuetify, {transformAssetUrls} from 'vite-plugin-vuetify'
import {defineConfig} from 'vite'
import path from "path";

import config from "./package.json"

export default defineConfig({
    base: '/',
    plugins: [
        Vue({
            template: {transformAssetUrls},
        }),
        Vuetify({autoImport: true}),
    ],
    optimizeDeps: {
        exclude: [
            "glow-prow-assets",
            "glow-prow-data",
            "vuetify", "fsevents", "file-type", "'@zumer/snapdom'"
        ],
    },
    define: {'process.env': {}},
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
            }
        }
    },
})
