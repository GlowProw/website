import {useHttpToken} from "@/assets/sripts/http_util";
import {PaginationParams} from "@/assets/types";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 回收站接口
 */
export function useTrashApi() {
    const createHttp = () => useHttpToken()
    const http = createHttp()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取回收站列表
     * @param params
     */
    const getTrashList = async (params?: PaginationParams) => {
        try {
            const result = await http.get(`trash/list`, {params})
            return handleResponse(result)
        } catch (error) {
            return handleError(error)
        }
    };

    /**
     * 恢复组件 (支持批量)
     * @param items
     */
    const restoreItems = async (items: Array<{id?: number | string, uuid?: string, type: string}>) => {
        try {
            const result = await http.post(`trash/restore`, {
                data: {items}
            })
            return handleResponse(result)
        } catch (error) {
            return handleError(error)
        }
    };

    return {
        getTrashList,
        restoreItems,
    };
}
