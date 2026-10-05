import { createVuetify } from "vuetify/framework";

import { aliases, mdi } from "vuetify/iconsets/mdi";

import { en, zhHans, zhHant } from "vuetify/locale";

// 样式导入
import '@/assets/styles/index.less'
import 'vuetify/styles/main.css';
import '@mdi/font/css/materialdesignicons.css'
import { DEFAULT_LANG } from "./config/languages";

export const createAppVuetify = (initialLocale = DEFAULT_LANG) => {
    return createVuetify({
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
            locale: initialLocale,
            fallback: DEFAULT_LANG,
            messages: {
                'en-US': en,
                'zh-CN': zhHans,
                'zh-TW': zhHant,
            },
        },
        theme: {
            defaultTheme: 'dark',
        },
    });
};

