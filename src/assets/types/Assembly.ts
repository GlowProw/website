/**
 * 配装
 */
import {PaginationParams, PaginationResult} from "@/assets/types/Pagination";

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
    tags?: string[] | any[]
}

/**
 * 编辑配装请求体
 */
export interface EditAssemblyData extends AssemblyItem {

}

/**
 * 配装返回
 */
export interface AssemblyItemResult extends AssemblyItem, AssemblyBasieIds {

}

/**
 * 单个配装请求体
 * get src/routers/assembly.ts /item
 */
export interface AssemblyItemParams {
    uuid: string | null | unknown
    password?: string | null | unknown
    force?: boolean
}

/**
 * 单个配装返回体
 */
export interface AssemblyItemResult extends AssemblyItem {
    userId: string | null
    username: string

    // 收藏数量
    likes?: string | number

    // 是否已收藏
    isLiked?: boolean
    // 配装是否可见
    isVisibility?: boolean
    // 所有者
    isOwner?: boolean
    // 包含密码
    isPassword?: boolean
    // 是否强制更新，[AssemblyItemParams] force
    isForce?: boolean

    userAvatar?: string

    // 配装数据和属性 S
    attr?: AssemblyAttr
    data?: any | {}
    // 配装数据和属性 E

    tags?: string[] | any[]
    cloningUuid?: string | null
    updatedTime: string | Date | null
    createdTime: string | Date | null

    valid: number | bigint | null
}

/**
 * 配装列表请求体
 */
export interface AssemblyListParams {

}

/**
 * 配装列表返回体
 */
export interface AssemblyListResult {
    data: AssemblyItemResult[],
    pagination?: PaginationResult
}
