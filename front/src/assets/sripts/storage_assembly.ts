import {storage} from "./index";
import {v6 as uuidv6} from 'uuid';

export enum StorageAssemblyType {
    Data = 'data',
    Draft = 'draft',
}

export class StorageAssembly {
    private NAME = 'assembly.'

    /**
     * 查询
     * @param id
     * @param type
     */
    get(id: string, type?: StorageAssemblyType) {
        try {
            const d = storage.local.get(this.NAME + type)

            return {
                code: 0,
                data: d.data.value[id]
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
     */
    updata(data: any, type?: StorageAssemblyType, _uid?: string): { code: number, uid?: string } {
        try {
            let uid: any = _uid || uuidv6(),
                c_d = {};

            const d = storage.local.get(this.NAME + type)

            c_d = {
                ...d.data?.value || {},
                [uid]: data
            }

            storage.local.set(this.NAME + type, c_d)

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
     * @param id
     * @param type
     */
    delete(id: string, type?: StorageAssemblyType) {
        try {
            const d = storage.local.get(this.NAME + type)
            if (d.code != 0)
                return false

            delete d.data.value.value[id]

            storage.local.set(this.NAME + type, d)

            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }
}
