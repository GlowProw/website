/**
 * 配装
 */
import {PaginationParams, PaginationResult} from "@/assets/types/Pagination";
import {ResultData} from "@/assets/types/Result";
import {Ship} from "glow-prow-data/src/entity/Ships";
import {Item} from "glow-prow-data/src/entity/Items";
import {Cosmetic, Material, Modification, Ultimate} from "glow-prow-data";
import ol from "ol/dist/ol";
import functions = ol.functions;

/**
 * 配装id
 */
export interface AssemblyBasieIds {
    id?: string | bigint
    uuid?: string
}

/**
 * 配装
 */
export interface AssemblyItem extends AssemblyBasieIds {
    // 配装名称
    name?: string | null | unknown
    // 配装描述
    description?: string | null | unknown
    // 配装内容 S
    assembly?: AssemblyParams
    wheel?: AssemblyWheelParams
    warehouse?: WarehouseAttrParams
    // 配装内容 E
    userId?: string
    userAvatar?: string
    username?: string
    likes?: number
    isLiked?: boolean
    attr?: AssemblyAttr
}

/**
 * 配装属性
 */
export interface AssemblyAttr {
    // 显示名称
    isShowItemName?: boolean
    // 显示完整物品名称
    isFullName?: boolean
    // 是否允许评论
    isComment?: boolean
    // 是否允许收藏
    isLike?: true
    // 配装背景
    backgroundPresentation?: string | null | any
    // 配装使用版本
    assemblyUseVersion?: string
    // 密码
    password?: string | number | null | unknown
    // 语言
    language?: string
}

/**
 * 轮盘属性
 */
export interface WheelAttr {
    // 轮盘版本
    wheelUseVersion?: string
}

/**
 * 仓库属性
 */
export interface WarehouseAttr {
    // 仓库版本
    warehouseUseVersion?: string
}

/**
 * 请求配装体
 */
export interface AssemblyParams {
    visibility?: string
    tags?: []
    attr?: AssemblyAttr
    data?: any | {}
}

/**
 * 请求轮盘体
 */
export interface AssemblyWheelParams {
    // 轮盘属性
    attr?: WheelAttr
    // 轮盘数据
    data?: any | {}
}

/**
 * 请求轮盘体
 */
export interface WarehouseAttrParams {
    // 配装属性
    attr?: WarehouseAttr
    // 配装数据
    data?: any | {}
}

/**
 * 发布配装请求体
 */
export interface PublishAssemblyData extends AssemblyItem {
}

export interface AssemblyListParams extends PaginationParams {
    keyword?: string;
    tags?: string[];
}

export interface EditAssemblyData extends AssemblyItem {
}

export interface AssemblyListResult {
    data: AssemblyItem[];
    pagination?: PaginationResult;
    code?: string;
}

export interface AssemblyItemResult extends ResultData<AssemblyItem> {
}

export type AvailableDataStructure = Ship | Item | Material | Cosmetic | Ultimate | Modification;

export interface GroupedData {
    type: string;
    model: boolean;
    child: AvailableDataStructure[];
}

export interface AssemblyClassificationShowListProps {
    tags: string[];
    sortBy?: "id" | "rarity" | "tier";
    loadDataType?: "ship" | "item" | "material" | "cosmetic" | "ultimate" | "modification";
    filterType?: string;
    v?: number,
    filterFun?: (item: any) => boolean;
    modelValue: any;
    autoExpandFirst?: boolean;
}

export interface AssemblyWorkshopData {
    shipModel: boolean;
    frigateUpgradeModel: boolean;
    displayModel: boolean;
    weaponModel: boolean;
    secondaryWeaponModel: boolean;
    ultimateModel: boolean;
    armorModel: boolean;
    weaponSearchValue: string;
    frigateUpgradeInsertIndex: number;
    weaponInsertIndex: number;
    secondaryWeaponInsertIndex: number;
    secondaryWeaponSelect: number;
    armorSelect: number;
    ultimateSelect: number;
    displayInsertIndex: number;
    shipWorkshopSelect: any;
    shipSelect: any;
    shipFrigateUpgradeSelect: any;
    shipDisplaySelect: any;
    shipFrigateUpgradeList: any[];
    data: {
        shipSlot: Ship | null;
        ultimateSlot: Item | null;
        shipUpgradeSlot: Item | null;
        weaponDirections: (string | null)[];
        weaponModifications: any[];
        weaponSlots: Item[];
        armorSlot: Item | null;
        armorModification: any[];
        secondaryWeaponSlots: Item[];
        secondaryWeaponModifications: any[];
        displaySlots: Item[];
        __version: string;
        weaponModification: any[];
    };
}

export interface AssemblyWidgetProps {
    readonly?: boolean,
    isFullName?: boolean,
    isShowEmpty?: boolean,
    perfectDisplay?: boolean,
    class?: string,
}
