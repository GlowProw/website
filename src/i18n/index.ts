import {createI18n, type MessageContext} from 'vue-i18n';

import language from '@/../public/config/languages.json'

// 网站翻译
import zh_CN_local from '../lang/zh_CN.json';
import en_US_local from '../lang/en_US.json';

// 数据翻译
import {en_US as en_US_snb, zh_CN as zh_CN_snb} from 'glow-prow-data-languages/src'
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

const i18n = createI18n({
    legacy: false,
    messageCompiler,
    locale: storage.local.get('lang')?.data?.value?.value || language.default || 'zh-CN',
    fallbackLocale: 'en-US',
    missingWarn: false,
    fallbackWarn: false,
    messages: {
        'zh-CN': Object.assign(zh_CN_local, {'snb': zh_CN_snb}),
        'en-US': Object.assign(en_US_local, {'snb': en_US_snb}),
    },
    globalInjection: false,
})

export default i18n;
