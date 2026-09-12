import { Ship, Items } from "glow-prow-data";
import { Item } from "glow-prow-data/src/entity/Items";
import { Modification } from "glow-prow-data/src/entity/Modifications";
import { Modifications } from "glow-prow-data";

// 类型定义

/**
 * 武器方向
 */
export type WeaponDirection = 'front' | 'left' | 'right' | 'aft' | 'port' | 'starboard' | 'frontWeapon' | 'leftSideWeapon' | 'rightSideWeapon' | 'aftWeapon';

/**
 * 武器条目（含方向、模组）
 */
export interface WeaponEntry {
    weapon: Item;
    direction: WeaponDirection;
    modifications: Modification[];
}

/**
 * 副武器条目
 */
export interface AuxiliaryWeaponEntry {
    weapon: Item;
    modifications: Modification[];
}

/**
 * 模组计算结果
 */
export interface ModCalcStats {
    modId: string;
    effectType: string | undefined;
    damageType: string | undefined;
    minValue: number;
    maxValue: number;
    midValue: number;
}

/**
 * 单把武器计算结果
 */
export interface WeaponCalcStats {
    weaponId: string;
    weaponType: string;

    // 基础属性
    baseDamagePerShot: number;
    projectilesPerShot: number;
    baseReloadSpeed: number;         // ms
    rateOfFire: number;
    optimalRange: number;
    projectileSpeed: number;
    chargeTime: number;

    // 经家具/模组修正后
    finalDamagePerShot: number;
    finalReloadSpeed: number;        // ms
    totalDamagePerShot: number;      // finalDamagePerShot × projectilesPerShot

    // 单炮口 DPS (RateOfFire=0，用于 "1-port" 比较)
    singlePortBaseDPS: number;
    singlePortDpsWithPerks: number;
    dps: number;                     // 兼容字段 = singlePortDpsWithPerks

    // 多炮口汇总 (根据方向 gunPorts 计算)
    gunPorts: number;
    baseDPS: number;                 // Base Damage per Second (方向总计)
    dpsWithPerks: number;            // DPS with Perks (方向总计)
    totalDPS: number;                // 兼容字段 = dpsWithPerks
    totalDamagePerVolley: number;    // totalDamagePerShot × gunPorts

    // 伤害类型分布 (方向总计)
    shareExplosive: number;
    shareFlooding: number;
    shareFire: number;
    shareTearing: number;
    sharePiercing: number;
    shareElectric: number;
    shareToxic: number;

    // 特殊增伤 (方向总计)
    againstWeakpoints: number;       // 弱点暴击 (Crit)
    againstSails: number;            // 船帆
    againstStructures: number;       // 攻城结构 (Siege)

    // 模组与标记
    modifications: ModCalcStats[];
    bonusFlags: string[];
}

/**
 * 武器方向汇总
 */
export interface WeaponDirectionStats {
    direction: WeaponDirection;
    slotType?: string;
    weapons: WeaponCalcStats[];
    gunPorts: number;
    baseDPS: number;
    dpsWithPerks: number;
    totalDPS: number;
    totalDamagePerVolley: number;
    shareExplosive: number;
    shareFlooding: number;
    shareFire: number;
    shareTearing: number;
    sharePiercing: number;
    shareElectric: number;
    shareToxic: number;
    againstWeakpoints: number;
    againstSails: number;
    againstStructures: number;
}

/**
 * 伤害减免
 */
export interface DamageMitigationResult {
    explosive: number;
    flooding: number;
    burning: number;
    tearing: number;
    piercing: number;
    electric: number;
    toxic: number;
    ramming: number;
    weakpoint?: number;
    mines?: number;
    [key: string]: number | undefined;
}

// 运算结果

/**
 * 运算结果
 */
export class ItemCalcResult {
    // 船只基础
    shipId: string = '';
    shipSize: string = 'large';
    hitPoints: number = 0;
    braceStrength: number = 0;
    braceStrengthRecovery: number = 0;
    stamina: number = 0;
    baseRank: number = 0;

    // 航速
    sailSpeed: { halfSail: number; fullSail: number; travelSail: number } = {
        halfSail: 0, fullSail: 0, travelSail: 0
    };

    // 货物
    cargo: { cargoSlots: number; cargoMaxWeight: number; cargoUsedWeight?: number; cargoFreeWeight?: number } = {
        cargoSlots: 0, cargoMaxWeight: 0
    };

    // 装甲
    armorId: string = '';
    armor: number = 0;
    damageMitigation: DamageMitigationResult = {
        explosive: 0, flooding: 0, burning: 0, tearing: 0, piercing: 0, electric: 0, toxic: 0, ramming: 0
    };

    // 升级部件伤害减免（来自 shipUpgrade 链）
    shipDamageMitigation: DamageMitigationResult = {
        explosive: 0, flooding: 0, burning: 0, tearing: 0, piercing: 0, electric: 0, toxic: 0, ramming: 0
    };

    // 综合总减免
    totalMitigation: DamageMitigationResult = {
        explosive: 0, flooding: 0, burning: 0, tearing: 0, piercing: 0, electric: 0, toxic: 0, ramming: 0
    };

    // 总览
    totalGearScore: number = 0;
    totalWeight: number = 0;

    // 武器统计
    weaponStats: WeaponDirectionStats[] = [];
    auxiliaryWeaponStats: WeaponCalcStats[] = [];

    // 汇总 DPS
    baseDPS: number = 0;             // Base Damage per Second
    dpsWithPerks: number = 0;        // DPS with Perks
    totalDPS: number = 0;            // 兼容别名
    totalDamagePerVolley: number = 0;

    // 伤害占比 (DPS 贡献)
    shareExplosive: number = 0;
    shareFlooding: number = 0;
    shareFire: number = 0;
    shareTearing: number = 0;
    sharePiercing: number = 0;
    shareElectric: number = 0;
    shareToxic: number = 0;

    // 特殊增伤 (DPS 贡献)
    againstWeakpoints: number = 0;   // 弱点 (Crit)
    againstSails: number = 0;        // 船帆/桅杆
    againstStructures: number = 0;   // 攻城结构 (Siege)

    // Perks 列表
    allPerks: any[] = [];

    /**
     * 输出格式化结果表
     */
    toTable(): Record<string, any> {
        return {
            ship: {
                id: this.shipId,
                size: this.shipSize,
                baseRank: this.baseRank,
                hitPoints: this.hitPoints,
                braceStrength: this.braceStrength,
                braceStrengthRecovery: this.braceStrengthRecovery,
                stamina: this.stamina,
                sailSpeed: { ...this.sailSpeed },
                cargo: { ...this.cargo },
            },
            armor: {
                armor: this.armor,
                damageMitigation: { ...this.damageMitigation },
                shipDamageMitigation: { ...this.shipDamageMitigation },
                totalMitigation: { ...this.totalMitigation },
            },
            weapons: this.weaponStats.map(dir => ({
                direction: dir.direction,
                gunPorts: dir.gunPorts,
                baseDPS: _round(dir.baseDPS),
                dpsWithPerks: _round(dir.dpsWithPerks),
                totalDamagePerVolley: _round(dir.totalDamagePerVolley),
                shareExplosive: _round(dir.shareExplosive),
                shareFire: _round(dir.shareFire),
                shareFlooding: _round(dir.shareFlooding),
                sharePiercing: _round(dir.sharePiercing),
                againstWeakpoints: _round(dir.againstWeakpoints),
                againstSails: _round(dir.againstSails),
                againstStructures: _round(dir.againstStructures),
                weapons: dir.weapons.map(w => ({
                    weaponId: w.weaponId,
                    weaponType: w.weaponType,
                    baseDamagePerShot: w.baseDamagePerShot,
                    finalDamagePerShot: _round(w.finalDamagePerShot),
                    projectilesPerShot: w.projectilesPerShot,
                    totalDamagePerShot: _round(w.totalDamagePerShot),
                    reloadSpeed: _round(w.finalReloadSpeed),
                    rateOfFire: w.rateOfFire,
                    singlePortBaseDPS: _round(w.singlePortBaseDPS),
                    singlePortDpsWithPerks: _round(w.singlePortDpsWithPerks),
                    gunPorts: w.gunPorts,
                    baseDPS: _round(w.baseDPS),
                    dpsWithPerks: _round(w.dpsWithPerks),
                    optimalRange: w.optimalRange,
                    modifications: w.modifications.map(m => ({
                        modId: m.modId,
                        effectType: m.effectType,
                        damageType: m.damageType,
                        range: `${(m.minValue * 100).toFixed(1)}% - ${(m.maxValue * 100).toFixed(1)}%`,
                    })),
                    bonusFlags: w.bonusFlags,
                })),
            })),
            auxiliaryWeapons: this.auxiliaryWeaponStats.map(w => ({
                weaponId: w.weaponId,
                weaponType: w.weaponType,
                baseDamagePerShot: w.baseDamagePerShot,
                finalDamagePerShot: _round(w.finalDamagePerShot),
                totalDamagePerShot: _round(w.totalDamagePerShot),
                reloadSpeed: _round(w.finalReloadSpeed),
                singlePortBaseDPS: _round(w.singlePortBaseDPS),
                singlePortDpsWithPerks: _round(w.singlePortDpsWithPerks),
                gunPorts: w.gunPorts,
                baseDPS: _round(w.baseDPS),
                dpsWithPerks: _round(w.dpsWithPerks),
                optimalRange: w.optimalRange,
                modifications: w.modifications.map(m => ({
                    modId: m.modId,
                    effectType: m.effectType,
                    damageType: m.damageType,
                    range: `${(m.minValue * 100).toFixed(1)}% - ${(m.maxValue * 100).toFixed(1)}%`,
                })),
            })),
            summary: {
                baseDPS: _round(this.baseDPS),
                dpsWithPerks: _round(this.dpsWithPerks),
                totalDPS: _round(this.dpsWithPerks),
                totalDamagePerVolley: _round(this.totalDamagePerVolley),
                shareExplosive: _round(this.shareExplosive),
                shareFire: _round(this.shareFire),
                shareFlooding: _round(this.shareFlooding),
                sharePiercing: _round(this.sharePiercing),
                againstWeakpoints: _round(this.againstWeakpoints),
                againstSails: _round(this.againstSails),
                againstStructures: _round(this.againstStructures),
                totalGearScore: this.totalGearScore,
                totalWeight: this.totalWeight,
                allPerks: [...this.allPerks],
            },
        };
    }
}

