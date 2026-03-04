/**
 * 站内用户数据
 * 用于存储站内玩家数据
 * 防止多次从服务器获取
 */
import Storage from './storage';

type UserInfoSessionType = 'user'

export default class UserInfoSession extends Storage {
    NAME = 'users';

    /**
     * 设置站内用户数据
     * @param key
     * @param value
     * @param data
     * @constructor
     */
    updateConfiguration(key: UserInfoSessionType, value: string, data: any) {
        let name = `${this.NAME}.${key}`,
            d: any = super.session.get(name)

        if (d.code < 0) {
            d = {data: {value: {}}}
        }

        d.data.value[value] = data;

        super.session.set(name, d.data.value)
    }

    /**
     * 取得站内用户数据
     * @param key
     * @param value
     * @param options
     * @returns {*|boolean}
     */
    getUserInfoItem(key: UserInfoSessionType, value: string, options?: { defaultValue?: any }): any | boolean {
        let name = `${this.NAME}.${key}`,
            d = super.session.get(name)

        if (d.code < 0) return options?.defaultValue || false;

        return value in d.data.value ? d.data.value[value] : options?.defaultValue || false;
    }
}
