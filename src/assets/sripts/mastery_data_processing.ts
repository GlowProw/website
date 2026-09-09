import {toRaw} from "vue";

/**
 * 精通方案存储数据
 * 与分享码 payload {v,s,n,sp} 语义一致，但使用可读字段名持久化
 */
export interface MasterySaveData {
    __version?: string;
    // 赛季 id
    season?: string;
    // 已激活常规节点 key 列表
    nodes?: string[];
    // 已选择赛季特长节点 key 列表
    perks?: string[];

    // 兼容分享码形态
    s?: string;
    n?: string[];
    sp?: string[];
}

interface VersionedDataProcessing<T> {
    get: (data: T) => any;
    set: (data: T) => T;
    verify: (data: T) => { valid: boolean; errors?: string[] };
}

type MasteryDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};

/**
 * 归一化存储数据，同时兼容分享码 {v,s,n,sp} 形态
 */
function normalize(data: any): MasterySaveData {
    return {
        season: data.season || data.s,
        nodes: Array.isArray(data.nodes) ? data.nodes : (Array.isArray(data.n) ? data.n : []),
        perks: Array.isArray(data.perks) ? data.perks : (Array.isArray(data.sp) ? data.sp : []),
    };
}

export default class MasteryDataProcessing {
    static versions = ['0.0.1'];
    static nowVersion = MasteryDataProcessing.versions[MasteryDataProcessing.versions.length - 1];

    private processing: MasteryDataProcessingMap = {
        '0.0.1': {
            get: (data) => {
                const normalized = normalize(data);
                normalized.__version = MasteryDataProcessing.nowVersion;
                return normalized;
            },
            set: (data) => {
                return normalize(data);
            },
            verify: () => {
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
        return this.processing[MasteryDataProcessing.nowVersion] || this.processing['0.0.1'];
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

        const version = data?.__version || MasteryDataProcessing.nowVersion;
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

        const version = useVersion || data?.__version || MasteryDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (processor && processor.set) {
            return processor.set(data);
        }
        return data;
    }

    /**
     * 验证数据（精通为配装可选附加项，不阻断发布）
     * @param dataRaw
     * @param useVersion
     */
    public verify(dataRaw?: any, useVersion?: string): { required: number; verify: any[] } {
        if (!dataRaw) return {required: 0, verify: []};
        let data = toRaw(dataRaw);
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                return {required: 0, verify: []};
            }
        }
        if (!data || typeof data !== 'object') {
            return {required: 0, verify: []};
        }

        const version = useVersion || data?.__version || MasteryDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (processor && typeof processor.verify === 'function') {
            const result = processor.verify(data);
            return {
                required: result.valid ? 0 : 1,
                verify: result.valid ? [] : (result.errors || [])
            };
        }
        return {required: 0, verify: []};
    }
}
