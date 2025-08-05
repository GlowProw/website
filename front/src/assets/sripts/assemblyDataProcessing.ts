import {toRaw} from "vue";

import {Items, Modification, Modifications, Ships} from "glow-prow-data"
import {Item} from "glow-prow-data/src/entity/Items.ts";

const ships = Ships,
    items = Items,
    modifications = Modifications

export default class AssemblyDataProcessing {
    static versions = ['0.0.1'];
    static nowVersion = '0.0.1';

    private allowedFields = [
        'shipSlot',
        'armorSlot',
        'shipUpgradeSlot',
        'ultimateSlot',
        'shipFrigateUpgradeSlot',
        'weaponModifications',
        'secondaryWeaponModifications',
        'secondaryWeaponSlots',
        'weaponSlots',
        'displaySlots',
        '__version',
    ];

    private processing = {
        '0.0.1': {
            get: (data) => {
                const filteredData = {};
                this.allowedFields.forEach(field => {
                    if (data[field] !== undefined) {
                        filteredData[field] = data[field];
                    }
                });

                // 后续处理逻辑
                if (filteredData.shipSlot)
                    filteredData.shipSlot = { id: filteredData.shipSlot.id };

                if (filteredData.armorSlot)
                    filteredData.armorSlot = { id: filteredData.armorSlot.id };

                if (filteredData.shipUpgradeSlot)
                    filteredData.shipUpgradeSlot = { id: filteredData.shipUpgradeSlot.id };

                if (filteredData.ultimateSlot)
                    filteredData.ultimateSlot = { id: filteredData.ultimateSlot.id };

                if (filteredData.shipFrigateUpgradeSlot)
                    filteredData.shipFrigateUpgradeSlot = { id: filteredData.shipFrigateUpgradeSlot.id };

                if (filteredData.weaponModifications)
                    filteredData.weaponModifications = filteredData.weaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        });
                    });

                if (filteredData.secondaryWeaponModifications)
                    filteredData.secondaryWeaponModifications = filteredData.secondaryWeaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null,
                            };
                        });
                    });

                if (filteredData.secondaryWeaponSlots)
                    filteredData.secondaryWeaponSlots = filteredData.secondaryWeaponSlots.map(i => {
                        return i.id ? { id: i.id } : { id: null };
                    });

                if (filteredData.weaponSlots)
                    filteredData.weaponSlots = filteredData.weaponSlots.map(i => {
                        return i.id ? { id: i.id } : { id: null };
                    });

                if (filteredData.displaySlots)
                    filteredData.displaySlots = filteredData.displaySlots.map(i => {
                        return i.id ? { id: i.id } : { id: null };
                    });

                filteredData.__version = this.nowVersion;
                return filteredData;
            },
            set: (data) => {
                const filteredData = {};
                this.allowedFields.forEach(field => {
                    if (data[field] !== undefined) {
                        filteredData[field] = data[field];
                    }
                });

                // 后续处理逻辑
                if (filteredData.shipSlot)
                    filteredData.shipSlot = ships[filteredData.shipSlot.id] || Ship.fromRawData({});

                if (filteredData.armorSlot)
                    filteredData.armorSlot = items[filteredData.armorSlot.id] || Item.fromRawData({});

                if (filteredData.shipUpgradeSlot)
                    filteredData.shipUpgradeSlot = items[filteredData.shipUpgradeSlot.id] || Item.fromRawData({});

                if (filteredData.ultimateSlot)
                    filteredData.ultimateSlot = items[filteredData.ultimateSlot.id] || Item.fromRawData({});

                if (filteredData.shipFrigateUpgradeSlot)
                    filteredData.shipFrigateUpgradeSlot = items[filteredData.shipFrigateUpgradeSlot.id] || Item.fromRawData({});

                if (filteredData.weaponModifications)
                    filteredData.weaponModifications = filteredData.weaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        });
                    });

                if (filteredData.secondaryWeaponModifications)
                    filteredData.secondaryWeaponModifications = filteredData.secondaryWeaponModifications.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: modifications[j.value] || null,
                            };
                        });
                    });

                if (filteredData.secondaryWeaponSlots)
                    filteredData.secondaryWeaponSlots = filteredData.secondaryWeaponSlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({});
                    });

                if (filteredData.weaponSlots)
                    filteredData.weaponSlots = filteredData.weaponSlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({});
                    });

                if (filteredData.displaySlots)
                    filteredData.displaySlots = filteredData.displaySlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({});
                    });

                return filteredData;
            },
        },
    };

    /**
     * 导出数据
     * @param data
     */
    export(data) {
        let version = data?.__version || this.nowVersion;
        if (version) return this.processing[version].get(toRaw(data));
        return data;
    }

    /**
     * 导入数据
     * @param data
     * @param useVersion
     */
    import(data, useVersion?: string) {
        let version = useVersion || data.__version || this.nowVersion;
        if (version) return this.processing[version].set(toRaw(data));
        return data;
    }
}
