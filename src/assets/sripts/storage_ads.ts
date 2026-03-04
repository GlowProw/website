/**
 * 账户数据
 */
import {storage_account} from "@/assets/sripts/index";

export default class AccountAds {
    NAME = ''
    NOT_AD = [
        'google.switch' // 开关
    ]

    constructor() {
    }

    /**
     * 取出广告列表
     */
    getAdsList(): [] {
        const d = storage_account.local.keys()

        if (d.code != 0)
            return []

        return d.data.value || []
    }
}
