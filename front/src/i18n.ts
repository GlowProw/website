import {createI18n} from 'vue-i18n';
import zh_cn_local from './lang/zh_CN.json' // 中文

const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    messages: {
        'zh-CN': Object.assign(zh_cn_local),
    },
    globalInjection: true,
});

export default i18n;