// 内部状态

class ItemData {
    // 船
    ship: Ship | null = null;
    // 升级部件（最高 tier 部件）
    shipUpgradeItem: Item | null = null;
    // 升级部件继承链
    shipUpgrades: Item[] = [];
    // 装甲
    armorItem: Item | null = null;
    // 装甲模组
    armorModifications: Modification[] = [];
    // 主武器（按方向）
    weapons: WeaponEntry[] = [];
    // 副武器
    auxiliaryWeapons: AuxiliaryWeaponEntry[] = [];
    // 陈设 (offensiveFurniture / utilityFurniture / majorFurniture)
    furnitures: Item[] = [];
}

// Builder

export interface ShipAddedBuilder {
    addShipUpgrade: (data: Item) => UpgradeAddedBuilder;
    addFurniture: (data: Item | Item[]) => FurnitureAddedBuilder;
    addArmor: (data: Item, modifications?: Modification[]) => ArmorAddedBuilder;
    addWeapon: (data: Item, direction: WeaponDirection, modifications?: Modification[]) => WeaponAddedBuilder;
    addAuxiliaryWeapon: (data: Item, modifications?: Modification[]) => WeaponAddedBuilder;
    run: () => ItemCalcResult;
}

export interface UpgradeAddedBuilder {
    addShipUpgrade: (data: Item) => UpgradeAddedBuilder;
    addFurniture: (data: Item | Item[]) => FurnitureAddedBuilder;
    addArmor: (data: Item, modifications?: Modification[]) => ArmorAddedBuilder;
    addWeapon: (data: Item, direction: WeaponDirection, modifications?: Modification[]) => WeaponAddedBuilder;
    addAuxiliaryWeapon: (data: Item, modifications?: Modification[]) => WeaponAddedBuilder;
    run: () => ItemCalcResult;
}

export interface FurnitureAddedBuilder {
    addShipUpgrade: (data: Item) => UpgradeAddedBuilder;
    addFurniture: (data: Item | Item[]) => FurnitureAddedBuilder;
    addArmor: (data: Item, modifications?: Modification[]) => ArmorAddedBuilder;
    addWeapon: (data: Item, direction: WeaponDirection, modifications?: Modification[]) => WeaponAddedBuilder;
    addAuxiliaryWeapon: (data: Item, modifications?: Modification[]) => WeaponAddedBuilder;
    run: () => ItemCalcResult;
}

export interface ArmorAddedBuilder {
    addShipUpgrade: (data: Item) => UpgradeAddedBuilder;
    addWeapon: (data: Item, direction: WeaponDirection, modifications?: Modification[]) => WeaponAddedBuilder;
    addAuxiliaryWeapon: (data: Item, modifications?: Modification[]) => WeaponAddedBuilder;
    addFurniture: (data: Item | Item[]) => FurnitureAddedBuilder;
    addArmor: (data: Item, modifications?: Modification[]) => ArmorAddedBuilder;
    run: () => ItemCalcResult;
}

export interface WeaponAddedBuilder {
    addShipUpgrade: (data: Item) => UpgradeAddedBuilder;
    addWeapon: (data: Item, direction: WeaponDirection, modifications?: Modification[]) => WeaponAddedBuilder;
    addAuxiliaryWeapon: (data: Item, modifications?: Modification[]) => WeaponAddedBuilder;
    addArmor: (data: Item, modifications?: Modification[]) => ArmorAddedBuilder;
    addFurniture: (data: Item | Item[]) => FurnitureAddedBuilder;
    addEnemy: EnemyBuilder;
    addCustomEnemy: (opt?: Record<string, any>) => RunBuilder;
    run: () => ItemCalcResult;
}

export interface EnemyBuilder {
    tower: () => RunBuilder;
}

export interface RunBuilder {
    run: () => ItemCalcResult;
}

export interface CoreCalcBuilder {
    addShip: (data: Ship) => ShipAddedBuilder;
}

export class CoreCalc {
    private data: ItemData;

    constructor() {
        this.data = new ItemData();
    }

    /**
     * 创建计算实例
     */
    static create(): CoreCalcBuilder {
        const instance = new CoreCalc();
        return {
            addShip: instance.addShip.bind(instance),
        };
    }

    // 添加船只

    private addShip(data: Ship): ShipAddedBuilder {
        this.data.ship = data;
        return {
            addShipUpgrade: this.addShipUpgrade.bind(this),
            addFurniture: this.addFurniture.bind(this),
            addArmor: this.addArmor.bind(this),
            addWeapon: this.addWeapon.bind(this),
            addAuxiliaryWeapon: this.addAuxiliaryWeapon.bind(this),
            run: this.run.bind(this),
        };
    }

    // 添加升级部件

    /**
     * 添加升级部件
     * 自动继承当前 tier 之前所有升级部件的 perks 和 damageMitigation
     * 例如添加 tier 7，会自动继承 tier 1-6 的全部词条
     */
    private addShipUpgrade(data: Item): UpgradeAddedBuilder {
        this.data.shipUpgradeItem = data;
        this.data.shipUpgrades = _resolveUpgradeChain(data);
        return {
            addShipUpgrade: this.addShipUpgrade.bind(this),
            addFurniture: this.addFurniture.bind(this),
            addArmor: this.addArmor.bind(this),
            addWeapon: this.addWeapon.bind(this),
            addAuxiliaryWeapon: this.addAuxiliaryWeapon.bind(this),
            run: this.run.bind(this),
        };
    }

    // 添加陈设

    /**
     * 添加陈设，支持单个 Item 或 Item[]
     */
    private addFurniture(data: Item | Item[]): FurnitureAddedBuilder {
        if (!data) return this._furnitureAddedBuilder();
        const items = Array.isArray(data) ? data : [data];
        const furnitureTypes = ['majorFurniture', 'offensiveFurniture', 'utilityFurniture'];

        for (const item of items) {
            if (!item) continue;
            if (!furnitureTypes.includes(item.type as string)) {
                console.warn(`[ItemCalc] addFurniture: type "${item.type}" (${item.id}) 不是陈设类型, 已忽略`);
                continue;
            }
            this.data.furnitures.push(item);
        }

        return this._furnitureAddedBuilder();
    }

    private _furnitureAddedBuilder(): FurnitureAddedBuilder {
        return {
            addShipUpgrade: this.addShipUpgrade.bind(this),
            addFurniture: this.addFurniture.bind(this),
            addArmor: this.addArmor.bind(this),
            addWeapon: this.addWeapon.bind(this),
            addAuxiliaryWeapon: this.addAuxiliaryWeapon.bind(this),
            run: this.run.bind(this),
        };
    }

    // 添加装甲

    private addArmor(data: Item, modifications: Modification[] = []): ArmorAddedBuilder {
        if (!data) {
            return {
                addShipUpgrade: this.addShipUpgrade.bind(this),
                addWeapon: this.addWeapon.bind(this),
                addAuxiliaryWeapon: this.addAuxiliaryWeapon.bind(this),
                addFurniture: this.addFurniture.bind(this),
                addArmor: this.addArmor.bind(this),
                run: this.run.bind(this),
            };
        }
        this.data.armorItem = data;
        this.data.armorModifications = modifications || [];
        return {
            addShipUpgrade: this.addShipUpgrade.bind(this),
            addWeapon: this.addWeapon.bind(this),
            addAuxiliaryWeapon: this.addAuxiliaryWeapon.bind(this),
            addFurniture: this.addFurniture.bind(this),
            addArmor: this.addArmor.bind(this),
            run: this.run.bind(this),
        };
    }

    // 添加主武器

    private addWeapon(data: Item, direction: WeaponDirection, modifications: Modification[] = []): WeaponAddedBuilder {
        if (!data) return this._weaponAddedBuilder();
        // 标准化方向名称 (port -> left, starboard -> right, frontWeapon -> front, etc.)
        const normalizedDir = _normalizeDirection(direction);
        this.data.weapons.push({ weapon: data, direction: normalizedDir, modifications: modifications || [] });
        return this._weaponAddedBuilder();
    }

    // 添加副武器

    private addAuxiliaryWeapon(data: Item, modifications: Modification[] = []): WeaponAddedBuilder {
        if (!data) return this._weaponAddedBuilder();
        this.data.auxiliaryWeapons.push({ weapon: data, modifications: modifications || [] });
        return this._weaponAddedBuilder();
    }

    private _weaponAddedBuilder(): WeaponAddedBuilder {
        return {
            addShipUpgrade: this.addShipUpgrade.bind(this),
            addWeapon: this.addWeapon.bind(this),
            addAuxiliaryWeapon: this.addAuxiliaryWeapon.bind(this),
            addArmor: this.addArmor.bind(this),
            addFurniture: this.addFurniture.bind(this),
            addEnemy: this._enemyBuilder(),
            addCustomEnemy: this.addCustomEnemy.bind(this),
            run: this.run.bind(this),
        };
    }

