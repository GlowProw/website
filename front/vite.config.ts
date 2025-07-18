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
        exclude: ['vuetify'],
    },
    define: {'process.env': {}},
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src') // 确保路径正确
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
        // '/api': {
        //     target: 'http://localhost:3000',
        //     changeOrigin: true,
        //     // rewrite: (path) => path.replace(/^\/api/, ''),
        //     // 如果需要，可以添加更多配置
        //     // secure: false, // 如果是https，可能需要这个
        //     // ws: true // 代理websockets
        // }
    },

})
