import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";
import {PaginationParams} from "@/assets/types";

export interface TeamupItem {
    id: number | string;
    player: string;
    description: string;
    tags: string[];
    expiresAt: number;
    createdAt: number;
    username?: string | null;
    userId?: string | null;
}

export interface TeamupListParams extends PaginationParams {
    keyword?: string;
    sortBy?: 'recent' | 'expires' | string;
    page?: number;
    limit?: number;
}

export interface CreateTeamupParams {
    player: string;
    description: string;
    expiresMinutesAt?: number;
    tags?: string[];
    fingerprint?: string;
}

export interface TeamupListResponse {
    success: number;
    code: string;
    data: TeamupItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * 组队 API 模块
 */
export function useTeamupApi() {
    const http = useHttpToken();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 获取组队列表
     */
    const getTeamups = async (
        paramsOrKeyword?: TeamupListParams | string,
        sortBy?: string,
        pagination?: PaginationParams
    ) => {
        try {
            let queryParams: Record<string, any> = {};

            if (typeof paramsOrKeyword === 'object' && paramsOrKeyword !== null) {
                queryParams = { ...paramsOrKeyword };
            } else {
                queryParams = {
                    keyword: paramsOrKeyword,
                    sortBy: sortBy,
                    ...pagination
                };
            }

            const cleanedParams = Object.fromEntries(
                Object.entries(queryParams).filter(([_, value]) =>
                    value !== null && value !== undefined && value !== ''
                )
            );

            const result = await http.get('teamups', { params: cleanedParams });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 发布组队信息 (HTTP REST)
     */
    const createTeamup = async (data: CreateTeamupParams) => {
        try {
            const result = await http.post('teamup', { data });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 取消/删除组队信息 (HTTP REST)
     */
    const deleteTeamup = async (id: string | number) => {
        try {
            const result = await http.del(`teamup/${id}`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取组队统计数据
     */
    const getTeamupStatistics = async (options: { isUpdateTime: boolean } = {isUpdateTime: true}) => {
        try {
            const result = await http.get('teamup/statistics');
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    return {
        getTeamups,
        createTeamup,
        deleteTeamup,
        getTeamupStatistics
    };
}