    // 敌人（预留）

    private _enemyBuilder(): EnemyBuilder {
        return {
            tower: () => ({
                run: this.run.bind(this),
            }),
        };
    }

    private addCustomEnemy(_opt: Record<string, any> = {}): RunBuilder {
        return {
            run: this.run.bind(this),
        };
    }

    // 核心运算

    private run(): ItemCalcResult {
        const result = new ItemCalcResult();
        const rawShip = this.data.ship;

        if (!rawShip) {
            console.warn('[ItemCalc] run: 未设置船只');
            return result;
        }

        // 解析目标 Upgrade 阶数，生成升级后的船只对象
        const targetTier = this.data.shipUpgradeItem ? (this.data.shipUpgradeItem.tier ?? _extractTierFromId(this.data.shipUpgradeItem.id)) : 0;
        const upgradedShip = _resolveShipUpgrade(rawShip, targetTier);

        // 收集所有 Perks (升级后的船只自带 perks + 陈设 perks)
        const additionalPerks: string[] = [...(upgradedShip.perks || [])];
        for (const furniture of this.data.furnitures) {
            result.totalGearScore += furniture.gearScore ?? 0;
            result.totalWeight += furniture.weight ?? 0;
            if (furniture.perks) {
                additionalPerks.push(...furniture.perks);
            }
        }

        // 计算船只基础属性（经 Furniture/Ship perks 修正）
        const shipOverall = _applyOverallPerks({
            hitpoints: (upgradedShip as any).hitpoints ?? (upgradedShip as any).hitPoints ?? 0,
            braceStrength: upgradedShip.braceStrength ?? 0,
            maxCargoWeight: upgradedShip.cargo?.cargoMaxWeight ?? 0,
        }, additionalPerks);

        result.shipId = upgradedShip.id;
        result.shipSize = (upgradedShip as any).size ?? 'large';
        result.baseRank = upgradedShip.baseRank ?? 0;
        result.hitPoints = shipOverall.hitpoints;
        result.braceStrength = shipOverall.braceStrength;
        result.braceStrengthRecovery = upgradedShip.braceStrengthRecovery ?? 1;
        result.stamina = upgradedShip.stamina ?? 100;
        result.sailSpeed = { ...(upgradedShip.sailSpeed ?? { halfSail: 0, fullSail: 0, travelSail: 0 }) };
        result.cargo = {
            cargoSlots: upgradedShip.cargo?.cargoSlots ?? 0,
            cargoMaxWeight: shipOverall.maxCargoWeight,
        };

        // 升级部件提供的减免 (Ship damage mitigation)
        const shipMit = (upgradedShip as any).damageMitigation;
        if (shipMit && typeof shipMit === 'object') {
            for (const [k, v] of Object.entries(shipMit)) {
                if (typeof v === 'number') {
                    result.shipDamageMitigation[k] = (result.shipDamageMitigation[k] ?? 0) + v;
                }
            }
        }

        // 装甲及减免计算
        if (this.data.armorItem) {
            const armorItem = this.data.armorItem;
            result.armorId = armorItem.id ?? '';
            result.armor = armorItem.armor ?? 0;
            result.totalGearScore += armorItem.gearScore ?? 0;
            result.totalWeight += armorItem.weight ?? 0;
            if (armorItem.perks) {
                additionalPerks.push(...armorItem.perks);
            }

            // 装甲自带减免
            if (armorItem.damageMitigation) {
                for (const [k, v] of Object.entries(armorItem.damageMitigation)) {
                    if (typeof v === 'number') {
                        result.damageMitigation[k] = v;
                    }
                }
            }

            // 汇总装甲 + 船体减免，并经额外 perks 修正
            const mergedMitigation: Record<string, number> = {
                explosive: 0, flooding: 0, fire: 0, burning: 0, tearing: 0, piercing: 0, ramming: 0, electric: 0, toxic: 0, weakpoint: 0, mines: 0
            };
            for (const [k, v] of Object.entries(result.shipDamageMitigation)) {
                if (typeof v === 'number') mergedMitigation[k] = (mergedMitigation[k] || 0) + v;
            }
            for (const [k, v] of Object.entries(result.damageMitigation)) {
                if (typeof v === 'number') mergedMitigation[k] = (mergedMitigation[k] || 0) + v;
            }

            const armorCalc = _applyArmorPerks({
                armor: armorItem.armor ?? 0,
                damageMitigation: mergedMitigation,
                perks: armorItem.perks,
                additionalPerks
            });

            result.armor = armorCalc.armor;
            for (const [k, v] of Object.entries(armorCalc.damageMitigation)) {
                if (typeof v === 'number') {
                    result.totalMitigation[k] = v;
                }
            }
        }

        // 主武器计算（按方向分组）
        const directionGroups = new Map<WeaponDirection, WeaponEntry[]>();
        for (const entry of this.data.weapons) {
            if (!directionGroups.has(entry.direction)) {
                directionGroups.set(entry.direction, []);
            }
            directionGroups.get(entry.direction)!.push(entry);
        }

        const directionOrder: WeaponDirection[] = ['front', 'left', 'right', 'aft'];
        let grandBaseDPS = 0;
        let grandPerksDPS = 0;
        let grandTotalVolley = 0;
        let grandExplosive = 0;
        let grandFlooding = 0;
        let grandFire = 0;
        let grandTearing = 0;
        let grandPiercing = 0;
        let grandElectric = 0;
        let grandToxic = 0;
        let grandWeakpoints = 0;
        let grandSails = 0;
        let grandStructures = 0;

        for (const dir of directionOrder) {
            const entries = directionGroups.get(dir);
            if (!entries || entries.length === 0) continue;

            const slotType = _mapDirectionToSlotType(dir);
            const weaponCalcs: WeaponCalcStats[] = [];

            let dirBaseDPS = 0;
            let dirPerksDPS = 0;
            let dirVolley = 0;
            let dirGunPorts = 0;
            let dirExplosive = 0;
            let dirFlooding = 0;
            let dirFire = 0;
            let dirTearing = 0;
            let dirPiercing = 0;
            let dirElectric = 0;
            let dirToxic = 0;
            let dirWeakpoints = 0;
            let dirSails = 0;
            let dirStructures = 0;

            for (const entry of entries) {
                const ports = _getGunPortsForSlot(upgradedShip, slotType, entry.weapon);
                dirGunPorts += ports;

                const calc = _calcWeaponStats({
                    weapon: entry.weapon,
                    slotType,
                    gunPorts: ports,
                    additionalPerks,
                    modifications: entry.modifications,
                });

                weaponCalcs.push(calc);
                result.totalGearScore += entry.weapon.gearScore ?? 0;
                result.totalWeight += entry.weapon.weight ?? 0;

                dirBaseDPS += calc.baseDPS;
                dirPerksDPS += calc.dpsWithPerks;
                dirVolley += calc.totalDamagePerVolley;
                dirExplosive += calc.shareExplosive;
                dirFlooding += calc.shareFlooding;
                dirFire += calc.shareFire;
                dirTearing += calc.shareTearing;
                dirPiercing += calc.sharePiercing;
                dirElectric += calc.shareElectric;
                dirToxic += calc.shareToxic;
                dirWeakpoints += calc.againstWeakpoints;
                dirSails += calc.againstSails;
                dirStructures += calc.againstStructures;
            }

            const dirStats: WeaponDirectionStats = {
                direction: dir,
                slotType,
                weapons: weaponCalcs,
                gunPorts: dirGunPorts,
                baseDPS: dirBaseDPS,
                dpsWithPerks: dirPerksDPS,
                totalDPS: dirPerksDPS,
                totalDamagePerVolley: dirVolley,
                shareExplosive: dirExplosive,
                shareFlooding: dirFlooding,
                shareFire: dirFire,
                shareTearing: dirTearing,
                sharePiercing: dirPiercing,
                shareElectric: dirElectric,
                shareToxic: dirToxic,
                againstWeakpoints: dirWeakpoints,
                againstSails: dirSails,
                againstStructures: dirStructures,
            };

            result.weaponStats.push(dirStats);

            grandBaseDPS += dirBaseDPS;
            grandPerksDPS += dirPerksDPS;
            grandTotalVolley += dirVolley;
            grandExplosive += dirExplosive;
            grandFlooding += dirFlooding;
            grandFire += dirFire;
            grandTearing += dirTearing;
            grandPiercing += dirPiercing;
            grandElectric += dirElectric;
            grandToxic += dirToxic;
            grandWeakpoints += dirWeakpoints;
            grandSails += dirSails;
            grandStructures += dirStructures;
        }

        // 副武器计算
        const auxSlotType = 'auxiliaryWeapon';
        for (const entry of this.data.auxiliaryWeapons) {
            const ports = _getGunPortsForSlot(upgradedShip, auxSlotType, entry.weapon);
            const calc = _calcWeaponStats({
                weapon: entry.weapon,
                slotType: auxSlotType,
                gunPorts: ports,
                additionalPerks,
                modifications: entry.modifications,
            });

            result.auxiliaryWeaponStats.push(calc);
            result.totalGearScore += entry.weapon.gearScore ?? 0;
            result.totalWeight += entry.weapon.weight ?? 0;

            grandBaseDPS += calc.baseDPS;
            grandPerksDPS += calc.dpsWithPerks;
            grandTotalVolley += calc.totalDamagePerVolley;
            grandExplosive += calc.shareExplosive;
            grandFlooding += calc.shareFlooding;
            grandFire += calc.shareFire;
            grandTearing += calc.shareTearing;
            grandPiercing += calc.sharePiercing;
            grandElectric += calc.shareElectric;
            grandToxic += calc.shareToxic;
            grandWeakpoints += calc.againstWeakpoints;
            grandSails += calc.againstSails;
            grandStructures += calc.againstStructures;
        }

        // 汇总统计
        result.baseDPS = grandBaseDPS;
        result.dpsWithPerks = grandPerksDPS;
        result.totalDPS = grandPerksDPS;
        result.totalDamagePerVolley = grandTotalVolley;
        result.shareExplosive = grandExplosive;
        result.shareFlooding = grandFlooding;
        result.shareFire = grandFire;
        result.shareTearing = grandTearing;
        result.sharePiercing = grandPiercing;
        result.shareElectric = grandElectric;
        result.shareToxic = grandToxic;
        result.againstWeakpoints = grandWeakpoints;
        result.againstSails = grandSails;
        result.againstStructures = grandStructures;
        result.allPerks = Array.from(new Set(additionalPerks));

        return result;
    }
}

