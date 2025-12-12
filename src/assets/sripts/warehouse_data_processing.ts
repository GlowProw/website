import {Items} from "glow-prow-data"
import {toRaw} from "vue";

const items = Items

interface VersionedDataProcessing<T> {
    get: (data: T) => any;
    set: (data: T, value: any) => T;
}

type WarehouseDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};

export default class WarehouseDataProcessing {
    static versions = ['0.0.1'];
    static nowVersion = WarehouseDataProcessing.versions[WarehouseDataProcessing.versions.length - 1];

    private processing: WarehouseDataProcessingMap = {
        '0.0.1': {
            get: (data) => {
                data.map((i: any) => {
                    return {
                        ...i,
                        id: i && i.id || null
                    }
                })

                data.__version = this.nowVersion;
                return data;
            },
            set: (data) => {
                data.map((i: any) => {
                    return {
                        ...i,
                        id: items[i && i.id] || null
                    }
                })

                return data;
            },
            verify: (data) => {
                return {
                    required: 0,
                    verify: [],
                };
            }
        },
    };

    /**
     * 导出数据
     * @param dataRaw
     */
    public export(dataRaw: any) {
        const data = toRaw(dataRaw)

        let version = data?.__version || WarehouseDataProcessing.nowVersion;
        if (version && data && Object.keys(data).length > 0) {
            return this.processing[version].get(data)
        }
        return data;
    }

    /**
     * 导入数据
     * @param dataRaw
     * @param useVersion
     */
    public import(dataRaw: any, useVersion?: string) {
        const data = toRaw(dataRaw)

        let version = useVersion || data?.__version || WarehouseDataProcessing.nowVersion;
        if (version && data && Object.keys(data).length > 0) {
            return this.processing[version].set(data)
        }
        return data
    }

    /**
     * 验证数据
     * @param dataRaw
     * @param useVersion
     */
    public verify(dataRaw: any, useVersion?: string): boolean {
        const data = toRaw(dataRaw)

        let version = useVersion || data?.__version || WarehouseDataProcessing.nowVersion;

        return this.processing[version].verify(data)
    }
}
