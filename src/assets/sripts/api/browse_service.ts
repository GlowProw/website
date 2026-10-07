import {useHttp} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 浏览记录 & 访客 API
 */
export function useBrowseApi() {
    const createHttp = () => useHttp()
    const http = createHttp()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取某 item 的浏览总数（累计 + 今日）
     */
    const getBrowseCount = async (itemType: string, itemId: string) => {
        try {
            const result = await http.get('browse/count', {
                params: { itemType, itemId }
            })
            const d = result.data;
            if (d.error === 1) return { total: 0, today: 0 };
            return { total: Number(d.total || 0), today: Number(d.today || 0) };
        } catch {
            return { total: 0, today: 0 };
        }
    };

    /**
     * 获取某 item 的近期访客列表
     */
    const getVisitors = async (itemType: string, itemId: string, limit = 20) => {
        try {
            const result = await http.get('browse/visitors', {
                params: { itemType, itemId, limit }
            });
            const d = result.data;
            if (d.error === 1) return [];
            return d.visitors || [];
        } catch {
            return [];
        }
    };

    /**
     * 手动记录一次浏览
     */
    const recordBrowse = async (itemType: string, itemId: string, extra?: string) => {
        try {
            await http.post('browse/record', { data: { itemType, itemId, extra } });
        } catch { /* ignore */ }
    };

    /**
     * 获取今日 PV/UV/热度
     */
    const getStats = async (itemType: string, itemId: string) => {
        try {
            const result = await http.get('browse/stats', {
                params: { itemType, itemId }
            });
            const d = result.data;
            if (d.error === 1) return { pv: 0, uv: 0, hot: 0 };
            return d.stats || { pv: 0, uv: 0, hot: 0 };
        } catch {
            return { pv: 0, uv: 0, hot: 0 };
        }
    };

    return {
        getBrowseCount,
        getVisitors,
        recordBrowse,
        getStats,
        handleError,
        handleResponse,
    }
}
