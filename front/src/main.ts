/**
 * main.ts
 */

// Components
import App from './App.vue'

import {createApp} from 'vue'
import router from "../router";
import {createPinia} from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from './i18n';
import vuetify from "./vuetify";

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.config.globalProperties.$t = i18n.global.t;

app
    .use(router)
    .use(pinia)
    .use(i18n)
    .use(vuetify)
    .mount('#app')

export default app