// 内部计算算法

/**
 * 标准化方向名称
 */
function _normalizeDirection(dir: WeaponDirection | string): WeaponDirection {
    if (dir === 'port' || dir === 'leftSideWeapon' || dir === 'left') return 'left';
    if (dir === 'starboard' || dir === 'rightSideWeapon' || dir === 'right') return 'right';
    if (dir === 'frontWeapon' || dir === 'front') return 'front';
    if (dir === 'aftWeapon' || dir === 'rear' || dir === 'aft') return 'aft';
    return dir as WeaponDirection;
}

function _mapDirectionToSlotType(dir: WeaponDirection): string {
    switch (dir) {
        case 'front':
        case 'frontWeapon':
            return 'frontWeapon';
        case 'left':
        case 'port':
        case 'leftSideWeapon':
            return 'leftSideWeapon';
        case 'right':
        case 'starboard':
        case 'rightSideWeapon':
            return 'rightSideWeapon';
        case 'aft':
        case 'aftWeapon':
            return 'aftWeapon';
    }
    return dir;
}

function _extractTierFromId(id: string): number {
    const match = id.match(/Upgrade(\d+)$/i);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * 升级部件继承链解析
 */
function _resolveUpgradeChain(data: Item): Item[] {
    const currentTier = data.tier ?? _extractTierFromId(data.id) ?? 1;
    if (currentTier <= 1) return [data];

    const match = data.id.match(/^(.+?)Upgrade(\d+)$/);
    if (!match) return [data];

    const shipName = match[1];
    const chain: Item[] = [];

    for (let tier = 1; tier <= currentTier; tier++) {
        const upgradeKey = `${shipName}Upgrade${tier}`;
        const upgradeItem = (Items as any)[upgradeKey] as Item | undefined;
        if (upgradeItem) {
            chain.push(upgradeItem);
        }
    }

    if (chain.length === 0) chain.push(data);
    return chain;
}

/**
 * 船只升级函数 (对应 reference_calc 的 b(e))
 */
function _resolveShipUpgrade(preShipData: Ship, goalUpgradeTier: number | string = 0): Ship {
    if (!preShipData) return preShipData;
    const tierNum = typeof goalUpgradeTier === 'string' ? parseInt(goalUpgradeTier.replace(/\D/g, ''), 10) || 0 : goalUpgradeTier;
    if (tierNum <= 0) return preShipData;

    const t: any = JSON.parse(JSON.stringify(preShipData));
    const shipId = preShipData.id;
    let s: string[] = [];

    for (let tier = 1; tier <= tierNum; tier++) {
        const upgKey = `${shipId}Upgrade${tier}`;
        const upgItem = (Items as any)[upgKey] as Item | undefined;
        if (upgItem) {
            if ((upgItem as any).damageMitigation) {
                t.damageMitigation = { ...(upgItem as any).damageMitigation };
            }
            if (upgItem.perks) {
                s = s.concat(upgItem.perks);
            }
        }
    }

    t.perks = t.perks || [];
    for (const e of s) {
        if (["gunportsUpgrade"].includes(e)) {
            t.perks.push(e);
            t.slots.aftWeapon = [1, { top: 2 }];
        }
        if (["stationsUpgrade", "bigGuns"].includes(e)) {
            if ("bigGuns" === e) {
                t.perks = t.perks.filter((p: string) => p !== "stationsUpgrade");
            }
            t.perks.push(e);
            t.slots.auxiliaryWeapon = [1, 1];
        }
        if (["heavyArsenal"].includes(e)) {
            t.perks = t.perks.filter((p: string) => p !== "gunportsUpgrade");
            t.perks.push(e);
            t.slots.auxiliaryWeapon = [1, 1];
            t.slots.aftWeapon = [1, { top: 2 }];
        }
        if (["bedarUpgrade1"].includes(e)) { t.baseRank = 2; t.hitpoints = 38000; t.braceStrength = 7600; }
        if (["bedarUpgrade2"].includes(e)) { t.baseRank = 3; t.sailSpeed = { halfSail: 7, fullSail: 10, travelSail: 15 }; t.slots.furniture = [5, 1]; }
        if (["bedarUpgrade3"].includes(e)) { t.baseRank = 4; t.hitpoints = 45000; t.braceStrength = 9000; }
        if (["bedarUpgrade4"].includes(e)) { t.baseRank = 5; t.cargo.cargoMaxWeight = 116000; }

        if (["bedarUpgrade5", "hulkUpgrade5", "cutterUpgrade5", "bargeUpgrade5", "sloopUpgrade5", "padewakangUpgrade5", "snowUpgrade5", "brigantineUpgrade5", "sambukUpgrade5", "barqueUpgrade5", "brigUpgrade5", "battleJunkUpgrade5", "garudaUpgrade5", "schoonerUpgrade5", "frigateUpgrade5", "sloopOfWarUpgrade5", "corvetteUpgrade5", "galleonUpgrade5", "junkUpgrade5"].includes(e)) {
            t.baseRank = 7;
            t.slots.furniture = [6, 1];
        }
        if (["bedarUpgrade6", "hulkUpgrade6", "cutterUpgrade6", "bargeUpgrade6", "sloopUpgrade6", "padewakangUpgrade6", "brigantineUpgrade6", "sambukUpgrade6", "barqueUpgrade6", "battleJunkUpgrade6", "garudaUpgrade6", "schoonerUpgrade6", "frigateUpgrade6", "sloopOfWarUpgrade6", "corvetteUpgrade6", "galleonUpgrade6", "junkUpgrade6"].includes(e)) {
            t.baseRank = 8;
            t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.125;
        }
        if (["bedarUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 48200; t.braceStrength = 9640; }

        if (["hulkUpgrade1"].includes(e)) { t.baseRank = 4; t.hitpoints = 40000; t.braceStrength = 28000; }
        if (["hulkUpgrade2"].includes(e)) { t.sailSpeed = { halfSail: 7, fullSail: 10, travelSail: 13 }; t.slots.furniture = [5, 1]; }
        if (["hulkUpgrade3"].includes(e)) { t.baseRank = 5; t.hitpoints = 58000; t.braceStrength = 40600; }
        if (["hulkUpgrade4"].includes(e)) { t.baseRank = 6; t.cargo.cargoMaxWeight = 140000; }
        if (["hulkUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 62100; t.braceStrength = 43470; }

        if (["cutterUpgrade1"].includes(e)) { t.baseRank = 3; t.hitpoints = 35000; t.braceStrength = 7000; }
        if (["cutterUpgrade2"].includes(e)) { t.baseRank = 4; t.sailSpeed = { halfSail: 8, fullSail: 11, travelSail: 15 }; t.slots.furniture = [5, 1]; }
        if (["cutterUpgrade3", "bargeUpgrade3"].includes(e)) { t.baseRank = 5; t.hitpoints = 46000; t.braceStrength = 9200; }
        if (["cutterUpgrade4"].includes(e)) { t.baseRank = 6; t.cargo.cargoMaxWeight = 136000; }
        if (["cutterUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 49300; t.braceStrength = 9860; }

        if (["bargeUpgrade1"].includes(e)) { t.baseRank = 4; t.hitpoints = 36000; t.braceStrength = 7200; }
        if (["bargeUpgrade2", "sloopUpgrade2"].includes(e)) { t.sailSpeed = { halfSail: 8, fullSail: 11, travelSail: 14 }; t.slots.furniture = [5, 1]; }
        if (["bargeUpgrade4", "sloopUpgrade4"].includes(e)) { t.baseRank = 6; t.cargo.cargoMaxWeight = 130000; }
        if (["bargeUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 49300; t.braceStrength = 9860; }

        if (["sloopUpgrade1"].includes(e)) { t.hitpoints = 37000; t.braceStrength = 7400; }
        if (["sloopUpgrade3"].includes(e)) { t.baseRank = 5; t.hitpoints = 45000; t.braceStrength = 9000; }
        if (["sloopUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 48200; t.braceStrength = 9640; }

        if (["padewakangUpgrade1"].includes(e)) { t.hitpoints = 43000; t.braceStrength = 8600; }
        if (["padewakangUpgrade2"].includes(e)) { t.baseRank = 5; t.cargo.cargoMaxWeight = 150000; t.slots.furniture = [5, 1]; }
        if (["padewakangUpgrade4"].includes(e)) { t.baseRank = 6; t.hitpoints = 48000; t.braceStrength = 9600; }
        if (["padewakangUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 52800; t.braceStrength = 10560; }

        if (["snowUpgrade1"].includes(e)) { t.hitpoints = 55000; t.braceStrength = 27500; }
        if (["snowUpgrade2"].includes(e)) { t.baseRank = 5; t.cargo.cargoMaxWeight = 170000; t.slots.furniture = [5, 1]; }
        if (["snowUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 8, fullSail: 11, travelSail: 14 }; }
        if (["snowUpgrade4"].includes(e)) { t.baseRank = 6; t.hitpoints = 60000; t.braceStrength = 30000; }
        if (["snowUpgrade6"].includes(e)) { t.baseRank = 8; t.hitpoints = 66000; t.braceStrength = 33000; }
        if (["snowUpgrade7"].includes(e)) { t.baseRank = 9; t.hitpoints = 79200; t.braceStrength = 39600; }

        if (["brigantineUpgrade1"].includes(e)) { t.hitpoints = 43000; t.braceStrength = 8600; }
        if (["brigantineUpgrade2"].includes(e)) { t.baseRank = 5; t.cargo.cargoMaxWeight = 120000; }
        if (["brigantineUpgrade3", "sloopOfWarUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 10, fullSail: 13, travelSail: 20 }; }
        if (["brigantineUpgrade4", "brigUpgrade4"].includes(e)) { t.baseRank = 6; t.hitpoints = 45000; t.braceStrength = 9000; }
        if (["brigantineUpgrade7", "brigUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 49500; t.braceStrength = 9900; }

        if (["sambukUpgrade1", "brigUpgrade1"].includes(e)) { t.hitpoints = 40000; t.braceStrength = 8000; }
        if (["sambukUpgrade2", "brigUpgrade2", "schoonerUpgrade2"].includes(e)) { t.baseRank = 5; t.cargo.cargoMaxWeight = 150000; }
        if (["sambukUpgrade3", "battleJunkUpgrade3", "padewakangUpgrade3", "garudaUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 9, fullSail: 12, travelSail: 16 }; }
        if (["sambukUpgrade4"].includes(e)) { t.baseRank = 6; t.hitpoints = 45000; t.braceStrength = 9000; }

        if (["barqueUpgrade1", "schoonerUpgrade1"].includes(e)) { t.hitpoints = 41000; t.braceStrength = 8200; }
        if (["barqueUpgrade2", "battleJunkUpgrade2"].includes(e)) { t.baseRank = 5; t.cargo.cargoMaxWeight = 160000; }
        if (["barqueUpgrade3", "schoonerUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 9, fullSail: 12, travelSail: 17 }; }
        if (["barqueUpgrade4", "schoonerUpgrade4"].includes(e)) { t.baseRank = 6; t.hitpoints = 46000; t.braceStrength = 9200; }
        if (["barqueUpgrade7", "schoonerUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 50600; t.braceStrength = 10120; }

        if (["brigUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 10, fullSail: 13, travelSail: 18 }; }
        if (["brigUpgrade6"].includes(e)) { t.baseRank = 8; t.hitpoints = 54000; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.125; }

        if (["battleJunkUpgrade1"].includes(e)) { t.hitpoints = 53000; t.braceStrength = 26500; }
        if (["battleJunkUpgrade4"].includes(e)) { t.baseRank = 6; t.hitpoints = 58000; t.braceStrength = 29000; }
        if (["battleJunkUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 63800; t.braceStrength = 31900; }

        if (["garudaUpgrade1", "sloopOfWarUpgrade1"].includes(e)) { t.hitpoints = 38000; t.braceStrength = 7600; }
        if (["garudaUpgrade2", "sloopOfWarUpgrade2"].includes(e)) { t.baseRank = 5; t.cargo.cargoMaxWeight = 130000; }
        if (["garudaUpgrade4", "sloopOfWarUpgrade4"].includes(e)) { t.baseRank = 6; t.hitpoints = 43000; t.braceStrength = 8600; }
        if (["garudaUpgrade7", "sloopOfWarUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 47300; t.braceStrength = 9460; }

        if (["frigateUpgrade1"].includes(e)) { t.hitpoints = 104000; t.braceStrength = 31200; }
        if (["corvetteUpgrade1"].includes(e)) { t.hitpoints = 83200; t.braceStrength = 16640; }
        if (["galleonUpgrade1"].includes(e)) { t.hitpoints = 93600; t.braceStrength = 18720; }
        if (["junkUpgrade1"].includes(e)) { t.hitpoints = 88400; t.braceStrength = 17680; }

        if (["frigateUpgrade2", "galleonUpgrade2", "junkUpgrade2"].includes(e)) { t.cargo.cargoMaxWeight = 190000; }
        if (["corvetteUpgrade2"].includes(e)) { t.cargo.cargoMaxWeight = 150000; }

        if (["frigateUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 11, fullSail: 14, travelSail: 20 }; t.baseRank = 6; }
        if (["corvetteUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 10, fullSail: 14, travelSail: 19 }; t.baseRank = 6; }
        if (["galleonUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 8, fullSail: 13, travelSail: 17 }; t.baseRank = 6; }
        if (["junkUpgrade3"].includes(e)) { t.sailSpeed = { halfSail: 7, fullSail: 12, travelSail: 16 }; t.baseRank = 6; }

        if (["frigateUpgrade4"].includes(e)) { t.hitpoints = 107000; t.braceStrength = 32100; }
        if (["corvetteUpgrade4"].includes(e)) { t.hitpoints = 85600; t.braceStrength = 17120; }
        if (["galleonUpgrade4"].includes(e)) { t.hitpoints = 105930; t.braceStrength = 21186; }
        if (["junkUpgrade4"].includes(e)) { t.hitpoints = 90950; t.braceStrength = 18190; }

        if (["frigateUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 128400; t.braceStrength = 38520; }
        if (["corvetteUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 102720; t.braceStrength = 20544; }
        if (["galleonUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 116523; t.braceStrength = 23304; }
        if (["junkUpgrade7"].includes(e)) { t.baseRank = 9; t.braceStrengthRecovery = (t.braceStrengthRecovery || 1) + 0.25; t.hitpoints = 104593; t.braceStrength = 20919; }

        if (["riverRat", "jousting", "ironwill", "unsparing", "devouring", "ruin", "deepBlue", "padewakangSiegeUpgrade", "vindictive", "headstrong", "firebug", "mend", "evolved", "endure", "revolver", "volatile", "resolve", "spite", "upgradedMark", "redWake", "infernalSeas"].includes(e)) {
            t.perks.push(e);
        }
    }
    return t;
}

/**
 * 船只整体属性 Perks 修正
 */
function _applyOverallPerks(overall: { hitpoints: number; maxCargoWeight: number; braceStrength: number }, additionalPerks: string[]) {
    const a = { ...overall };
    if (additionalPerks.includes("maximumHull05")) a.hitpoints += 0.05 * overall.hitpoints;
    if (additionalPerks.includes("cargoCapacity1")) a.maxCargoWeight += 0.1 * overall.maxCargoWeight;
    if (additionalPerks.includes("lestariTrophy")) a.maxCargoWeight += 0.08 * overall.maxCargoWeight;
    if (additionalPerks.includes("cursedBanner")) a.hitpoints += 0.03 * overall.hitpoints;
    if (additionalPerks.includes("compagnieScreens")) a.hitpoints += 0.05 * overall.hitpoints;
    if (additionalPerks.includes("beamSupports")) a.hitpoints += 0.07 * overall.hitpoints;
    if (additionalPerks.includes("drownedOnesToll")) a.hitpoints += 0.08 * overall.hitpoints;
    if (additionalPerks.includes("mineClearingLocker")) a.braceStrength += 0.05 * overall.braceStrength;
    if (additionalPerks.includes("emergencyLocker")) a.hitpoints += 0.06 * overall.hitpoints;
    return a;
}

/**
 * 装甲与减免 Perks 修正
 */
function _applyArmorPerks(params: {
    armor: number;
    damageMitigation: Record<string, number>;
    perks?: string[];
    additionalPerks: string[];
}) {
    const { armor, damageMitigation, perks = [], additionalPerks } = params;
    let n = armor;
    const i = { ...damageMitigation };

    if (additionalPerks.includes("compagnieSpiritsLocker")) n += 0.07 * armor;
    if (additionalPerks.includes("kinckelsLaboratory1")) n += 0.05 * armor;
    if (additionalPerks.includes("beamSupports")) n += 0.07 * armor;
    if (additionalPerks.includes("chainedLinks")) n += 0.1 * armor;
    if (perks.includes("sealing")) i.flooding = (i.flooding || 0) + 0.28;
    if (perks.includes("rampart")) i.ramming = (i.ramming || 0) + 0.75;
    if (additionalPerks.includes("raisedQuarterdeck1")) i.flooding = (i.flooding || 0) + 0.15;
    if (additionalPerks.includes("chainedLinks")) i.weakpoint = (i.weakpoint || 0) + 0.15;
    if (additionalPerks.includes("mineClearingLocker")) i.mines = (i.mines || 0) + 0.15;
    if (additionalPerks.includes("dynamicBallastControl")) n += 0.03 * armor;
    if (additionalPerks.includes("atelierDeCuivrage")) n += 100;
    if (additionalPerks.includes("emergencyLocker")) {
        for (const k of ["flooding", "explosive", "piercing", "electric", "fire", "burning", "tearing", "toxic"]) {
            i[k] = (i[k] || 0) + 0.1;
        }
    }
    if (additionalPerks.includes("leatherFashioningStation1")) {
        i.fire = (i.fire || 0) + 0.15;
        i.burning = (i.burning || 0) + 0.15;
    }
    if (additionalPerks.includes("apothecaryToolBench")) i.toxic = (i.toxic || 0) + 0.16;

    return { armor: n, damageMitigation: i };
}

function _isRepairWeapon(weapon: Item): boolean {
    const r = ["repair", "repair1", "repair2", "repair3", "repairBomb", "repairBlast"];
    return Boolean(weapon.perks && weapon.perks.some(p => r.includes(p)));
}

function _getDamageTypesFromPerks(perks: string[] = []): string[] {
    const r: string[] = [];
    if (perks.some(e => e.includes("explosive") || e.includes("combustion") || ["blast", "precisionBlast"].includes(e))) r.push("explosive");
    if (perks.some(e => e.includes("flooding"))) r.push("flooding");
    if (perks.some(e => e.includes("burning"))) r.push("burning");
    if (perks.some(e => e.includes("piercing"))) r.push("piercing");
    if (perks.some(e => e.includes("electric"))) r.push("electric");
    if (perks.some(e => e.includes("toxic"))) r.push("toxic");
    return r;
}

/**
 * 武器属性修正
 */
function _modifyWeaponStats(weapon: Item, additionalPerks: string[], slotType: string) {
    const isBallista = weapon.type === 'ballista';
    let baseChargeOrRof = isBallista ? (weapon.chargeTime ?? 0) : (weapon.rateOfFire ?? 0);
    let chargeOrRof = baseChargeOrRof;
    let reload = weapon.reloadSpeed ?? 1000;
    let dmg = weapon.damagePerShot ?? 0;
    let projSpeed = weapon.projectileSpeed ?? 0;

    const weaponPerks = weapon.perks || [];
    const hasBurning = weaponPerks.some(e => e.includes("burning"));
    const hasExplosive = weaponPerks.some(e => e.includes("explosive") || e.includes("combustion"));
    const hasPiercing = weaponPerks.some(e => e.includes("piercing"));
    const hasToxic = weaponPerks.some(e => e.includes("toxic"));
    const hasElectric = _getDamageTypesFromPerks(weaponPerks).includes("electric");
    const hasFlooding = _getDamageTypesFromPerks(weaponPerks).includes("flooding");
    const isRepair = _isRepairWeapon(weapon);

    if (additionalPerks.includes("firebug") && hasBurning) reload -= 0.12 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("brouwersPowderhouse1") && weapon.type === "mortar") reload -= 0.07 * (weapon.reloadSpeed ?? 1000);
    if ((additionalPerks.includes("buoyLocker1") || additionalPerks.includes("spitefulSpikesStation")) && slotType === "auxiliaryWeapon") reload -= 0.07 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("organHarvestingStation") && weapon.type === "rocket" && slotType === "auxiliaryWeapon") reload -= 0.05 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("shellPackingStation") && weapon.type === "bombard") reload -= 0.05 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("plaguebringersWard") && hasToxic) reload -= 0.07 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("gearsWorkshop") && weapon.type === "ballista") {
        chargeOrRof -= 0.1 * (weapon.chargeTime ?? 0);
        reload -= 0.12 * (weapon.reloadSpeed ?? 1000);
    }
    if (additionalPerks.includes("ballistaMountSmithy") && weapon.type === "ballista") {
        chargeOrRof -= 0.18 * (weapon.chargeTime ?? 0);
    }
    if (additionalPerks.includes("smokedCanisters") && weapon.type === "seaFire") reload -= 0.1 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("cannonballCarvingStation") && hasPiercing) reload -= 0.05 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("teulingsGuidance") && slotType === "frontWeapon") reload -= 0.05 * (weapon.reloadSpeed ?? 1000);
    if (weapon.type === "longGun" && additionalPerks.includes("revolver") && slotType === "frontWeapon") {
        reload += 0.2 * (weapon.reloadSpeed ?? 1000);
        dmg -= 0.1 * (weapon.damagePerShot ?? 0);
    }
    if (additionalPerks.includes("markOfTheWolf") && hasExplosive) chargeOrRof -= 0.1 * baseChargeOrRof;
    if (additionalPerks.includes("leydenVaultArray") && hasElectric) reload -= 0.06 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("drowningCabinet") && hasFlooding) reload -= 0.1 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("fuseFusingStation") && (slotType === "frontWeapon" || slotType === "aftWeapon")) reload -= 0.09 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("ramrodWorkshop") && (slotType === "leftSideWeapon" || slotType === "rightSideWeapon")) reload -= 0.07 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("volatile") && (slotType === "leftSideWeapon" || slotType === "rightSideWeapon") && hasExplosive) reload -= 0.1 * (weapon.reloadSpeed ?? 1000);

    if (additionalPerks.includes("trunnionFurnace")) projSpeed += 0.1 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("hubacTuningRack")) projSpeed += 0.1 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("tuningStation1")) projSpeed += 0.13 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("bombardProjectileSpeed15") && weapon.type === "bombard") projSpeed += 0.15 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("culverinProjectileSpeed15") && weapon.type === "culverin") projSpeed += 0.15 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("longGunProjectileSpeed15") && weapon.type === "longGun") projSpeed += 0.15 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("torpedoProjectileSpeed15") && weapon.type === "torpedo") projSpeed += 0.15 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("ballistaProjectileSpeed15") && weapon.type === "ballista") projSpeed += 0.15 * (weapon.projectileSpeed ?? 0);
    if (additionalPerks.includes("overallProjectileSpeed05")) projSpeed += 0.05 * (weapon.projectileSpeed ?? 0);

    if (additionalPerks.includes("artificer") && slotType === "auxiliaryWeapon") reload -= 0.1 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("ammoPrimingBench") && (weaponPerks.includes("siege") || isRepair) && weapon.type !== "seaFire" && ["rocket", "mortar", "springloader"].includes(weapon.type as string)) reload -= 0.1 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("rampantCarriageHold")) reload -= 0.07 * (weapon.reloadSpeed ?? 1000);
    if (additionalPerks.includes("royalSterilizationTent") && isRepair) reload -= 0.11 * (weapon.reloadSpeed ?? 1000);

    return {
        rateOfFire: isBallista ? (weapon.rateOfFire ?? 0) : chargeOrRof,
        chargeTime: isBallista ? chargeOrRof : (weapon.chargeTime ?? 0),
        reloadSpeed: Math.max(reload, 100),
        damagePerShot: dmg,
        projectileSpeed: projSpeed
    };
}

/**
 * 计算单发射击循环 DPS (对应 reference_calc 的 v(e))
 */
function _calcCycleDPS(params: {
    reloadSpeed: number;
    rateOfFire?: number;
    fireDuration?: number;
    projectilesPerShot: number;
    damagePerShot: number;
}): number {
    const { reloadSpeed, rateOfFire = 0, fireDuration = 0, projectilesPerShot, damagePerShot } = params;
    const cycleTime = (reloadSpeed + rateOfFire * projectilesPerShot + fireDuration) / 1000;
    return cycleTime > 0 ? (projectilesPerShot * damagePerShot) / cycleTime : 0;
}

/**
 * 伤害与 Perks 计算 (对应 reference_calc 的 h(e))
 */
function _calcDamageWithPerks(params: {
    item: Item;
    baseDmg: number;
    perks?: string[];
    additionalPerks: string[];
    slotType: string;
    gunPorts?: number;
}) {
    const { item, baseDmg: i, perks: a = [], additionalPerks: t = [], slotType } = params;
    let p = 0, m = 0, h = 0, b = 0, f = 0, y = 0, k = 0, S = 0;
    let B = i, w = i, v = i, P = i, R = i, q = i, D = 0.5;

    if (a.includes("noDefaultCrit")) D -= 0.5;
    if (a.includes("explosive1") || a.includes("combustion1")) p += 0.1 * i;
    if (a.includes("explosive2") || a.includes("combustion2")) p += 0.2 * i;
    if (a.includes("explosive3") || a.includes("combustion3")) p += 0.3 * i;
    if (a.includes("flooding1")) m += 0.1 * i;
    if (a.includes("flooding2")) m += 0.2 * i;
    if (a.includes("flooding3")) m += 0.3 * i;
    if (a.includes("burning1")) h += 0.1 * i;
    if (a.includes("burning2")) h += 0.2 * i;
    if (a.includes("burning3")) h += 0.3 * i;
    if (a.includes("blast")) p += 0.15 * i;
    if (a.includes("precisionBlast")) p += 0.3 * i;
    if (a.includes("piercing1")) { f += 0.1 * i; D += 0.5; }
    if (a.includes("piercing2")) { f += 0.2 * i; D += 0.75; }
    if (a.includes("piercing3")) { f += 0.3 * i; D += 1; }
    if (a.includes("electric1")) y += 0.1 * i;
    if (a.includes("electric2")) y += 0.2 * i;
    if (a.includes("electric3")) y += 0.3 * i;
    if (a.includes("electric4")) y += 0.4 * i;
    if (a.includes("toxic1")) k += 0.1 * i;
    if (a.includes("toxic2")) k += 0.2 * i;
    if (a.includes("toxic3")) k += 0.3 * i;
    if (a.includes("raider")) S += 0.5;

    // 家具增益元素伤害
    if (
        (t.includes("culverinElementalDamage19") && (item.type as string).includes("culverin")) ||
        (t.includes("ballistaElementalDamage19") && (item.type as string).includes("ballista")) ||
        (t.includes("bombardElementalDamage19") && (item.type as string).includes("bombard")) ||
        (t.includes("flamethrowerElementalDamage19") && (item.type as string).includes("seaFire")) ||
        (t.includes("longGunElementalDamage19") && (item.type as string).includes("longGun")) ||
        (t.includes("torpedoElementalDamage19") && (item.type as string).includes("torpedo")) ||
        (t.includes("demicannonElementalDamage19") && (item.type as string).includes("demicannon")) ||
        (t.includes("mortarElementalDamage19") && (item.type as string).includes("mortar")) ||
        (t.includes("rocketElementalDamage19") && (item.type as string).includes("rocket"))
    ) {
        p += 0.19 * p;
        m += 0.19 * m;
        h += 0.19 * h;
        b += 0.19 * b;
        f += 0.19 * f;
        y += 0.19 * y;
        k += 0.19 * k;
    }

    if (t.includes("outburst") && _getDamageTypesFromPerks(a).includes("explosive")) p += 0.15 * i;
    if (t.includes("joineryWorkshop1")) v += 0.06 * i;
    if (t.includes("stinkpotStation") && _getDamageTypesFromPerks(a).includes("toxic")) k += 0.15 * i;
    if (t.includes("ballistaMountSmithy") && item.type === "ballista") D += 0.14;

    w += p + m + h + f + y + k;
    P = w + w * D;
    q = w;

    if (a.includes("siege")) q += 0.5 * w;
    if (a.includes("demolition")) q += 3 * p;
    if (t.includes("structureDamage15")) q += 0.15 * w;
    if (t.includes("outburst")) q += 0.4 * w;
    if (t.includes("detonate")) q += 0.5 * w;
    if (t.includes("fatanaStation1")) q += 0.12 * w;

    const F = {
        baseDmgMultiplier: 1,
        dmgWithPerksMultiplier: 1,
        healingDmgWithPerksMultiplier: 1,
        additionalExplosiveDmgMultiplier: 1,
        additionalFloodingDmgMultiplier: 1,
        additionalFireDmgMultiplier: 1,
        additionalTearingDmgMultiplier: 1,
        additionalPiercingDmgMultiplier: 1,
        additionalElectricDmgMultiplier: 1,
        additionalToxicDmgMultiplier: 1,
        critDmgMultiplier: 1,
        sailDmgMultiplier: 1,
        siegeDmgMultiplier: 1,
    };

    const addMult = (amount: number) => {
        F.baseDmgMultiplier += amount;
        F.dmgWithPerksMultiplier += amount;
        F.healingDmgWithPerksMultiplier += amount;
        F.additionalExplosiveDmgMultiplier += amount;
        F.additionalFloodingDmgMultiplier += amount;
        F.additionalFireDmgMultiplier += amount;
        F.additionalTearingDmgMultiplier += amount;
        F.additionalPiercingDmgMultiplier += amount;
        F.additionalElectricDmgMultiplier += amount;
        F.additionalToxicDmgMultiplier += amount;
        F.critDmgMultiplier += amount;
        F.sailDmgMultiplier += amount;
        F.siegeDmgMultiplier += amount;
    };

    if (
        (t.includes("frontWeaponDamage1") && "frontWeapon" === slotType) ||
            (t.includes("portWeaponDamage1") && "leftSideWeapon" === slotType) ||
                (t.includes("starboardWeaponDamage1") && "rightSideWeapon" === slotType)
    ) {
        addMult(0.1);
    }

    if (t.includes("maintainedArsenal1") && "auxiliaryWeapon" === slotType) addMult(0.13);
    if (t.includes("evolved") && "auxiliaryWeapon" === slotType) addMult(0.15);
    if (t.includes("cascadeCoilBench") && "seaFire" === item.type) {
        F.baseDmgMultiplier += 0.13;
        F.dmgWithPerksMultiplier += 0.13;
        F.healingDmgWithPerksMultiplier += 0.15;
        F.additionalExplosiveDmgMultiplier += 0.15;
        F.additionalFloodingDmgMultiplier += 0.15;
        F.additionalFireDmgMultiplier += 0.15;
        F.additionalTearingDmgMultiplier += 0.15;
        F.additionalPiercingDmgMultiplier += 0.15;
        F.additionalElectricDmgMultiplier += 0.15;
        F.additionalToxicDmgMultiplier += 0.15;
        F.critDmgMultiplier += 0.13;
        F.sailDmgMultiplier += 0.13;
        F.siegeDmgMultiplier += 0.13;
    }

    if ((t.includes("stationsUpgrade") || t.includes("gunportsUpgrade")) && ("leftSideWeapon" === slotType || "rightSideWeapon" === slotType)) addMult(0.25);
    if ((t.includes("bigGuns") || t.includes("heavyArsenal")) && ("leftSideWeapon" === slotType || "rightSideWeapon" === slotType)) addMult(0.5);

    if (t.includes("ammoPrimingBench")) {
        F.healingDmgWithPerksMultiplier += 0.07;
        if (a.includes("siege")) addMult(0.04);
    }

    if (t.includes("wildfire") || (t.includes("bullhorn") && a.some(e => e.includes("flooding")))) addMult(0.35);
    if (t.includes("cursedBanner") && "auxiliaryWeapon" === slotType) addMult(0.07);
    if (t.includes("machinistStationMines1") && "auxiliaryWeapon" === slotType && ["mineSpringloader1", "mineSpringloader2", "mineSpringloader3", "infernalMaw", "royalSentinel", "spiritcaller"].includes(item.id)) addMult(0.2);

    if (t.includes("bombardMenuiserie1")) {
        F.healingDmgWithPerksMultiplier += 0.05;
        if ((item.type as string).includes("bombard")) addMult(0.1);
    }
    if (t.includes("chargeStores") && a.some(e => e.includes("electric"))) addMult(0.05);
    if (t.includes("kinckelsLaboratory1")) F.siegeDmgMultiplier += 0.05;
    if (t.includes("plaguebringersWard") && a.some(e => e.includes("toxic"))) addMult(0.04);

    if (t.includes("volatile") && ("leftSideWeapon" === slotType || "rightSideWeapon" === slotType) && _getDamageTypesFromPerks(a).includes("explosive")) {
        const e = 0.2 * p;
        p += e; w += e; P += e; R += e; q += e;
    }

    if (t.includes("ramrodWorkshop") && ("leftSideWeapon" === slotType || "rightSideWeapon" === slotType)) {
        for (const val of [h, m, p, y, k, f, b]) {
            const add = 0.07 * val;
            w += add; P += add; R += add; q += add;
        }
        h += 0.07 * h;
        m += 0.07 * m;
        p += 0.07 * p;
        y += 0.07 * y;
        k += 0.07 * k;
        f += 0.07 * f;
        b += 0.07 * b;
    }

    if (t.includes("tuningStation1") && "torpedo" === item.type) {
        for (const val of [h, m, p, y, k, f, b]) {
            const add = 0.2 * val;
            w += add; P += add; R += add; q += add;
        }
        h += 0.2 * h; m += 0.2 * m; p += 0.2 * p; y += 0.2 * y; k += 0.2 * k; f += 0.2 * f; b += 0.2 * b;
    }

    if (t.includes("fuseFusingStation") && ("frontWeapon" === slotType || "aftWeapon" === slotType)) {
        for (const val of [h, m, p, y, k, f, b]) {
            const add = 0.09 * val;
            w += add; P += add; R += add; q += add;
        }
        h += 0.09 * h; m += 0.09 * m; p += 0.09 * p; y += 0.09 * y; k += 0.09 * k; f += 0.09 * f; b += 0.09 * b;
    }

    if (t.includes("wyrmsBreathChurner") && a.some(e => e.includes("explosive") || e.includes("combustion"))) {
        const eh = 0.2 * h; h += eh; w += eh; P += eh; R += eh; q += eh;
        const em = 0.25 * m; m += em; w += em; P += em; R += em; q += em;
        const ep = 0.25 * p; p += ep; w += ep; P += ep; R += ep; q += ep;
        const ey = 0.25 * y; y += ey; w += ey; P += ey; R += ey; q += ey;
        const ek = 0.25 * k; k += ek; w += ek; P += ek; R += ek; q += ek;
        const ef = 0.25 * f; f += ef; w += ef; P += ef; R += ef; q += ef;
        const eb = 0.25 * b; b += eb; w += eb; P += eb; R += eb; q += eb;
        addMult(0.05);
    }

    if (t.includes("bilgefireBarrels") && ("frontWeapon" === slotType || "aftWeapon" === slotType)) {
        const eh = 0.1 * h; h += eh; w += eh; P += eh; R += eh; q += eh;
        const em = 0.1 * m; m += em; w += em; P += em; R += em; q += em;
        const ep = 0.1 * p; p += ep; w += ep; P += ep; R += ep; q += ep;
        const ey = 0.1 * y; y += ey; w += ey; P += ey; R += ey; q += ey;
        const ek = 0.1 * k; k += ek; w += ek; P += ek; R += ek; q += ek;
        const ef = 0.1 * f; f += ef; w += ef; P += ef; R += ef; q += ef;
        const eb = 0.1 * b; b += eb; w += eb; P += eb; R += eb; q += eb;
        addMult(0.05);
    }

    if (
        (t.includes("devilsConcoction") && a.some(e => e.includes("burning"))) ||
        (t.includes("expandingCorkscrewStation") && a.some(e => e.includes("flooding"))) ||
        (t.includes("highVelocityKegs") && a.some(e => e.includes("piercing") || e.includes("unrelentingDrill"))) ||
        (t.includes("copperFasteningStation") && a.some(e => e.includes("electric")))
    ) {
        const eh = 0.12 * h; h += eh; w += eh; P += eh; R += eh; q += eh;
        const em = 0.12 * m; m += em; w += em; P += em; R += em; q += em;
        const ep = 0.12 * p; p += ep; w += ep; P += ep; R += ep; q += ep;
        const ey = 0.12 * y; y += ey; w += ey; P += ey; R += ey; q += ey;
        const ek = 0.12 * k; k += ek; w += ek; P += ek; R += ek; q += ek;
        const ef = 0.12 * f; f += ef; w += ef; P += ef; R += ef; q += ef;
        const eb = 0.12 * b; b += eb; w += eb; P += eb; R += eb; q += eb;
    }

    if (t.includes("spitefulSpikesStation") && "auxiliaryWeapon" === slotType) F.critDmgMultiplier += 0.1;
    if (t.includes("revitalized") || t.includes("unburden")) v += 0.6 * i;
    if (t.includes("teulingsGuidance") && "frontWeapon" === slotType) F.critDmgMultiplier += 0.12;
    if (t.includes("laPotenceSchematics1")) F.critDmgMultiplier += 0.1;
    if (t.includes("markOfTheWolf")) F.siegeDmgMultiplier += 0.05;

    if (a.includes("repair") || a.includes("repair2") || a.includes("repairBomb") || a.includes("repairBlast")) {
        B = 0; w = 0; P = 0; R = 0; q = 0; p = 0; m = 0; h = 0; b = 0; f = 0; y = 0; k = 0;
    } else {
        v = 0;
    }

    B = B > 0 ? B * F.baseDmgMultiplier : 0;
    w = w > 0 ? w * F.dmgWithPerksMultiplier : 0;
    v = v > 0 ? v * F.healingDmgWithPerksMultiplier : 0;
    p = p > 0 ? p * F.additionalExplosiveDmgMultiplier : 0;
    m = m > 0 ? m * F.additionalFloodingDmgMultiplier : 0;
    h = h > 0 ? h * F.additionalFireDmgMultiplier : 0;
    b = b > 0 ? b * F.additionalTearingDmgMultiplier : 0;
    f = f > 0 ? f * F.additionalPiercingDmgMultiplier : 0;
    y = y > 0 ? y * F.additionalElectricDmgMultiplier : 0;
    k = k > 0 ? k * F.additionalToxicDmgMultiplier : 0;
    P = P > 0 ? P * F.critDmgMultiplier : 0;
    R = 0.3 * w;
    if (a.includes("tearing1")) R += 0.25 * R;
    if (a.includes("tearing2")) R += 0.5 * R;
    if (a.includes("tearing3")) R += 0.75 * R;
    R = R > 0 ? R * F.sailDmgMultiplier : 0;
    q = q > 0 ? q * F.siegeDmgMultiplier : 0;

    return {
        _baseDmg: B,
        _dmgWithPerks: w,
        _healingDmgWithPerks: v,
        _additionalExplosiveDmg: p,
        _additionalFloodingDmg: m,
        _additionalFireDmg: h,
        _additionalTearingDmg: b,
        _additionalPiercingDmg: f,
        _additionalElectricDmg: y,
        _additionalToxicDmg: k,
        _additionalCrewAttackChargeRate: S > 0 ? S : 0,
        _critDmg: P,
        _sailDmg: R,
        _siegeDmg: q,
    };
}

/**
 * 获取指定槽位及武器的可用炮口数量
 */
function _getGunPortsForSlot(ship: Ship, slotType: string, weapon: Item): number {
    const slots = ship.slots;
    if (!slots) return 1;

    const slotDef = (slots as any)[slotType];
    if (!slotDef) return 1;

    const gunPortDef = slotDef[1];
    let totalPorts = 0;
    let decks = 0;
    let topPorts = 0;

    if (typeof gunPortDef === 'number') {
        totalPorts = gunPortDef;
        topPorts = gunPortDef;
        decks = 1;
    } else if (typeof gunPortDef === 'object' && gunPortDef !== null) {
        topPorts = gunPortDef.top ?? 0;
        const middle = gunPortDef.middle ?? 0;
        const lower = gunPortDef.lower ?? 0;
        totalPorts = topPorts + middle + lower;
        decks = (topPorts > 0 ? 1 : 0) + (middle > 0 ? 1 : 0) + (lower > 0 ? 1 : 0);
    }

    // 判断武器分类
    const weaponCategory = (weapon as any).category;
    if (weaponCategory === 'bowWeapons') return 1;
    if (weaponCategory === 'topDeckWeapons' && decks > 1) {
        return topPorts;
    }
    return totalPorts > 0 ? totalPorts : 1;
}

/**
 * 完整计算单把武器的属性和 DPS
 */
function _calcWeaponStats(params: {
    weapon: Item;
    slotType: string;
    gunPorts: number;
    additionalPerks: string[];
    modifications?: Modification[];
}): WeaponCalcStats {
    const { weapon, slotType, gunPorts, additionalPerks, modifications = [] } = params;

    // 家具与 Perks 修正武器参数
    const modified = _modifyWeaponStats(weapon, additionalPerks, slotType);

    // 模组修正
    let finalDamage = modified.damagePerShot;
    let finalReload = modified.reloadSpeed;
    const modStats: ModCalcStats[] = [];
    const bonusFlags: string[] = [];

    for (const mod of modifications) {
        const variant = _findMatchingVariant(mod, weapon.type as string);
        if (!variant) continue;

        const [minVal, maxVal] = variant.range;
        const midVal = (minVal + maxVal) / 2;

        modStats.push({
            modId: mod.id,
            effectType: mod.effectType,
            damageType: mod.damageType,
            minValue: minVal,
            maxValue: maxVal,
            midValue: midVal,
        });

        switch (mod.effectType) {
            case 'increaseDamage':
                finalDamage *= (1 + midVal);
                break;
            case 'bonusElementalDamage':
            case 'addElementalDamage':
            case 'extraElementalDamage':
            case 'extraDamage':
                finalDamage += modified.damagePerShot * midVal;
                break;
            case 'increaseReloadSpeed':
                finalReload *= (1 - midVal);
                break;
            case 'ignoreResistance':
                bonusFlags.push(`ignoreResistance:${mod.damageType ?? 'unknown'}`);
                break;
            default:
                if (mod.effectType) {
                    bonusFlags.push(`${mod.effectType}:${(midVal * 100).toFixed(1)}%`);
                }
                break;
        }
    }
    finalReload = Math.max(finalReload, 100);

    // 计算 1-port 单炮口 DPS (RateOfFire = 0)
    const singlePortCycleDPS = _calcCycleDPS({
        reloadSpeed: finalReload,
        rateOfFire: 0,
        fireDuration: (weapon as any).fireDuration ?? 0,
        projectilesPerShot: weapon.projectilesPerShot ?? 1,
        damagePerShot: finalDamage,
    });

    const singlePortDmg = _calcDamageWithPerks({
        item: weapon,
        baseDmg: singlePortCycleDPS,
        perks: weapon.perks,
        additionalPerks,
        slotType,
        gunPorts: 1,
    });

    // 计算多炮口每炮 DPS (RateOfFire = weapon.rateOfFire)
    const multiPortCycleDPS = _calcCycleDPS({
        reloadSpeed: finalReload,
        rateOfFire: modified.rateOfFire,
        fireDuration: (weapon as any).fireDuration ?? 0,
        projectilesPerShot: weapon.projectilesPerShot ?? 1,
        damagePerShot: finalDamage,
    });

    const multiPortDmg = _calcDamageWithPerks({
        item: weapon,
        baseDmg: multiPortCycleDPS,
        perks: weapon.perks,
        additionalPerks,
        slotType,
        gunPorts,
    });

    const totalDamagePerShot = finalDamage * (weapon.projectilesPerShot ?? 1);
    const totalDamagePerVolley = totalDamagePerShot * gunPorts;

    return {
        weaponId: weapon.id,
        weaponType: weapon.type as string,
        baseDamagePerShot: weapon.damagePerShot ?? 0,
        projectilesPerShot: weapon.projectilesPerShot ?? 1,
        baseReloadSpeed: weapon.reloadSpeed ?? 1000,
        rateOfFire: modified.rateOfFire,
        optimalRange: weapon.optimalRange ?? 0,
        projectileSpeed: modified.projectileSpeed,
        chargeTime: modified.chargeTime,

        finalDamagePerShot: finalDamage,
        finalReloadSpeed: finalReload,
        totalDamagePerShot,

        // 1-port
        singlePortBaseDPS: singlePortDmg._baseDmg,
        singlePortDpsWithPerks: singlePortDmg._dmgWithPerks,
        dps: singlePortDmg._dmgWithPerks,

        // 方向总计 (乘以 gunPorts)
        gunPorts,
        baseDPS: multiPortDmg._baseDmg * gunPorts,
        dpsWithPerks: multiPortDmg._dmgWithPerks * gunPorts,
        totalDPS: multiPortDmg._dmgWithPerks * gunPorts,
        totalDamagePerVolley,

        shareExplosive: multiPortDmg._additionalExplosiveDmg * gunPorts,
        shareFlooding: multiPortDmg._additionalFloodingDmg * gunPorts,
        shareFire: multiPortDmg._additionalFireDmg * gunPorts,
        shareTearing: multiPortDmg._additionalTearingDmg * gunPorts,
        sharePiercing: multiPortDmg._additionalPiercingDmg * gunPorts,
        shareElectric: multiPortDmg._additionalElectricDmg * gunPorts,
        shareToxic: multiPortDmg._additionalToxicDmg * gunPorts,

        againstWeakpoints: multiPortDmg._critDmg * gunPorts,
        againstSails: multiPortDmg._sailDmg * gunPorts,
        againstStructures: multiPortDmg._siegeDmg * gunPorts,

        modifications: modStats,
        bonusFlags,
    };
}

/**
 * 查找模组对应武器类型的 variant
 */
function _findMatchingVariant(mod: Modification, weaponType: string) {
    if (!mod.variants || mod.variants.length === 0) return null;
    for (const variant of mod.variants) {
        if (variant.itemType.includes(weaponType as any)) {
            return variant;
        }
    }
    return mod.variants[0];
}

/**
 * 四舍五入至两位小数
 */
function _round(value: number, precision: number = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}
