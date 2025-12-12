/**
 * 账户数据
 */
import Storage from './storage';

type AccountStorageType = 'app' | 'ad' | 'search' | 'poster' | 'appFun'

export default class AccountStorage extends Storage {
    ACCOUNTDATA = [
        {
            type: 'local',
            name: 'captcha'
        },
        {
            type: 'local',
            name: 'language'
        },
        {
            type: 'local',
            name: 'search.history'
        },
        {
            type: 'local',
            name: 'user.configuration'
        },
        {
            type: 'session',
            name: 'captcha'
        }
    ];

    NAME = 'user.configuration';

    constructor() {
        super()
    }

    /**
     * 清除与账户相关数据
     */
    clearAll() {
        try {
            this.ACCOUNTDATA.forEach(i => {
                switch (i.type) {
                    case 'session':
                        super.session.rem(i.name)
                        break;
                    case 'local':
                        super.local.rem(i.name)
                        break;
                }
            })
        } catch (e) {
            console.log(e, {reportError: e})
        }
    }

    /**
     * 取出所有key
     */
    keys() {
        let accountKeys: any = this.ACCOUNTDATA,
            storageName = this.STORAGENAME;

        accountKeys = accountKeys.map((i: any) => `${storageName}${i.name}`)
        return accountKeys;
    }

    /**
     * 取出所有值
     */
    values() {
        let accountData: any = this.ACCOUNTDATA,
            storageName = this.STORAGENAME;

        accountData = accountData.map((i: any) => {
            switch (i.type) {
                case 'session': {
                    try {
                        let d = super.session.get(`${i.name}`)
                        return {
                            value: storageName + i.name,
                            data: d.data.value
                        };
                    } catch (e) {
                        return {
                            value: storageName + i.name,
                        };
                    }
                }
                default:
                case 'local': {
                    try {
                        let d = super.local.get(`${i.name}`)
                        return {
                            value: storageName + i.name,
                            data: d.data.value
                        };
                    } catch (e) {
                        return {
                            value: storageName + i.name,
                        };
                    }
                }
            }
        })
        return accountData;
    }

    /**
     * 用户一类 本地配置
     * - 是否本地语言同步
     * - 判决提示
     * @param key
     * @param value
     * @param data
     * @constructor
     */
    updateConfiguration(key: AccountStorageType, value: string, data: any) {
        let name = `${this.NAME}.${key}`,
            d: any = super.local.get(name)

        if (d.code < 0) {
            d = {data: {value: {}}}
        }

        d.data.value[value] = data;

        super.local.set(name, d.data.value)
    }

    /**
     * 取得User Config Local Storage值
     * @param key
     * @param value
     * @param options
     * @returns {*|boolean}
     */
    getConfigurationItem(key: AccountStorageType, value: string, options?: { defaultValue?: any }): any | boolean {
        let name = `${this.NAME}.${key}`,
            d = super.local.get(name)

        if (d.code < 0) return options?.defaultValue || false;

        return value in d.data.value ? d.data.value[value] : options?.defaultValue || false;
    }

    getConfigurationAll(key: AccountStorageType): [] {
        let name = `${this.NAME}.${key}`,
            d = super.local.get(name)

        if (d.code < 0) return [];

        return d.data.value || [];
    }
}
