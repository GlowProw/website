import {Ship} from "glow-prow-data";
import {Item} from "glow-prow-data/src/entity/Items.ts";

/**
 * 运算结果
 */
class ItemCalcResult {

}

class ItemData {
    // 船
    ship: Ship
    // 武器
    weapons: []
    // 陈设
    furnitures: []
}

export class ItemCalc {
    data: ItemData

    constructor() {
        this.data = new ItemData()

        return {
            addShip,
            addShipUpgrade
        }
    }

    /**
     * 添加船只
     * @param data
     */
    addShip(data: Ship) {
        this.data.ship = data

        return {
            addShipUpgrade,
            addFurniture
        }
    }

    /**
     * 添加升级部件
     * @param data
     */
    addShipUpgrade(data: Item) {
        return {
            addFurniture,
            addWeapon,
        }
    }

    /**
     * 添加陈设
     * @param data
     */
    addFurniture(data: Item) {
        this.data.weapons.push(data)

        return {
            addWeapon
        }
    }

    /**
     * 添加武器
     * @param data
     */
    addWeapon(data: Item) {
        this.data.weapons.push(data)
        return {
            run
        }
    }

    /**
     * 添加船甲
     * @param data
     */
    addArmor(data: Item) {
        return {
            run
        }
    }

    /**
     * 运算结果
     */
    run(): ItemCalcResult {
    }
}
