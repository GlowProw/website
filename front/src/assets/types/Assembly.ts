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

export interface AssemblyAttr {
    isShowItemName?: boolean
    assemblyUseVersion?: string
}

export interface WheelAttr {
    wheelUseVersion?: string
}

export interface WarehouseAttr {
    warehouseUseVersion?: string
}
