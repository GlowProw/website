import {ApiError} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";
import {http} from "@/assets/sripts/index";

/**
 * 验证码接口
 */
export function useBlogApi() {
    const {handleError, handleResponse} = createApiBase();
    const blogBaseUrl = 'https://glow-prow-blog.cabbagelol.net'

    /**
     * 获取当前用户信息
     */
    const blogs = async (options: { isUpdateTime: boolean } = {isUpdateTime: true}) => {
        try {
            const result = await http.request(`${blogBaseUrl}/blog-data.json`, {
                params: {...options.isUpdateTime ? {t: Math.random()} : {}}
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
     * 获取当前用户信息
     */
    const versions = async (options: { isUpdateTime: boolean } = {isUpdateTime: true}) => {
        try {
            const result = await http.request(`${blogBaseUrl}/versions-data.json`, {
                params: {...options.isUpdateTime ? {t: Math.random()} : {}}
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
