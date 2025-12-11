/**
 * 配装
 */
import {Item} from "glow-prow-data";

export interface AssemblyBasieIds {
    id: string | bigint
    uuid: string
}

export interface AssemblyItem extends AssemblyBasieIds {
    name: number
    likes: number
    isLiked: boolean
    byUsername: string
    byUserId: string | number
}

export interface ItemAssemblySave extends Item {
    direction?: string
}

/**
 * 配装属性
 */
export interface AssemblyAttr {
    isShowItemName?: boolean
    isFullName?: boolean
    isComment?: boolean
    isLike?: true
    assemblyUseVersion?: string
    password?: string | number | null | unknown
    language?: string
}

/**
 * 轮盘属性
 */
export interface WheelAttr {
    wheelUseVersion?: string
}

/**
 * 仓库属性
 */
export interface WarehouseAttr {
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
    attr?: WheelAttr
    data?: any | {}
}

/**
 * 请求轮盘体
 */
export interface WarehouseAttrParams {
    attr?: WarehouseAttr
    data?: any | {}
}

/**
 * 发布配装请求体
 */
export interface PublishAssemblyData {
    uuid?: string | null | unknown
    name?: string
    description?: string | null | unknown
    tags?: [],

    assembly: AssemblyParams
    wheel?: AssemblyWheelParams
    warehouse?: WarehouseAttrParams
}

/**
 * 编辑配装请求体
 */
export interface EditAssemblyData {
    assembly: AssemblyParams
    wheel?: AssemblyWheelParams
    warehouse?: WarehouseAttrParams
}

export interface AssemblyItem {
}

export interface AssemblyListParams {
}
