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
