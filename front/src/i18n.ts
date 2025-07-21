import {createI18n} from 'vue-i18n';

// 网站翻译
import zh_CN_local from './lang/zh_CN.json';
import en_US_local from './lang/en_US.json';

// 数据翻译
import {en_US as en_US_snb, zh_CN as zh_CN_snb} from 'glow-prow-data-languages/src'

const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    messages: {
        'zh-CN': Object.assign(zh_CN_local, {'snb': zh_CN_snb}),
        'en-US': Object.assign(en_US_local, {'snb': en_US_snb}),
    },
    globalInjection: true,
});

export default i18n;
