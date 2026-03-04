import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";
import {PaginationParams} from "@/assets/types";

/**
 * 组队
 */
export function useTeamupApi() {
    const http = useHttpToken()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取组队列表
     */
    const getTeamups = async (keyword?: string, pagination?: PaginationParams) => {
        try {
            let params = {
                keyword: keyword,
                ...pagination
            }

            const result = await http.get('teamups', {
                params: Object.fromEntries(
                    Object.entries(params).filter(([_, value]) =>
                        value !== null && value !== undefined && value !== ''
                    )
                )
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取组队列表
     */
    const getTeamupStatistics = async (options: { isUpdateTime: boolean } = {isUpdateTime: true}) => {
        try {
            const result = await http.get('teamup/statistics')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    return {
        getTeamups,
        getTeamupStatistics
    }
}
