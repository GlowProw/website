import {storage} from "./index";
import {v6 as uuidv6} from 'uuid';

interface StorageIntermediateTransferOptions {
    // 转存id
    uid?: string
    // 转存类型，如数据/存稿
    saveType?: StorageIntermediateTransferSaveType
    // 转存大类
    category: 'assembly' | 'ranking'
}

export enum StorageIntermediateTransferSaveType {
    Data = 'data',    // 数据
    Draft = 'draft',  // 存稿
}

/**
 * 数据转存
 * 用于页面长久或会话存储，除状态机外跨页共享
 */
export class StorageIntermediateTransfer {
    private NAME = ''

    /**
     * 查询
     * @param uid
     * @param type
     * @param options
     */
    get(uid: string, options?: StorageIntermediateTransferOptions = {
        saveType: StorageIntermediateTransferSaveType.Data,
        category: 'assembly'
    }) {
        try {
            const d = storage.local.get(`${this.NAME}${options.category}.${options.saveType}`)

            return {
                code: 0,
                data: d.data.value[uid]
            }
        } catch (e) {
            console.error(e)
            return {
                code: -1
            }
        }
    }

    /**
     * 检出所有key
     * @param options
     */
    gets(options: StorageIntermediateTransferOptions = {
        saveType: StorageIntermediateTransferSaveType.Data,
        category: 'assembly'
    }) {
        try {
            const d = storage.local.get(`${this.NAME}${options.category}.${options.saveType}`)

            return {
                code: 0,
                data: Object.entries(d.data.value).map(i => {
                    return {
                        id: i[0],
                        ...i[1] as {}
                    }
                })
            }
        } catch (e) {
            console.error(e)
            return {
                code: -1
            }
        }
    }

    /**
     * 更新值
     * @param data
     * @param type
     * @param _uid
     * @param options
     */
    update(data: any, options?: StorageIntermediateTransferOptions = {
        uid: '',
        saveType: StorageIntermediateTransferSaveType.Data,
        category: 'assembly'
    }): { code: number, uid?: string } {
        try {
            let uid: any = options.uid || uuidv6(),
                c_d: any = {};

            const d = storage.local.get(`${this.NAME}${options.category}.${options.saveType}`)

            c_d = {
                ...d.data?.value || {},
                [uid]: data
            }

            storage.local.set(`${this.NAME}${options.category}.${options.saveType}`, c_d)

            return {
                code: 0,
                uid,
            }
        } catch (e) {
            console.error(e)
            return {code: -1}
        }
    }

    /**
     * 删除
     * @param uid
     * @param options
     */
    delete(uid: string, options?: StorageIntermediateTransferOptions = {
        uid: '',
        saveType: StorageIntermediateTransferSaveType.Data,
        category: 'assembly'
    }) {
        try {
            const d = storage.local.get(`${this.NAME}${options.category}.${options.saveType}`)
            if (d.code != 0)
                return false

            delete d.data.value[uid]

            storage.local.set(`${this.NAME}${options.category}.${options.saveType}`, d.data.value)

            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }
}
