import {useHttp} from "@/assets/sripts/http_util";
import {ApiError} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * Crowdin 翻译平台接口
 */
export function useCrowdinApi() {
    const http = useHttp()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取项目成员（翻译贡献者）
     * 返回结构与 Crowdin 原始列表一致：[{ data: { id, username, avatarUrl, ... } }]
     */
    const getMembers = async () => {
        try {
            const result = await http.get('crowdin/members')
            const response = handleResponse(result)
            return response.data.data
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    return {
        getMembers
    };
}
