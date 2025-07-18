/**
 * main.ts
 */

// Components
import App from './App.vue'

import {createApp} from 'vue'
import router from "../router";
import {createVuetify} from 'vuetify';
import {createPinia} from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from './i18n';

// Styles
import 'vuetify/styles';
import './assets/styles/index.less'
import {aliases, mdi} from 'vuetify/iconsets/mdi'; // 可选：图标支持

const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {mdi},
    },
    theme: {
        defaultTheme: 'dark',
    },
});

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app
    .use(router)
    .use(vuetify)
    .use(pinia)
    .use(i18n)
    .mount('#app')
