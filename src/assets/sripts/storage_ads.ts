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
        const d = storage_account.values()

        if (d.code != 0)
            return []

        // console.log(d.data.value)

        return d.data.value || []
    }

    /**
     * 取出所有值
     */
    // values() {
    //     let accountData: any = this.ACCOUNTDATA,
    //         storageName = this.STORAGENAME;
    //
    //     accountData = accountData.map((i: any) => {
    //         switch (i.type) {
    //             case 'session': {
    //                 try {
    //                     let d = super.session.get(`${i.name}`
    //                     return {
    //                         value: storageName + i.name,
    //                         data: d.data.value
    //                     };
    //                 } catch (e) {
    //                     return {
    //                         value: storageName + i.name,
    //                     };
    //                 }
    //             }
    //             default:
    //             case 'local': {
    //                 try {
    //                     let d = super.local.get(`${i.name}`)
    //                     return {
    //                         value: storageName + i.name,
    //                         data: d.data.value
    //                     };
    //                 } catch (e) {
    //                     return {
    //                         value: storageName + i.name,
    //                     };
    //                 }
    //             }
    //         }
    //     })
    //     return accountData;
    // }
}
