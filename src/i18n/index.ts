import {createI18n, type MessageContext} from 'vue-i18n';

import language from '@/config/languages.json'

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

            // 检查是否存在 __ 属性（Vue I18n 数组参数的约定）
            if (ctx.values.__) {
                // 处理数组参数（%s 占位符）
                let argIndex = 0;
                result = result.replace(/%s/g, () => {
                    // @ts-ignore
                    const arg = ctx.values.__[argIndex++];
                    if (arg === undefined) {
                        return '';
                    }
                    return String(arg)
                })
            } else {
                // 处理对象参数
                // 支持 {named} 和 {{named}} 两种格式
                result = result.replace(/\{\{?(\w+)\}?\}/g, (match: any, placeholder: any) => {
                    if (ctx.values[placeholder] !== undefined) {
                        return String(ctx.values[placeholder])
                    }
                    return match; // 保持原样而不是返回空字符串
                })
            }

            return result;
        } catch (err) {
            // onError?.(err instanceof Error ? err : new Error(String(err))
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

const i18n = createI18n({
    legacy: false,
    messageCompiler,
    locale: storage.local.get('lang')?.data?.value?.value || language.default || 'zh-CN',
    fallbackLocale: 'en-US',
    missingWarn: false,
    fallbackWarn: false,
    messages: {
        'zh-CN': deepMerge({}, zh_CN_local, zh_CN_meta, { 'snb': zh_CN_snb }),
        'zh-TW': deepMerge({}, zh_TW_local, zh_TW_meta, { 'snb': zh_TW_snb }),
        'en-US': deepMerge({}, en_US_local, en_US_meta, { 'snb': en_US_snb }),
    },
    globalInjection: false,
})

export default i18n;
