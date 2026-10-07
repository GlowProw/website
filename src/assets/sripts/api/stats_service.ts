/**
 * 数据中心统计 API 服务
 * 对应后端 /api/stats/* 路由
 */
import {useHttpToken} from "@/assets/sripts/http_util";

export interface StatsOverview {
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
    range: '7' | '30';
    points: StatsTrendPoint[];
    updatedAt: number;
}

export interface StatsAssemblyTop {
    topLiked: Array<{ uuid: string; name: string; likeCount: number; likedUsers: any[] }>;
    topViewed: Array<{ uuid: string; name: string; viewCount: number; recentVisitors: any[] }>;
    updatedAt: number;
}

export function useStatsApi() {
    const http = useHttpToken();

    const getOverview = async (): Promise<StatsOverview | null> => {
        try {
            const res = await http.get('stats/overview');
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as StatsOverview) || null;
            return null;
        } catch { return null; }
    };

    const getTrend = async (
        metric: StatsTrend['metric'],
        range: StatsTrend['range'] = '7'
    ): Promise<StatsTrend | null> => {
        try {
            const res = await http.get(`stats/trend?metric=${metric}&range=${range}`);
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as StatsTrend) || null;
            return null;
        } catch { return null; }
    };

    const getAssemblyTop = async (limit = 20): Promise<StatsAssemblyTop | null> => {
        try {
            const res = await http.get(`stats/assembly-top?limit=${limit}`);
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as StatsAssemblyTop) || null;
            return null;
        } catch { return null; }
    };

    return { getOverview, getTrend, getAssemblyTop };
}
