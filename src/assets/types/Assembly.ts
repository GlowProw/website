/**
 * 配装
 */
import {Item} from "glow-prow-data";

// ==== 数据 S =====
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

export interface AssemblyAttr {
    isShowItemName?: boolean
    isFullName?: boolean
    assemblyUseVersion?: string
}

export interface WheelAttr {
    wheelUseVersion?: string
}

export interface WarehouseAttr {
    warehouseUseVersion?: string
}

// ==== 数据 E =====

// ==== 请求 S =====
export interface PublishAssemblyData {

}

export interface EditAssemblyData {
}

export interface AssemblyItem {
}

export interface AssemblyListParams {
}

// ==== 请求 E =====
