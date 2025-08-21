import {Items, Modifications, Ships} from "glow-prow-data"
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";

const ships = Ships,
    items = Items,
    modifications = Modifications,
    ultimates = Ultimates

interface VersionedDataProcessing<T> {
    allowedFields: string[];
    get: (data: T) => any;
    set: (data: T, value: any) => T;
    verify: (data: T) => { valid: boolean; errors?: string[] };
}

type AssemblyDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};

export default class Assembly_data_processing {
    static versions = ['0.0.1'];
    static nowVersion = Assembly_data_processing.versions[Assembly_data_processing.versions.length - 1];

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
            get: (data) => {
                // 后续处理逻辑
                if (data.shipSlot)
                    data.shipSlot = {id: data.shipSlot.id};

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = {id: data.shipUpgradeSlot.id};

                if (data.ultimateSlot)
                    data.ultimateSlot = {id: data.ultimateSlot.id};

                if (data.shipFrigateUpgradeSlot)
                    data.shipFrigateUpgradeSlot = {id: data.shipFrigateUpgradeSlot.id};

                if (data.weaponModifications)
                    data.weaponModifications = data.weaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        });
                    });

                if (data.secondaryWeaponModifications)
                    data.secondaryWeaponModifications = data.secondaryWeaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        });
                    });

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map(i => {
                        return i.id ? {id: i.id} : {id: null};
                    });

                if (data.weaponSlots)
                    data.weaponSlots = data.weaponSlots.map(i => {
                        return i.id ? {id: i.id} : {id: null};
                    });

                if (data.armorSlot)
                    data.armorSlot = {id: data.armorSlot.id}

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map(i => {
                        return i.id ? {id: i.id} : {id: null};
                    });

                data.__version = this.nowVersion;
                return data;
            },
            set: (data) => {
                // 后续处理逻辑
                if (data.shipSlot)
                    data.shipSlot = ships[data.shipSlot.id] || Ship.fromRawData({});

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = items[data.shipUpgradeSlot.id] || Item.fromRawData({});

                if (data.ultimateSlot)
                    data.ultimateSlot = ultimates[data.ultimateSlot.id] || Item.fromRawData({});

                if (data.weaponModifications)
                    data.weaponModifications = data.weaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        });
                    });

                if (data.secondaryWeaponModifications)
                    data.secondaryWeaponModifications = data.secondaryWeaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        });
                    });

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({});
                    });

                if (data.weaponSlots)
                    data.weaponSlots = data.weaponSlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({});
                    });

                if (data.armorSlot)
                    data.armorSlot = items[data.armorSlot.id] || Item.fromRawData({})

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({});
                    });

                return data;
            },
            verify: (data) => {
                const rules: ValidationRule[] = [
                    {condition: () => data.shipSlot == null, required: true, message: 'shipEmpty'},
                    {condition: () => data.shipUpgradeSlot == null, required: false, message: 'shipUpgradeEmpty'},
                    {condition: () => data.ultimateSlot == null, required: false, message: 'ultimateEmpty'},
                    {condition: () => data.weaponModifications?.length <= 0, required: false, message: 'weaponModificationsEmpty'},
                    {condition: () => data.secondaryWeaponModifications?.length <= 0, required: false, message: 'secondaryWeaponModificationsEmpty'},
                    {
                        condition: () => {
                            let length = data.secondaryWeaponSlots?.length <= 0
                            return (data.secondaryWeaponSlots as Array).filter(i => !i.id).length != length
                        }, required: false, message: 'secondaryWeaponEmpty'
                    },
                    {
                        condition: () => {
                            let length = data.weaponSlots?.length
                            return length <= 0 || (data.weaponSlots as Array).filter(i => !i.id).length == length
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

                    {condition: () => data.armorSlot == null, required: false, message: 'armorEmpty'},
                    {
                        condition: () => {
                            let length = data.displaySlots?.length
                            return length <= 0 || (data.displaySlots as Array).filter(i => !i.id).length == length
                        }, required: false, message: 'displayAllEmpty'
                    }
                ];

                const resultVerify = rules
                    .filter(rule => rule.condition())
                    .map(({required, message}) => ({required, message}));

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

    /**
     * 导出数据
     * @param data
     */
    public export(data) {
        let version = data?.__version || Assembly_data_processing.nowVersion;
        if (version && data) {
            const filteredData = {};
            this.processing[version].allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    filteredData[field] = data[field];
                }
            });
            return this.processing[version].get(filteredData);
        }
        return data;
    }

    /**
     * 导入数据
     * @param data
     * @param useVersion
     */
    public import(data, useVersion?: string) {
        let version = useVersion || data?.__version || Assembly_data_processing.nowVersion;
        if (version && data) {
            const filteredData = {};
            this.processing[version].allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    filteredData[field] = data[field];
                }
            });
            return this.processing[version].set(filteredData);
        }
        return data
    }

    /**
     * 验证数据
     * @param data
     * @param useVersion
     */
    public verify(data, useVersion?: string): boolean {
        let version = useVersion || data?.__version || Assembly_data_processing.nowVersion;

        return this.processing[version].verify(data);
    }
}
