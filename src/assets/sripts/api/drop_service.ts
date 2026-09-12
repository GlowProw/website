import {ApiError} from "@/assets/types/Api";
import {useHttp} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * Twitch 掉宝服务
 */
export function useDropApi() {
    const http = useHttp();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 获取当前正在生效的掉宝列表
     * @param refresh 是否强制刷新
     */
    const getCurrent = async (refresh = false) => {
        try {
            const result = await http.get('drop/current', {
                params: {
                    refresh: refresh ? 1 : undefined
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取掉宝历史档案
     * @param params 过滤参数
     */
    const getHistory = async (params: {
        page?: number;
        pageSize?: number;
        status?: string;
        keyword?: string;
    } = {}) => {
        try {
            const result = await http.get('drop/history', {
                params
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取单个掉宝活动详情
     * @param id 活动 ID 或 campaignId
     */
    const getDetail = async (id: string | number) => {
        try {
            const result = await http.get(`drop/${id}`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    return {
        getCurrent,
        getHistory,
        getDetail
    };
}
