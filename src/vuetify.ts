import {createVuetify} from "vuetify/framework";

import {aliases, mdi} from "vuetify/iconsets/mdi";

import {en, zhHans} from "vuetify/locale";

// Styles
import '@/assets/styles/index.less'
import 'vuetify/styles/main.css';
import '@mdi/font/css/materialdesignicons.css'
import i18n from "./i18n";

let i: any = i18n;

const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases: {
            ...aliases,
        },
        sets: {
            mdi,
        },
    },
    locale: {
        locale: i.locale,
        fallback: i.locale,
        messages: {
            'en-US': en,
            'zh-CN': zhHans,
        },
    },
    theme: {
        defaultTheme: 'dark',
    },
});

export default vuetify
