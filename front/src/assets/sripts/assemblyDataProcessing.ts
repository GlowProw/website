import {toRaw} from "vue";

import {Items, Ships} from "glow-prow-data"
import {Item} from "glow-prow-data/src/entity/Items.ts";

const ships = Ships,
    items = Items

export default class AssemblyDataProcessing {
    nowVersion = '0.0.1'

    private processing = {
        '0.0.1': {
            get: (data) => {
                if (data.shipSlot)
                    data.shipSlot = {id: data.shipSlot.id}

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = {id: data.shipUpgradeSlot.id}

                if (data.ultimateSlot)
                    data.ultimateSlot = {id: data.ultimateSlot.id}

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

                data.__version = this.nowVersion;
                console.log(data)
                return data
            },
            set: (data) => {
                if (data.shipSlot)
                    data.shipSlot = ships[data.shipSlot.id]

                if (data.shipUpgradeSlot)
                    data.shipUpgradeSlot = items[data.shipUpgradeSlot.id]

                if (data.ultimateSlot)
                    data.ultimateSlot = items[data.ultimateSlot.id]

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
        let version = data.__version || this.nowVersion
        if (version)
            return this.processing[version].get(toRaw(data))

        return data;
    }

    /**
     * 导入数据动作
     */
    import(data) {
        let version = data.__version || this.nowVersion
        if (version)
            return this.processing[version].set(toRaw(data))

        return data;
    }
}
