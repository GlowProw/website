import {storage} from "./index";
import {v6 as uuidV6} from 'uuid';

export enum StorageCollectType {
    Item = 'item',
    Ship = 'ship',
}

export class StorageCollect {
    private NAME = 'collect.'
    private MAX_COUNT = 300

    /**
     * 查询
     * @param id
     * @param type
     */
    get(id: string, type?: StorageCollectType) {
        try {
            const d = storage.local.get(this.NAME + type)

            return {
                code: 0,
                data: d.data.value[id],
                count: Object.keys(d.data.value).length,
                maxCount: this.MAX_COUNT
            }
        } catch (e) {
            console.error(e)
            return {
                code: -1,
                count: 0,
                maxCount: this.MAX_COUNT
            }
        }
    }

    gets(type: StorageCollectType) {
        try {
            const d = storage.local.get(this.NAME + type)

            if (d.data || d.code != 0)
                return {
                    code: -1,
                }

            const items = Object.entries(d.data.value)
                .slice(0, this.MAX_COUNT)
                .map(i => ({
                    id: i[0],
                    ...i[1] as {}
                }));

            return {
                code: 0,
                data: items,
                count: items.length,
                maxCount: this.MAX_COUNT
            }
        } catch (e) {
            console.error(e)
            return {
                code: -1,
                count: 0,
                maxCount: this.MAX_COUNT
            }
        }
    }

    /**
     * 更新值
     * @param data
     * @param type
     * @param _uid
     */
    updata(data: any, type?: StorageCollectType, _uid?: string): { code: number, uid?: string, count?: number, maxCount?: number } {
        try {
            const d = storage.local.get(this.NAME + type)
            const currentItems = d.data?.value || {}
            const currentCount = Object.keys(currentItems).length

            // If adding new item (no _uid provided) and at max capacity
            if (!_uid && currentCount >= this.MAX_COUNT) {
                return {
                    code: -2, // Special code for max capacity reached
                    count: currentCount,
                    maxCount: this.MAX_COUNT
                }
            }

            let uid: any = _uid || uuidV6()
            const updatedItems = {
                ...currentItems,
                [uid]: data
            }

            const allKeys = Object.keys(updatedItems)
            let finalItems = updatedItems
            if (allKeys.length > this.MAX_COUNT) {
                finalItems = {}
                allKeys.slice(-this.MAX_COUNT).forEach(key => {
                    finalItems[key] = updatedItems[key]
                })
            }

            storage.local.set(this.NAME + type, finalItems)

            return {
                code: 0,
                uid,
                count: Object.keys(finalItems).length,
                maxCount: this.MAX_COUNT
            }
        } catch (e) {
            console.error(e)
            return {
                code: -1,
                count: 0,
                maxCount: this.MAX_COUNT
            }
        }
    }

    /**
     * 删除
     * @param id
     * @param type
     */
    delete(id: string, type?: StorageCollectType) {
        try {
            const d = storage.local.get(this.NAME + type)
            if (d.code != 0)
                return false

            delete d.data.value[id]

            storage.local.set(this.NAME + type, d.data.value)

            return {
                success: true,
                count: Object.keys(d.data.value).length,
                maxCount: this.MAX_COUNT
            }
        } catch (e) {
            console.error(e)
            return {
                success: false,
                count: 0,
                maxCount: this.MAX_COUNT
            }
        }
    }
}
