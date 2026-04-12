import i18n from '@/i18n'
import {use_local_locale} from "@/assets/sripts/use_local_locale";
import {type ComputedRef} from "vue"

/**
 * 翻译工具函数（Composition API）
 */
export function useI18nUtils(manualLocale?: ComputedRef<string | undefined>) {
    const {localLocale} = use_local_locale(manualLocale)
    const {tm: rawTm, locale: globalLocale} = i18n.global;

    const t = (key: string, variable: any = null, lang?: string) => {
        const targetLocale = lang || localLocale.value;
        // 使用针对 Composer (Vue 3) 全局实例最明确的签名
        // @ts-ignore
        const result = i18n.global.t(key, variable || {}, {locale: targetLocale});

        return result;
    }

    const te = (key: string, lang?: string) => {
        const targetLocale = lang || localLocale.value;
        // @ts-ignore
        return i18n.global.te(key, targetLocale);
    }

    /**
     * 清理字符串（移除数字）
     * @param input
     */
    const sanitizeString = <T extends string>(input: T) => {
        try {
            const removedNumbers: string[] = []

            if (!input)
                return {original: input, cleaned: input, removedNumbers}

            const cleaned = input.replace(/\d+/g, (match) => {
                removedNumbers.push(match)
                return ''
            })

            return {
                original: input,
                cleaned,
                removedNumbers
            }
        } catch (e) {
            console.error(e)
            return {
                original: input,
                cleaned: input,
                removedNumbers: []
            }
        }
    }

    /**
     * 获取翻译数组（支持指定语言）
     * @param key
     * @param lang
     */
    const tm = (key: string, lang?: string) => {
        const targetLocale = lang || localLocale.value;
        const messages = i18n.global.getLocaleMessage(targetLocale);

        // 简单的点路径解析逻辑
        return key.split('.').reduce((acc, part) => acc?.[part], messages as any);
    }

    /**
     * 获取翻译数组
     * @param keys
     * @param lang
     */
    const asArray = (keys: string[], lang?: string) => {
        let result: Record<string, any> = {}

        for (const i18nKey of keys) {
            const content = tm(i18nKey, lang)
            if (result[i18nKey]) break

            if (content && typeof content === 'string') {
                result[content] = -1
            } else if (content && typeof content === 'object' && JSON.stringify(content) !== '{}') {
                Object.values(content).forEach((i: any) => {
                    if (typeof i === 'object') {
                        Object.values(i).forEach((d: any) => {
                            result[d] = 0
                        })
                    } else if (i) {
                        result[i] = -1
                    }
                })
            }
        }

        return Object.keys(result)
    }

    /**
     * 获取翻译字符串
     * @param keys
     * @param options
     */
    const asString = (keys: string[], options: { backRawKey?: boolean, variable?: any, lang?: string } = {}) => {
        let result = ''

        for (const i18nKey of keys) {
            if (te(i18nKey, options.lang)) {
                const content = t(i18nKey, options.variable || null, options.lang || null)
                if (content && result.length <= 0 && result === '') {
                    result = content
                }
            }
        }

        if (result == '' && options.backRawKey)
            result = keys[0]

        return result
    }

    return {
        sanitizeString,
        asArray,
        asString,
        globalLocale,
        locale: localLocale,
        t,
        te,
        tm,
        rt: i18n.global.rt,
    }
}
