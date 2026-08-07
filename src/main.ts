/**
 * main.ts
 */

import App from './App.vue'

import {createApp} from 'vue'
import router from "../router"
import {createPinia} from 'pinia'
import {createHead} from '@unhead/vue/client'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from './i18n'
import vuetify from "./vuetify";

import { initGlobalErrorCapture } from './assets/sripts/error_logger'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const head = createHead()

const app = createApp(App)

initGlobalErrorCapture(app)

app.use(pinia)

app
    .use(router)
    .use(pinia)
    .use(i18n)
    .use(head)
    .use(vuetify)
    .mount('#app')

export default app
