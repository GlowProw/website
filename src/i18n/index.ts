import language, { normalizeLang } from '@/config/languages'
import {createI18n, type MessageContext} from 'vue-i18n';

// 网站翻译
import zh_CN_local from '@/lang/zh_CN/data.json';
import zh_CN_meta from '@/lang/zh_CN/meta.json';

import zh_TW_local from '@/lang/zh_TW/data.json';
import zh_TW_meta from '@/lang/zh_TW/meta.json';

import en_US_local from '@/lang/en_US/data.json';
import en_US_meta from '@/lang/en_US/meta.json';

// 数据翻译
import {en_US as en_US_snb, zh_CN as zh_CN_snb, zh_TW as zh_TW_snb} from 'glow-prow-data-languages/src'
import {storage} from "@/assets/sripts";

export const messageCompiler = (message: any) => {
    return (ctx: MessageContext) => {
        try {
            if (!ctx.values) {
                return message;
            }

            let result = message.toString()

            const stringifyVal = (val: any): string => {
                if (val === undefined || val === null) return '';
                if (typeof val === 'string') return val;
                if (val instanceof Error) return val.message || val.name;
                if (typeof val === 'object') {
                    try { return val.message || val.code || JSON.stringify(val); } catch { return String(val); }
                }
                return String(val);
            };

            // 检查是否存在 __ 属性（Vue I18n 数组参数的约定）
            if (ctx.values.__) {
                // 处理数组参数（%s 占位符）
                let argIndex = 0;
                result = result.replace(/%s/g, () => {
                    // @ts-ignore
                    const arg = ctx.values.__[argIndex++];
                    return stringifyVal(arg);
                })
            } else {
                // 处理对象参数
                // 支持 {named} 和 {{named}} 两种格式
                result = result.replace(/\{\{?(\w+)\}?\}/g, (match: any, placeholder: any) => {
                    if (ctx.values[placeholder] !== undefined) {
                        return stringifyVal(ctx.values[placeholder]);
                    }
                    return match; // 保持原样而不是返回空字符串
                })
            }

            return result;
        } catch (err) {
            return message;
        }
    };
};

const isObject = (item: any) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

const deepMerge = (target: any, ...sources: any[]): any => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
}

/**
 * 从语言配置的回退语言字段中寻找回退语言
 */
const getFallbackLocale = (): string => {
    return language.fallback || language.mapping || 'en-US';
};

/**
 * 获取浏览器语言并匹配支持的语言
 */
const getBrowserLocale = (): string => {
    // 支持的语言列表
    const supportedLocales = ['zh-CN', 'zh-TW', 'en-US'];
    // 从回退语言字段中寻找
    const fallbackLocale = getFallbackLocale();

    // 获取浏览器语言
    const browserLang = navigator.language || (navigator as any).userLanguage || fallbackLocale;

    // 检查是否完全匹配
    if (supportedLocales.includes(browserLang)) {
        return browserLang;
    }

    // 处理简写形式，如 'zh' -> 'zh-CN', 'en' -> 'en-US'
    const shortLang = browserLang.split('-')[0];
    for (const locale of supportedLocales) {
        if (locale.split('-')[0] === shortLang) {
            return locale;
        }
    }

    // 目标语言缺失，从回退语言字段中找
    return fallbackLocale;
};

/**
 * 获取最终使用的语言
 */
const getInitialLocale = (): string => {
    const fallbackLocale = getFallbackLocale();

    // 优先使用 URL query 参数中的 lang
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLangParam = urlParams.get('lang');
        const normalizedUrlLang = normalizeLang(urlLangParam);
        if (normalizedUrlLang) {
            storage.local.set('lang', { value: normalizedUrlLang });
            return normalizedUrlLang;
        }
    }

    // 其次使用存储的语言
    const storedVal = storage.local.get('lang')?.data?.value;
    const storedLang = (typeof storedVal === 'object' && storedVal !== null) ? storedVal.value : storedVal;
    if (storedLang && ['zh-CN', 'zh-TW', 'en-US'].includes(storedLang)) {
        return storedLang;
    }

    // 再次使用浏览器语言
    const browserLocale = getBrowserLocale();

    // 目标语言缺失，从回退语言字段中找
    return browserLocale || fallbackLocale;
};

const en_US_bundle = deepMerge({}, en_US_local, en_US_meta, { 'snb': en_US_snb });
const zh_CN_bundle = deepMerge({}, zh_CN_local, zh_CN_meta, { 'snb': zh_CN_snb });
const zh_TW_bundle = deepMerge({}, zh_TW_local, zh_TW_meta, { 'snb': zh_TW_snb });

const i18n = createI18n({
    legacy: false,
    messageCompiler,
    locale: getInitialLocale(),
    fallbackLocale: getFallbackLocale(),
    fallbackRoot: true,
    missingWarn: false,
    fallbackWarn: false,
    messages: {
        'en-US': en_US_bundle,
        'zh-CN': deepMerge({}, en_US_bundle, zh_CN_bundle),
        'zh-TW': deepMerge({}, en_US_bundle, zh_TW_bundle),
    },
    globalInjection: false,
})

export default i18n;
