import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 精通方案接口
 * 对应后端 /api/mastery 路由
 */
export function useMasteryApi() {
    const createHttp = () => useHttpToken()
    const http = createHttp()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取精通方案详情
     * @param masteryUuid masterys.uuid
     * @param options
     */
    const getMasteryItem = async (masteryUuid: string, options?: {
        force?: boolean
    }) => {
        try {
            const result = await http.get(`mastery/item`, {
                params: {
                    uuid: masteryUuid,
                    force: options?.force
                }
            })
            return handleResponse(result)
        } catch (error) {
            return handleError(error)
        }
    };

    return {
        getMasteryItem,
    };
}
