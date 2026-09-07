import { toRaw } from "vue";

import { Modifications, Ships, Ultimates } from "glow-prow-data";
import { Item, Items } from "glow-prow-data/src/entity/Items";
import { Ship } from "glow-prow-data/src/entity/Ships";

const ships = Ships,
    items = Items,
    modifications = Modifications,
    ultimates = Ultimates

interface VersionedDataProcessing<T> {
    allowedFields: string[];
    get: (data: any) => any;
    set: (data: any) => T;
    verify: (data: any) => { required?: number, verify?: { required: boolean, message: string }[] };
}

export interface AssemblyData {
    shipSlot: any;
    ultimateSlot: any;
    shipUpgradeSlot: any;
    armorSlot: any;
    weaponDirections: any[];
    weaponModifications: any[];
    weaponSlots: any[];
    armorModification: any[];
    secondaryWeaponSlots: any[];
    shipFrigateUpgradeSlot?: any;
    secondaryWeaponModifications: any[];
    displaySlots: any[];
    __version: string;
}

interface ValidationRule {
    condition: () => boolean;
    required: boolean;
    message: string;
}

type AssemblyDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};

export default class AssemblyDataProcessing {
    static versions: string[] = ['0.0.1', '0.0.2', '0.0.3'];
    static nowVersion: string = AssemblyDataProcessing.versions[AssemblyDataProcessing.versions.length - 1];

    private processing: AssemblyDataProcessingMap<AssemblyData> = {
        '0.0.1': {
            allowedFields: [
                'shipSlot',
                'ultimateSlot',
                'shipUpgradeSlot',
                'weaponDirections',
                'weaponModifications',
                'weaponSlots',
                'armorSlot',
                'secondaryWeaponSlots',
                'shipFrigateUpgradeSlot',
                'secondaryWeaponModifications',
                'displaySlots',
                '__version'
            ],
            get: (data: AssemblyData) => {
                // 后续处理逻辑
                if (data.shipSlot)
                    data.shipSlot = { id: data.shipSlot.id };

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = { id: data.shipUpgradeSlot.id };

                if (data.ultimateSlot)
                    data.ultimateSlot = { id: data.ultimateSlot.id };

                if (data.shipFrigateUpgradeSlot)
                    data.shipFrigateUpgradeSlot = { id: data.shipFrigateUpgradeSlot.id };

                if (data.weaponModifications)
                    data.weaponModifications = data.weaponModifications.map((i: any) => {
                        return i.map((j: any) => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        })
                    })

                if (data.secondaryWeaponModifications)
                    data.secondaryWeaponModifications = data.secondaryWeaponModifications.map((i: any) => {
                        return i.map((j: any) => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        })
                    })

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map((i: any) => {
                        return i.id ? { id: i.id } : { id: null };
                    })

                if (data.weaponSlots)
                    data.weaponSlots = data.weaponSlots.map((i: any) => {
                        return i.id ? { id: i.id } : { id: null };
                    })

                if (data.armorSlot)
                    data.armorSlot = { id: data.armorSlot.id }

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map((i: any) => {
                        return i.id ? { id: i.id } : { id: null };
                    })

                data.__version = AssemblyDataProcessing.nowVersion;
                return data;
            },
            set: (data: AssemblyData) => {
                // 后续处理逻辑
                if (data.shipSlot)
                    data.shipSlot = ships[data.shipSlot.id] || Ship.fromRawData({})

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = (items[data.shipUpgradeSlot.id] || Item.fromRawData({})) as any

                if (data.ultimateSlot)
                    data.ultimateSlot = (ultimates[data.ultimateSlot.id] || Item.fromRawData({})) as any

                if (data.weaponModifications)
                    data.weaponModifications = data.weaponModifications.map((i: any) => {
                        return i.map((j: any) => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        })
                    })

