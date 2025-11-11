import {Ship} from "glow-prow-data";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {useI18n} from "vue-i18n";

/**
 * 文本翻译数据
 */
export class TranslateDataLinks {
    Prefix = 'https://github.com/GlowProw/glow-prow-data-languages/blob/main/src/data'

    public item(data: Item): string {
        const {locale} = useI18n()

        return `${Prefix}/${locale.value.replace('-','_')}/item.json`
    }

    public ship(data: Ship) {

    }
}
