import { useI18n } from "vue-i18n";
import { use_local_locale } from "@/assets/sripts/use_local_locale";
import { type ComputedRef } from "vue";
import { getAppI18n } from "@/i18n";

/**
 * 翻译工具函数（Composition API）
 */
export function useI18nUtils(manualLocale?: ComputedRef<string | undefined>) {
    const { localLocale } = use_local_locale(manualLocale);
    
    const getComposer = () => {
        try {
            return useI18n();
        } catch {
            try {
                return getAppI18n()?.global;
            } catch {
                return null;
            }
        }
    };

    /**
     * 翻译指定 key 对应文本
     */
    const t = (key: string, variable: any = null, lang?: string) => {
        const targetLocale = lang || localLocale.value;
        const composer = getComposer();
        if (composer) {
            return composer.t(key, variable || {}, { locale: targetLocale });
        }
        return key;
    };

    /**
     * 检查 key 是否存在翻译
     */
    const te = (key: string, lang?: string) => {
        const targetLocale = lang || localLocale.value;
        const composer = getComposer();
        if (composer) {
            return composer.te(key, targetLocale);
        }
        return false;
    };

    /**
     * 获取翻译数组（支持指定语言）
     * @param key
     * @param lang
     */
    const tm = (key: string, lang?: string) => {
        const targetLocale = lang || localLocale.value;
        const composer = getComposer();
        if (composer) {
            const messages = composer.getLocaleMessage(targetLocale);
            return key.split('.').reduce((acc: any, part: string) => acc?.[part], messages as any);
        }
        return undefined;
    };

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
                result[content] = i18nKey
            } else if (content && typeof content === 'object' && JSON.stringify(content) !== '{}') {
                Object.values(content).forEach((i: any) => {
                    if (typeof i === 'object') {
                        Object.values(i).forEach((d: any) => {
                            result[d] = d
                        })
                    } else if (i) {
                        result[i] = i18nKey
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
            const content = tm(i18nKey, options.lang);
            if (content) {
                if (Array.isArray(content)) {
                    result = content.map((_, idx) => t(`${i18nKey}.${idx}`, options.variable || null, options.lang || null)).join('\n');
                    if (result && result.length > 0) {
                        break;
                    }
                } else if (typeof content === 'string') {
                    const text = t(i18nKey, options.variable || null, options.lang || null);
                    if (text && result.length <= 0 && result === '') {
                        result = text;
                        break;
                    }
                }
            } else if (te(i18nKey, options.lang)) {
                const text = t(i18nKey, options.variable || null, options.lang || null);
                if (text && result.length <= 0 && result === '') {
                    result = text;
                    break;
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
        globalLocale: getComposer()?.locale,
        locale: localLocale,
        t,
        te,
        tm,
        rt: (v: any) => {
            const comp = getComposer();
            if (comp && comp.rt) return comp.rt(v);
            return String(v);
        },
    }
}
