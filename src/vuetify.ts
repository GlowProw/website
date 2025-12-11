import {createVuetify} from "vuetify/framework";
import {aliases as aliasesSvg, mdi as mdiSvg} from "vuetify/iconsets/mdi-svg";
import { mdiCog } from '@mdi/js'

import {en, zhHans} from "vuetify/locale";

// mdi-block-helper
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
            ...aliasesSvg,
            cog: mdiCog
        },
        sets: {
            // mdi,
            mdi: mdiSvg
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
