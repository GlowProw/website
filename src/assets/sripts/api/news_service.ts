import { useHttpToken } from "@/assets/sripts/http_util";
import { createApiBase } from "@/assets/sripts/api/api-util";

export interface NewsItem {
    id: string;
    content: string;
    mediaUrl?: string | null;
    author?: string | null;
    platform: string;
    createdTime: string;
}

export interface NewsQueryParams {
    page?: number;
    limit?: number;
    platform?: string;
}

export interface NewsResponseData {
    list: NewsItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    platform?: string;
}

/**
 * 新闻资讯 API 模块
 */
export function useNewsApi() {
    const http = useHttpToken();
    const { handleError, handleResponse } = createApiBase();

    /**
     * 获取新闻列表（支持分页与平台筛选）
     * @param params 查询参数
     */
    const getNews = async (params?: NewsQueryParams) => {
        try {
            const queryParams: Record<string, any> = {};
            if (params?.page) queryParams.page = params.page;
            if (params?.limit) queryParams.limit = params.limit;
            if (params?.platform && params.platform !== 'all') queryParams.platform = params.platform;

            const res = await http.get('news', { params: queryParams });
            return handleResponse(res);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 根据 ID 获取单条新闻详情
     * @param id 新闻标识
     */
    const getNewsItem = async (id: string) => {
        try {
            const res = await http.get(`news/${id}`);
            return handleResponse(res);
        } catch (error) {
            return handleError(error);
        }
    };

    return {
        getNews,
        getNewsItem,
    };
}

