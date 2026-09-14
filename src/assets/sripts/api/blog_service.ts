import { ApiError } from "@/assets/types/Api";
import { createApiBase } from "@/assets/sripts/api/api-util";
import { useHttp } from "../http_util";

/**
 * 博客与版本更新接口
 */
export function useBlogApi() {
    const http = useHttp({ isExternal: true });
    const { handleError, handleResponse } = createApiBase();
    const blogBaseUrl = 'https://glow-prow-blog.cabbagelol.net';

    /**
     * 获取博客数据
     */
    const blogs = async (options: { isUpdateTime?: boolean } = { isUpdateTime: true }) => {
        try {
            const result = await http.request(`${blogBaseUrl}/blog-data.json`, {
                params: { ...options.isUpdateTime ? { t: Math.random() } : {} }
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
     * 获取版本更新数据
     */
    const versions = async (options: { isUpdateTime?: boolean } = { isUpdateTime: true }) => {
        try {
            const result = await http.request(`${blogBaseUrl}/versions-data.json`, {
                params: { ...options.isUpdateTime ? { t: Math.random() } : {} }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    return {
        blogs,
        versions,
        blogBaseUrl
    }
}
