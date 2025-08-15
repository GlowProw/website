import {useI18n} from 'vue-i18n'

/**
 * 翻译工具函数（Composition API）
 */
export function useI18nUtils() {
    const {tm, t, te, locale} = useI18n()

    /**
     * 清理字符串（移除数字）
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
     */
    const asArray = (keys: string[]) => {
        let result: Record<string, any> = {}

        for (const i18nKey of keys) {
            const content = tm(i18nKey)
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
     */
    const asString = (keys: string[], options: {backRawKey? : boolean, variable?: any, lang?: string} = {}) => {
        let result = ''

        for (const i18nKey of keys) {
            if (te(i18nKey)) {
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
        locale,
        t,
        te,
        tm,
    }
}