                if (data.secondaryWeaponModifications)
                    data.secondaryWeaponModifications = data.secondaryWeaponModifications.map((i: any) => {
                        return i.map((j: any) => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        })
                    })

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map((i: any) => {
                        return i.id ? items[i.id] : Item.fromRawData({})
                    })

                if (data.weaponSlots)
                    data.weaponSlots = data.weaponSlots.map((i: any) => {
                        return i.id ? items[i.id] : Item.fromRawData({})
                    })

                if (data.armorSlot)
                    data.armorSlot = items[data.armorSlot.id] || Item.fromRawData({})

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map((i: any) => {
                        return i.id ? items[i.id] : Item.fromRawData({})
                    })

                return data;
            },
            verify: (data: AssemblyData) => {
                const rules: ValidationRule[] = [
                    { condition: () => data.shipSlot == null, required: true, message: 'shipEmpty' },
                    { condition: () => data.shipUpgradeSlot == null, required: false, message: 'shipUpgradeEmpty' },
                    { condition: () => data.ultimateSlot == null, required: false, message: 'ultimateEmpty' },
                    { condition: () => (data.weaponModifications || []).length <= 0, required: false, message: 'weaponModificationsEmpty' },
                    { condition: () => (data.secondaryWeaponModifications || []).length <= 0, required: false, message: 'secondaryWeaponModificationsEmpty' },
                    {
                        condition: () => {
                            let length = (data.secondaryWeaponSlots || []).length
                            return length <= 0 || (data.secondaryWeaponSlots as any[]).filter(i => !i.id).length != length
                        }, required: false, message: 'secondaryWeaponEmpty'
                    },
                    {
                        condition: () => {
                            let length = (data.weaponSlots || []).length
                            return length <= 0 || (data.weaponSlots as any[]).filter(i => !i.id).length == length
                        }, required: false, message: 'weaponAllEmpty'
                    },
                    {
                        condition: () => {
                            let weaponDirections = data.weaponDirections || [],
                                weaponSlots = data.weaponSlots || [],
                                result = true
                            for (let i = 0; i < weaponSlots.length; i++) {
                                if (weaponDirections[i]) {
                                    result = false
                                }
                            }
                            return result
                        }, required: true, message: 'weaponDirectionsEmpty'
                    },

                    { condition: () => data.armorSlot == null, required: false, message: 'armorEmpty' },
                    {
                        condition: () => {
                            let length = (data.displaySlots || []).length
                            return length <= 0 || (data.displaySlots as any[]).filter(i => !i.id).length == length
                        }, required: false, message: 'displayAllEmpty'
                    }
                ];

                const resultVerify = rules
                    .filter(rule => rule.condition())
                    .map(({ required, message }) => ({ required, message }))

                const requiredCount = resultVerify
                    .filter(item => item.required)
                    .length;

                return {
                    required: requiredCount,
                    verify: resultVerify,
                };
            }
        },
        '0.0.2': {
            allowedFields: [
                'shipSlot',
                'ultimateSlot',
                'shipUpgradeSlot',
                'weaponDirections',
                'weaponModifications',
                'weaponSlots',
                'armorSlot',
                'armorModification',
                'secondaryWeaponSlots',
                'shipFrigateUpgradeSlot',
                'secondaryWeaponModifications',
                'displaySlots',
                '__version'
            ],
            get: (data: AssemblyData) => {
                // 后续处理逻辑
                if (data.shipSlot)
                    data.shipSlot = { id: data.shipSlot.id };

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = { id: data.shipUpgradeSlot.id };

                if (data.ultimateSlot)
                    data.ultimateSlot = { id: data.ultimateSlot.id };

                if (data.shipFrigateUpgradeSlot)
                    data.shipFrigateUpgradeSlot = { id: data.shipFrigateUpgradeSlot.id };

                if (data.weaponModifications)
                    data.weaponModifications = data.weaponModifications.map((i: any) => {
                        return i.map((j: any) => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        })
                    })

                // 装甲修改模块处理

                if (data.armorModification)
                    // @ts-ignore
                    data.armorModification = data.armorModification.map((i: any) => {
                        return i.map((j: any) => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        })
                    })

                if (data.secondaryWeaponModifications)
                    data.secondaryWeaponModifications = data.secondaryWeaponModifications.map((i: any) => {
                        return i.map((j: any) => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        })
                    })

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map((i: any) => {
                        return i?.id ? { id: i.id } : { id: null };
                    })

                if (data.weaponSlots && data.weaponSlots.length > 0)
                    data.weaponSlots = data.weaponSlots.map((i: any) => {
                        return i?.id ? { id: i.id } : { id: null };
                    })

                if (data.armorSlot)
                    data.armorSlot = { id: data.armorSlot.id }

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map(i => {
                        return i?.id ? { id: i.id } : { id: null };
                    })

                data.__version = AssemblyDataProcessing.nowVersion;
                return data;
            },
            set: (data) => {
                // 后续处理逻辑
                if (data.shipSlot)
                    data.shipSlot = ships[data.shipSlot.id];

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = items[data.shipUpgradeSlot.id];

                if (data.ultimateSlot)
                    data.ultimateSlot = ultimates[data.ultimateSlot.id];

                if (data.shipFrigateUpgradeSlot)
                    data.shipFrigateUpgradeSlot = items[data.shipFrigateUpgradeSlot.id];

                if (data.weaponModifications)
                    data.weaponModifications = data.weaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null
                            };
                        })
                    })

                if (data.armorModification)
                    data.armorModification = data.armorModification.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        })
                    })

                if (data.secondaryWeaponModifications)
                    data.secondaryWeaponModifications = data.secondaryWeaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        })
                    })

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map((i: any) => {
                        return i?.id ? items[i.id] : null;
                    })

                if (data.weaponSlots)
                    data.weaponSlots = data.weaponSlots.map((i: any) => {
                        return i?.id ? items[i.id] : null;
                    })

                if (data.armorSlot)
                    data.armorSlot = data.armorSlot?.id ? items[data.armorSlot.id] : null;

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map((i: any) => {
                        return i?.id ? items[i.id] : null;
                    })

                return data;
            },
            verify: (data) => {
                const rules: ValidationRule[] = [
                    { condition: () => data.shipSlot == null, required: true, message: 'shipEmpty' },
                    { condition: () => data.shipUpgradeSlot == null, required: false, message: 'shipUpgradeEmpty' },
                    { condition: () => data.ultimateSlot == null, required: false, message: 'ultimateEmpty' },
                    { condition: () => data.weaponModifications?.length <= 0, required: false, message: 'weaponModificationsEmpty' },
                    { condition: () => data.secondaryWeaponModifications?.length <= 0, required: false, message: 'secondaryWeaponModificationsEmpty' },
                    {
                        condition: () => {
                            let length = data.secondaryWeaponSlots?.length || 0
                            if (length <= 0) return false;
                            return (data.secondaryWeaponSlots as any[]).filter((i: { id: any; }) => !i.id).length != length
                        }, required: false, message: 'secondaryWeaponEmpty'
                    },
                    {
                        condition: () => {
                            let length = data.weaponSlots?.length
                            return length <= 0 || (data.weaponSlots as any[]).filter((i: { id: any; }) => !i?.id).length == length
                        }, required: false, message: 'weaponAllEmpty'
                    },
                    {
                        condition: () => {
                            let weaponDirections = data.weaponDirections,
                                weaponSlots = data.weaponSlots,
                                result = true
                            for (let i = 0; i < weaponSlots.length; i++) {
                                if (weaponDirections[i]) {
                                    result = false
                                }
                            }
                            return result
                        }, required: true, message: 'weaponDirectionsEmpty'
                    },

                    { condition: () => data.armorSlot == null, required: false, message: 'armorEmpty' },
                    { condition: () => data.armorModification?.length <= 0, required: false, message: 'armorModificationEmpty' },
                    {
                        condition: () => {
                            let length = data.displaySlots?.length
                            return length <= 0 || (data.displaySlots as any[]).filter(i => !i.id).length == length
                        }, required: false, message: 'displayAllEmpty'
                    }
                ];

                const resultVerify = rules
                    .filter(rule => rule.condition())
                    .map(({ required, message }) => ({ required, message }))

                const requiredCount = resultVerify
                    .filter(item => item.required)
                    .length;

                return {
                    required: requiredCount,
                    verify: resultVerify,
                };
            }
        },
        '0.0.3': {
            allowedFields: [
                'shipSlot',
                'ultimateSlot',
                'shipUpgradeSlot',
                'weaponDirections',
                'weaponModifications',
                'weaponSlots',
                'armorSlot',
                'armorModification',
                'secondaryWeaponSlots',
                'shipFrigateUpgradeSlot',
                'secondaryWeaponModifications',
                'displaySlots',
                '__version'
            ],
            get: (data: AssemblyData) => {
                return this.processing['0.0.2'] ? this.processing['0.0.2'].get(data) : data;
            },
            set: (data) => {
                return this.processing['0.0.2'] ? this.processing['0.0.2'].set(data) : data;
            },
            verify: (data) => {
                const rules: ValidationRule[] = [
                    { condition: () => data.shipSlot == null, required: true, message: 'shipEmpty' },
                    { condition: () => data.shipUpgradeSlot == null, required: false, message: 'shipUpgradeEmpty' },
                    { condition: () => data.ultimateSlot == null, required: false, message: 'ultimateEmpty' },
                    { condition: () => data.weaponModifications?.length <= 0, required: false, message: 'weaponModificationsEmpty' },
                    { condition: () => data.secondaryWeaponModifications?.length <= 0, required: false, message: 'secondaryWeaponModificationsEmpty' },
                    {
                        condition: () => {
                            let length = data.secondaryWeaponSlots?.length || 0
                            if (length <= 0) return false;
                            return (data.secondaryWeaponSlots as any[]).filter((i: { id: any; }) => !i.id).length != length
                        }, required: false, message: 'secondaryWeaponEmpty'
                    },
                    {
                        condition: () => {
                            let length = data.weaponSlots?.length
                            return length <= 0 || (data.weaponSlots as any[]).filter((i: { id: any; }) => !i?.id).length == length
                        }, required: false, message: 'weaponAllEmpty'
                    },
                    {
                        condition: () => {
                            let weaponDirections = data.weaponDirections,
                                weaponSlots = data.weaponSlots,
                                result = true
                            for (let i = 0; i < weaponSlots.length; i++) {
                                if (weaponDirections[i]) {
                                    result = false
                                }
                            }
                            return result
                        }, required: true, message: 'weaponDirectionsEmpty'
                    },

                    { condition: () => data.armorSlot == null, required: false, message: 'armorEmpty' },
                    { condition: () => data.armorModification?.length <= 0, required: false, message: 'armorModificationEmpty' },
                    {
                        condition: () => {
                            let length = data.displaySlots?.length
                            return length <= 0 || (data.displaySlots as any[]).filter(i => !i.id).length == length
                        }, required: false, message: 'displayAllEmpty'
                    }
                ];

                const resultVerify = rules
                    .filter(rule => rule.condition())
                    .map(({ required, message }) => ({ required, message }))

                const requiredCount = resultVerify
                    .filter(item => item.required)
                    .length;

                return {
                    required: requiredCount,
                    verify: resultVerify,
                };
            }
        },
    };

    private getProcessor(version?: string): VersionedDataProcessing<AssemblyData> | undefined {
        if (version && this.processing[version]) {
            return this.processing[version];
        }
        if (version && typeof version === 'string') {
            const cleanVersion = version.trim().replace(/^v/, '').split('+')[0];
            if (this.processing[cleanVersion]) {
                return this.processing[cleanVersion];
            }
        }
        return this.processing[AssemblyDataProcessing.nowVersion] || this.processing['0.0.3'] || this.processing['0.0.1'];
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

        const version = data?.__version || AssemblyDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (!processor || !processor.allowedFields) {
            return data;
        }

        const filteredData: any = {};
        processor.allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                filteredData[field] = data[field];
            }
        });
        return processor.get ? processor.get(filteredData) : filteredData;
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

        const version = useVersion || data?.__version || AssemblyDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (!processor || !processor.allowedFields) {
            return data;
        }

        const filteredData: any = {};
        processor.allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                filteredData[field] = data[field];
            }
        });
        return processor.set ? processor.set(filteredData) : filteredData;
    }

    /**
     * 验证数据
     * @param dataRaw
     * @param useVersion
     */
    public verify(dataRaw: any, useVersion?: string) {
        if (!dataRaw) return { required: 0, verify: [] };
        let data = toRaw(dataRaw);
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                return { required: 0, verify: [] };
            }
        }
        if (!data || typeof data !== 'object') {
            return { required: 0, verify: [] };
        }

        const version = useVersion || data?.__version || AssemblyDataProcessing.nowVersion;
        const processor = this.getProcessor(version);
        if (!processor || typeof processor.verify !== 'function') {
            return { required: 0, verify: [] };
        }

        return processor.verify(data);
    }
}
