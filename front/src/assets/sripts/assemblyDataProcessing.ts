import {toRaw} from "vue";

import {Items, Modification, Modifications, Ships} from "glow-prow-data"
import {Item} from "glow-prow-data/src/entity/Items.ts";

const ships = Ships,
    items = Items,
    modifications = Modifications

export default class AssemblyDataProcessing {
    static versions = ['0.0.1']
    static nowVersion = '0.0.1'

    private processing = {
        '0.0.1': {
            get: (data) => {
                if (data.shipSlot)
                    data.shipSlot = {id: data.shipSlot.id}

                if (data.armorSlot)
                    data.armorSlot = {id: data.armorSlot.id}

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = {id: data.shipUpgradeSlot.id}

                if (data.ultimateSlot)
                    data.ultimateSlot = {id: data.ultimateSlot.id}

                if (data.shipFrigateUpgradeSlot)
                    data.shipFrigateUpgradeSlot = {id: data.shipFrigateUpgradeSlot.id}

                if (data.weaponModification)
                    data.weaponModification = data.weaponModification.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: j?.value?.id || null
                            }
                        })
                    })

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map(i => {
                        return i.id ? {id: i.id} : {id: null}
                    })

                if (data.weaponSlots)
                    data.weaponSlots = data.weaponSlots.map(i => {
                        return i.id ? {id: i.id} : {id: null}
                    })

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map(i => {
                        return i.id ? {id: i.id} : {id: null}
                    })

                delete data.shipFrigateUpgradeList;
                data.__version = this.nowVersion;
                return data
            },
            set: (data) => {
                if (data.shipSlot)
                    data.shipSlot = ships[data.shipSlot.id] || Ship.fromRawData({})

                if (data.armorSlot)
                    data.armorSlot = items[data.armorSlot.id] || Item.fromRawData({})

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = items[data.shipUpgradeSlot.id] || Item.fromRawData({})

                if (data.ultimateSlot)
                    data.ultimateSlot = items[data.ultimateSlot.id] || Item.fromRawData({})

                if (data.shipFrigateUpgradeSlot)
                    data.shipFrigateUpgradeSlot = items[data.shipFrigateUpgradeSlot.id] || Item.fromRawData({})

                if (data.weaponModification)
                    data.weaponModification = data.weaponModification.map(i => {
                        return i.map(j => {
                            return {
                                type: j.type,
                                value: j.value ? modifications[j.value] : Modification.fromRawData({variants: []})
                            }
                        })
                    })

                if (data.secondaryWeaponSlots)
                    data.secondaryWeaponSlots = data.secondaryWeaponSlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({})
                    })

                if (data.weaponSlots)
                    data.weaponSlots = data.weaponSlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({})
                    })

                if (data.displaySlots)
                    data.displaySlots = data.displaySlots.map(i => {
                        return i.id ? items[i.id] : Item.fromRawData({})
                    })

                return data
            }
        }
    }

    /**
     * 导出数据动作
     * @param data
     */
    export(data) {
        let version = data?.__version || this.nowVersion
        if (version)
            return this.processing[version].get(toRaw(data))

        return data;
    }

    /**
     * 导入数据动作
     */
    import(data, useVersion?: string) {
        let version = useVersion || data.__version || this.nowVersion
        if (version)
            return this.processing[version].set(toRaw(data))

        return data;
    }
}
