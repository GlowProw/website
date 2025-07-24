import Vue from '@vitejs/plugin-vue'
import Vuetify, {transformAssetUrls} from 'vite-plugin-vuetify'

import {defineConfig} from 'vite'
import path from "path";

export default defineConfig({
    plugins: [
        Vue({
            template: {transformAssetUrls},
        }),
        Vuetify({autoImport: true}),
    ],
    optimizeDeps: {
        exclude: ['vuetify', 'glow-prow-assets'],
    },
    define: {'process.env': {}},
    build: {
        assetsDir: 'static/images',
    },
    resolve: {
        alias: {
            // import assets
            '@glow-prow-assets': path.resolve(__dirname, 'node_modules/glow-prow-assets'),
            '@': path.resolve(__dirname, './src')
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
