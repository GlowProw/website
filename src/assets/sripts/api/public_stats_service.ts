/**
 * 全站公开统计（事态）API 服务
 * 对应后端 /api/public/stats/* 路由
 */
import {useHttpToken} from "@/assets/sripts/http_util";
import type {
    PublicCodexItemStats,
    PublicCodexStats,
    PublicSeasonItems,
    PublicSeasonStats,
    PublicSigninStats,
    PublicStatsRange,
} from "@/assets/types/Statistics";

export function usePublicStatsApi() {
    const http = useHttpToken();

    /**
     * 赛季图鉴统计
     */
    const getSeason = async (): Promise<PublicSeasonStats | null> => {
        try {
            const res = await http.get('public/stats/season');
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as PublicSeasonStats) || null;
            return null;
        } catch {
            return null;
        }
    };

    /**
     * 图鉴收藏统计
     * @param range 统计区间
     */
    const getCodex = async (range: PublicStatsRange = '30'): Promise<PublicCodexStats | null> => {
        try {
            const res = await http.get(`public/stats/codex?range=${range}`);
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as PublicCodexStats) || null;
            return null;
        } catch {
            return null;
        }
    };

    /**
     * 签到统计
     * @param range 统计区间
     */
    const getSignin = async (range: PublicStatsRange = '30'): Promise<PublicSigninStats | null> => {
        try {
            const res = await http.get(`public/stats/signin?range=${range}`);
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as PublicSigninStats) || null;
            return null;
        } catch {
            return null;
        }
    };

    /**
     * 单个图鉴条目的全站取得统计
     * @param targetType 图鉴类型
     * @param targetId 图鉴条目 ID
     */
    const getCodexItem = async (targetType: string, targetId: string): Promise<PublicCodexItemStats | null> => {
        try {
            const res = await http.get(`public/stats/codex/item?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`);
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as PublicCodexItemStats) || null;
            return null;
        } catch {
            return null;
        }
    };

    /**
     * 某赛季的可收集条目，按图鉴类型分组
     * @param season 赛季标识
     */
    const getSeasonItems = async (season: string): Promise<PublicSeasonItems | null> => {
        try {
            const res = await http.get(`public/stats/season/${encodeURIComponent(season)}/items`);
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as PublicSeasonItems) || null;
            return null;
        } catch {
            return null;
        }
    };

    return {getSeason, getSeasonItems, getCodex, getCodexItem, getSignin};
}
