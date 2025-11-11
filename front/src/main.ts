/**
 * main.ts
 */

import App from './App.vue'

import {createApp} from 'vue'
import router from "../router";
import {createPinia} from 'pinia'
import {createHead} from '@unhead/vue/client'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n, {initializeI18n} from './i18n';
import vuetify from "./vuetify";

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const head = createHead()

const app = createApp(App)

app.use(pinia)

// initializeI18n().then((i18n) => {
//     app.use(pinia)
//         .use(i18n)
//         .use(head)
//         .use(vuetify)
//     app.mount('#app')
// })

app
    .use(router)
    .use(pinia)
    .use(i18n)
    .use(head)
    .use(vuetify)
    .mount('#app')

export default app
