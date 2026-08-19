import {Ship} from "glow-prow-data";
import {Item} from "glow-prow-data/src/entity/Items";
import {useI18n} from "vue-i18n";

/**
 * 文本翻译数据
 */
export class TranslateDataLinks {
    Prefix = 'https://github.com/GlowProw/glow-prow-data-languages/blob/main/src/data'

    /**
     * 获取物品翻译文件链接
     */
    public item(data: Item): string {
        const {locale} = useI18n()

        return `${this.Prefix}/${locale.value.replace('-', '_')}/item.json`
    }

    /**
     * 获取船只翻译文件链接
     */
    public ship(data: Ship) {

    }
}
