import {Ship} from "glow-prow-data";
import {Item} from "glow-prow-data/src/entity/Items";

/**
 * 运算结果
 */
class ItemCalcResult {

}

class ItemData {
    // 船
    ship: Ship
    // 武器
    weapons: any[] = []
    // 陈设
    furnitures: any[] = []
}

export class CoreCalc {
    data: ItemData

    constructor() {
        this.data = new ItemData()

        return {
            addShip: this.addShip.bind(this),
            addShipUpgrade: this.addShipUpgrade.bind(this)
        } as any
    }

    /**
     * 添加船只
     * @param data
     */
    addShip(data: Ship) {
        this.data.ship = data

        return {
            addShipUpgrade: this.addShipUpgrade.bind(this),
            addFurniture: this.addFurniture.bind(this)
        }
    }

    /**
     * 添加升级部件
     * @param data
     */
    addShipUpgrade(data: Item) {
        return {
            addFurniture: this.addFurniture.bind(this),
            addWeapon: this.addWeapon.bind(this),
        }
    }

    /**
     * 添加陈设
     * @param data
     */
    addFurniture(data: Item) {
        if (data.type == 'majorFurniture' || data.type == 'utilityFurniture' || data.type == 'offensiveFurniture') {
            return
        }

        this.data.weapons.push(data)

        return {
            addWeapon: this.addWeapon.bind(this)
        }
    }

    /**
     * 添加武器
     * @param data
     */
    addWeapon(data: Item) {
        this.data.weapons.push(data)
        return {
            addEnemy: this.addEnemy,
            addCustomEnemy: this.addCustomEnemy,
            run: this.run.bind(this)
        }
    }

    /**
     * 添加船甲
     * @param data
     */
    addArmor(data: Item) {
        return {
            run: this.run.bind(this)
        }
    }

    /**
     * 自定义敌人
     * @param opt
     */
    addCustomEnemy (opt = {}) {
        return {
            run: this.run.bind(this)
        }
    }

    /**
     * 敌人
     */
    get addEnemy () {
        return {
            // 建筑
            tower () {

            },
            // todo 精英敌人/普通敌人
        }
    }

    /**
     * 运算结果
     */
    run(): ItemCalcResult {
        return new ItemCalcResult()
    }
}
