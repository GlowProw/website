import {Items} from "glow-prow-data"
import {toRaw} from "vue";

const items = Items

interface VersionedDataProcessing<T> {
    get: (data: T) => any;
    set: (data: T) => T;
    verify: (data: T) => { valid: boolean; errors?: string[] };
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

                data.__version = WarehouseDataProcessing.nowVersion;
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
                    valid: true,
                    errors: [],
                };
            }
        },
    };

    private getProcessor(version?: string) {
        if (version && this.processing[version]) {
            return this.processing[version];
        }
        if (version && typeof version === 'string') {
            const clean = version.trim().replace(/^v/, '').split('+')[0];
            if (this.processing[clean]) {
                return this.processing[clean];
            }
        }
        return this.processing[WarehouseDataProcessing.nowVersion] || this.processing['0.0.1'];
    }

    /**
     * 导出数据
     * @param dataRaw
     */
    public export(dataRaw: any) {
        if (!dataRaw) return dataRaw;
        let data = toRaw(dataRaw);
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                return data;
            }
        }
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            return data;
        }

        const version = data?.__version || WarehouseDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (processor && processor.get) {
            return processor.get(data);
        }
        return data;
    }

    /**
     * 导入数据
     * @param dataRaw
     * @param useVersion
     */
    public import(dataRaw: any, useVersion?: string) {
        if (!dataRaw) return dataRaw;
        let data = toRaw(dataRaw);
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                return data;
            }
        }
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            return data;
        }

        const version = useVersion || data?.__version || WarehouseDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (processor && processor.set) {
            return processor.set(data);
        }
        return data;
    }

    /**
     * 验证数据
     * @param dataRaw
     * @param useVersion
     */
    public verify(dataRaw: any, useVersion?: string): boolean {
        if (!dataRaw) return true;
        let data = toRaw(dataRaw);
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                return true;
            }
        }
        if (!data || typeof data !== 'object') {
            return true;
        }

        const version = useVersion || data?.__version || WarehouseDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (processor && typeof processor.verify === 'function') {
            return processor.verify(data).valid;
        }
        return true;
    }
}
