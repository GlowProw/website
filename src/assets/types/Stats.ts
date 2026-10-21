/**
 * 数据中心统计相关类型，与后端 /api/stats 结构对齐
 */

export type StatsRange = '7' | '30' | '90';

export interface StatsOverview {
    range?: StatsRange;
    browseCount: number;
    spaceCount: number;
    likeCount: number;
    commentCount: number;
    replyCount: number;
    assemblyCount: number;
    conversationCount: number;
    messageUnread: number;
    collectionCount: number;
    updatedAt: number;
}

export interface StatsTrendPoint {
    date: string;
    value: number;
}

export interface StatsTrend {
    metric: 'browse' | 'like' | 'comment' | 'reply' | 'space';
    range: StatsRange;
    points: StatsTrendPoint[];
    updatedAt: number;
}

/**
 * 访客信息（登录用户或匿名访客），结构与后端 Visitor 对齐
 */
export interface StatsVisitor {
    identity: string;
    isUser: boolean;
    userId?: string;
    username?: string | null;
    avatar?: string | null;
    anonMasked?: string;
    browseTime: number;
}

export interface StatsAssemblyTop {
    topLiked: Array<{ uuid: string; name: string; likeCount: number; likedUsers: any[] }>;
    topViewed: Array<{
        uuid: string;
        name: string;
        viewCount: number;
        likeCount: number;
        commentCount: number;
        recentVisitors: StatsVisitor[];
    }>;
    updatedAt: number;
}

/**
 * 已取得记录
 */
export interface CollectionRecord {
    targetId: string
    targetType: string
    createdTime: string
}

/**
 * 收藏统计原始数据
 */
export interface CollectionStatsResult {
    targetType: string;
    total: number;
    firstCollectedAt: string | null;
    lastCollectedAt: string | null;
    records: CollectionRecord[];
}

/**
 * 按周聚合的收藏趋势
 */
export interface CollectionWeekStat {
    start: string;
    label: string;
    added: number;
    cumulative: number;
}

/**
 * 按物品类型聚合的收藏进度
 */
export interface CollectionTypeStat {
    type: string;
    collected: number;
    available: number;
    percent: number;
}

/**
 * 按赛季聚合的收藏数量
 */
export interface CollectionSeasonStat {
    season: string;
    collected: number;
    types: Array<{ type: string; count: number }>;
}
