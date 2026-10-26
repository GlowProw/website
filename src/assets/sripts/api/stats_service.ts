/**
 * 数据中心统计 API 服务
 * 对应后端 /api/stats/* 路由
 */
import {useHttpToken} from "@/assets/sripts/http_util";
import type {
    StatsAssemblyTop,
    StatsRankingTop,
    StatsOverview,
    StatsRange,
    StatsTrend,
    StatsTrendPoint,
    StatsVisitor,
} from "@/assets/types/Stats";

export function useStatsApi() {
    const http = useHttpToken();

    const getOverview = async (range: StatsRange = '30'): Promise<StatsOverview | null> => {
        try {
            const res = await http.get(`stats/overview?range=${range}`);
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

    const getRankingTop = async (limit = 10): Promise<StatsRankingTop | null> => {
        try {
            const res = await http.get(`stats/ranking-top?limit=${limit}`);
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as StatsRankingTop) || null;
            return null;
        } catch { return null; }
    };

    return { getOverview, getTrend, getAssemblyTop, getRankingTop };
}
