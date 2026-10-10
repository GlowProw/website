import {Cosmetics, Items, Materials, Modifications, Ships} from "glow-prow-data"
import {toRaw} from "vue";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import type {AssemblyData} from "@/assets/types/Assembly";
import type {RankingDesignedItemsDataProcessingMap} from "@/assets/types/Ranking";

const ships = Ships,
    items = Items,
    materials = Materials,
    modifications = Modifications,
    ultimates = Ultimates,
    cosmetics = Cosmetics

export default class RankingDesignedItemsDataProcessing {
    static versions = ['0.0.1'];
    static nowVersion = RankingDesignedItemsDataProcessing.versions[RankingDesignedItemsDataProcessing.versions.length - 1];

    private processing: RankingDesignedItemsDataProcessingMap<AssemblyData> = {
        '0.0.1': {
            get: (data) => {
                // 后续处理逻辑
                data.__version = RankingDesignedItemsDataProcessing.nowVersion;
                return data;
            },
            set: (data) => {
                // 后续处理逻辑
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

    /**
     * 导出数据
     * @param dataRaw
     */
    public export(dataRaw) {
        const data = toRaw(dataRaw)
        let version = data?.__version || RankingDesignedItemsDataProcessing.nowVersion;
        return data;
    }

    /**
     * 导入数据
     * @param dataRaw
     * @param useVersion
     */
    public import(dataRaw, useVersion?: string) {
        const data = toRaw(dataRaw)
        let version = useVersion || data?.__version || RankingDesignedItemsDataProcessing.nowVersion;
        return data
    }

    /**
     * 验证数据
     * @param dataRaw
     * @param useVersion
     */
    public verify(dataRaw, useVersion?: string): boolean {
        const data = toRaw(dataRaw)

        let version = useVersion || data?.__version || RankingDesignedItemsDataProcessing.nowVersion;

        return this.processing[version].verify(data).valid
    }
}
