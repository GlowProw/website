/**
 * 收藏（已取得）相关类型，前后端通用 targetType / targetId 约定
 */

/**
 * 可收藏的图鉴目标类型，与后端 CODEX_TARGET_TYPES 保持一致
 */
export const COLLECTION_TARGET_KINDS = [
    'item',
    'ship',
    'material',
    'cosmetic',
    'commoditie',
    'empireSkill',
    'mapLocation',
    'mastery',
    'mod',
    'npc',
    'set',
    'treasureMap',
    'ultimate',
] as const

export type CollectionTargetKind = typeof COLLECTION_TARGET_KINDS[number]

/**
 * 收藏开关的展示形态
 * button 详情页按钮，icon 列表小图标，corner 图标右上角角标
 */
export type CollectionToggleType = 'button' | 'icon' | 'corner'

/**
 * 收藏状态变化事件
 */
export interface CollectionToggleChange {
    targetType: string
    targetId: string
    collected: boolean
}

/**
 * 本地标记与账户收藏的双向同步结果
 */
export interface CollectionSyncResult {
    uploaded: number
    downloaded: number
}
