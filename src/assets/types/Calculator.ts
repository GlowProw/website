/**
 * 量化计算器状态机用到的类型
 */
import type { Ship } from "glow-prow-data";
import type { Item } from "glow-prow-data/src/entity/Items";
import type { Modification } from "glow-prow-data/src/entity/Modifications";
import type { ItemCalcResult } from "@/assets/sripts/item_carc";

export interface CalculatorTarget {
    uid: string
    id: string
    type: 'item' | 'ship' | 'material'
    quantity: number
}

export interface MaterialTreeNode {
    id: string
    name: string
    quantity: number
    isExcluded: boolean
    children: MaterialTreeNode[]
}

export interface FlatMaterialEntry {
    id: string
    totalQuantity: number
    isRaw: boolean
    // 该材料本身可以继续制作为下级材料
    isCraftable: boolean
}

export interface SankeyNode {
    id: string
    name: string
    text: string
    color: string
}

export interface SankeyLink {
    source: string
    target: string
    name: string
    text: string
    color: string
    value: number
}

export interface SavedConfig {
    uid: string
    name: string
    createdAt: number
    targets: CalculatorTarget[]
    excludedMaterials: string[]
    displaySettings: DisplaySettings
}

export interface DisplaySettings {
    viewMode: 'list' | 'sankey'
    listColumns: {
        name: boolean
        quantity: boolean
        id: boolean
        link: boolean
    }
    sankey: {
        showName: boolean
        showQuantity: boolean
    }
}

/**
 * localStorage 里持久化的计算器状态形状
 */
export interface PersistedState {
    useColorPanel: { name: string, value: string[] }
    targets: CalculatorTarget[]
    excludedMaterials: string[]
    savedConfigs: SavedConfig[]
    displaySettings: DisplaySettings
}

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

/**
 * 计算结果表格组件入参
 */
export interface CalcResultTableProps {
    result: ItemCalcResult;
    targetResult?: ItemCalcResult | null;
    isSimulationShipSailSpeed?: boolean;
    isColOne?: boolean;
    isDisabledMoveTitle?: boolean;
}
