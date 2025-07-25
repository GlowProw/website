import {useI18n} from "vue-i18n";

/**
 * 翻译工具类
 */
export default class I18n {
    sanitizeString<T extends string>(input: T): {
        original: T;
        cleaned: string;
        removedNumbers: string[];
    } {
        try {
            const removedNumbers: string[] = [];

            if (!input)
                return {original: input, cleaned: input, removedNumbers}

            // 使用正则表达式替换，同时捕获被移除的数字
            const cleaned = input.replace(/\d+/g, (match) => {
                removedNumbers.push(match);
                return '';
            });

            return {
                original: input,
                cleaned,
                removedNumbers
            };
        } catch (e) {
            console.error(e)
            return {
                original: input,
                cleaned: input,
                removedNumbers: []
            }
        }
    }


    asArray(keys = []) {
        const {tm} = useI18n()
        let result: any = {};

        // @ts-ignore
        for (let i18nKey: any of keys) {
            const content = tm(i18nKey);
            if (result[i18nKey])
                break;

            if (content && typeof content == 'string')
                result[content] = -1
            else if (content && typeof content === 'object' && content != '{}') {
                Object.values(content).forEach((i: any) => {
                    if (typeof i == 'object') {
                        Object.values(i).forEach((d: any) => {
                            result[d] = 0
                        })
                        // result = {...i, ...result}
                    } else if (i)
                        result[i] = -1
                })
            }
        }

        return Object.keys(result)
    }

    asString(keys = []) {
        const {te, t} = useI18n()
        let result = '';

        // @ts-ignore
        for (const i18nKey: any of keys) {
            if (te(i18nKey)) {
                const content = t(i18nKey);
                if (content)
                    result = content
            }
        }

        return result;
    }
}
