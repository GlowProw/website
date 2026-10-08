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
    getAdsList(): string[] {
        const allKeys = storage_account.local.keys() as unknown as string[];
        return allKeys
            .filter(k => k && !this.NOT_AD.some(n => k.includes(n)))
            .map(k => k.replace(storage_account.local.name(''), ''));
    }
}
