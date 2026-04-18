/**
 * 愿望清单类型定义
 */

/**
 * 单条愿望清单规则
 */
export interface WishlistRule {
    /** 物品 ID */
    id: string;
    /** perk/mod hash 列表 */
    perks: string[];
    /** 模组项列表 */
    mods?: string[];
    /** 备注 */
    notes: string;
    /** 标签（如 pve, pvp） */
    tags: string[];
}

/**
 * 愿望清单文件
 */
export interface WishlistFile {
    /** 唯一 ID */
    id: string;
    /** 清单标题（必填） */
    title: string;
    /** 清单描述（必填） */
    description: string;
    /** 所有规则 */
    rules: WishlistRule[];
    /** 是否启用 */
    enabled: boolean;
    /** 来源（URL 或文件名） */
    source: string;
    /** 导入时间戳 */
    importedAt: number;
    /** 更新链接数组，多个备用源 */
    updateUrls?: string[];
    /** 版本号 */
    version?: string;
    /** 作者 */
    author?: string;
    /** 作者网站 */
    authorUrl?: string;
    /** 最近一次主动更新时间戳 */
    lastUpdatedAt?: number;
    /** 导入时去除的重复规则数 */
    duplicatesRemoved?: number;
}

/**
 * 愿望清单元数据（不含 rules，用于索引存储）
 */
export type WishlistMeta = Omit<WishlistFile, 'rules'> & {
    /** 规则总数 */
    rulesCount: number;
};

/**
 * 愿望清单匹配结果
 */
export interface WishlistMatch {
    /** 是否匹配 */
    matched: boolean;
    /** 匹配到的规则 */
    rules: WishlistRule[];
    /** 来源清单名列表 */
    wishlistNames: string[];
}

/**
 * 愿望清单验证结果
 */
export interface WishlistValidation {
    /** 是否通过验证 */
    valid: boolean;
    /** 错误信息列表 */
    errors: string[];
}

/**
 * 去重结果
 */
export interface DeduplicateResult {
    /** 去重后的规则列表 */
    rules: WishlistRule[];
    /** 被移除的重复规则数 */
    duplicatesRemoved: number;
}
