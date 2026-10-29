import {Cosmetics, Items, Materials, Modifications, Ships} from "glow-prow-data"
import {toRaw} from "vue";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import type {AssemblyData} from "@/assets/types/Assembly";

const ships = Ships,
    items = Items,
    materials = Materials,
    modifications = Modifications,
    ultimates = Ultimates,
    cosmetics = Cosmetics

import type {RankingDesignedItemsDataProcessingMap, RankingValidationRule, RankingVerificationResult} from "@/assets/types/Ranking";

export default class RankingDesignedItemsDataProcessing {
    static versions = ['0.0.1'];
    static nowVersion = RankingDesignedItemsDataProcessing.versions[RankingDesignedItemsDataProcessing.versions.length - 1];

    private processing: RankingDesignedItemsDataProcessingMap<any> = {
        '0.0.1': {
            get: (data) => {
                if (data && typeof data === 'object') {
                    data.__version = RankingDesignedItemsDataProcessing.nowVersion;
                }
                return data;
            },
            set: (data) => {
                return data;
            },
            verify: (data) => {
                const tiers = Array.isArray(data) ? data : (data?.data || []);
                const rules: RankingValidationRule[] = [
                    {
                        condition: () => !tiers || !Array.isArray(tiers) || tiers.length <= 0,
                        required: true,
                        message: "rankingDesignedItems.verify.tierEmpty"
                    },
                    {
                        condition: () => Array.isArray(tiers) && tiers.length > 20,
                        required: true,
                        message: "rankingDesignedItems.verify.tierMaxExceeded"
                    },
                    {
                        condition: () => {
                            if (!Array.isArray(tiers)) return true;
                            let count = 0;
                            for (const t of tiers) {
                                count += (t?.content || []).length;
                            }
                            return count <= 0;
                        },
                        required: true,
                        message: "rankingDesignedItems.verify.itemsAllEmpty"
                    },
                    {
                        condition: () => {
                            if (!Array.isArray(tiers)) return false;
                            return tiers.some((t: any) => (t?.content || []).length > 100);
                        },
                        required: true,
                        message: "rankingDesignedItems.verify.tierItemMaxExceeded"
                    },
                    {
                        condition: () => {
                            if (!Array.isArray(tiers)) return false;
                            // emoji 按一个字符计算，所以用 Array.from 而不是 length
                            return tiers.some((t: any) => Array.from(String(t?.label ?? '')).length > 10);
                        },
                        required: true,
                        message: "rankingDesignedItems.verify.tierLabelTooLong"
                    },
                    {
                        condition: () => {
                            if (!Array.isArray(tiers)) return false;
                            return tiers.some((t: any) => !t?.label || !String(t.label).trim());
                        },
                        required: false,
                        message: "rankingDesignedItems.verify.tierLabelEmpty"
                    }
                ];

                const resultVerify = rules
                    .filter(rule => rule.condition())
                    .map(({ required, message }) => ({ required, message }));

                const requiredCount = resultVerify.filter(i => i.required).length;

                return {
                    required: requiredCount,
                    optional: resultVerify.length - requiredCount,
                    verify: resultVerify,
                    valid: requiredCount === 0
                };
            }
        },
    };

    /**
     * 导出数据
     * @param dataRaw
     */
    public export(dataRaw: any) {
        const data = toRaw(dataRaw);
        return data;
    }

    /**
     * 导入数据
     * @param dataRaw
     * @param useVersion
     */
    public import(dataRaw: any, useVersion?: string) {
        const data = toRaw(dataRaw);
        return data;
    }

    /**
     * 验证天梯数据列表
     * @param dataRaw 待验证的阶梯数组
     * @param useVersion 版本号
     */
    public verify(dataRaw: any, useVersion?: string): RankingVerificationResult {
        const data = toRaw(dataRaw);
        let version = useVersion || data?.__version || RankingDesignedItemsDataProcessing.nowVersion;
        return this.processing[version]?.verify(data) || {
            valid: true,
            required: 0,
            optional: 0,
            verify: []
        };
    }
}
