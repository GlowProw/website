import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";
import type {CollectionState} from "@/assets/types/Achievement";

/**
 * 已取得收藏
 * 接口按 targetType / targetId 通用化，可复用于任意实体
 */
export function useCollectionApi() {
    const http = useHttpToken()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 设置或取消已取得
     * @param targetType 目标类型
     * @param targetId 目标ID
     * @param collected 是否已取得
     */
    const setCollection = async (targetType: string, targetId: string, collected: boolean) => {
        try {
            const result = await http.post('collection', {
                data: {targetType, targetId, collected}
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
     * 批量设置已取得
     * @param targetType 目标类型
     * @param targetIds 目标ID列表
     * @param collected 是否已取得
     */
    const setCollectionBatch = async (targetType: string, targetIds: string[], collected: boolean) => {
        try {
            const result = await http.post('collection/batch', {
                data: {targetType, targetIds, collected}
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
     * 查询已取得状态
     * @param targetType 目标类型
     * @param targetId 目标ID
     */
    const getCollectionStatus = async (targetType: string, targetId: string) => {
        try {
            const result = await http.get('collection/status', {
                params: {targetType, targetId}
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
     * 批量查询已取得状态
     * @param targetType 目标类型
     * @param targetIds 目标ID列表
     */
    const getCollectionStatuses = async (targetType: string, targetIds: string[]) => {
        try {
            const result = await http.get('collection/statuses', {
                params: {targetType, targetIds: targetIds.join(',')}
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
     * 统计已取得数量
     * @param targetType 目标类型
     */
    const getCollectionCount = async (targetType: string) => {
        try {
            const result = await http.get('collection/count', {
                params: {targetType}
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
     * 获取收藏统计原始数据
     * @param targetType 目标类型
     */
    const getCollectionStats = async (targetType: string) => {
        try {
            const result = await http.get('collection/stats', {
                params: {targetType}
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    return {
        setCollection,
        setCollectionBatch,
        getCollectionStatus,
        getCollectionStatuses,
        getCollectionCount,
        getCollectionStats,
    };
}

export type {CollectionState};
