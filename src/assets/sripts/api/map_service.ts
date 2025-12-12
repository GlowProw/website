import type {CreateCollectionData, CreatePointData, NearbySearchParams, UpdateCollectionData, UpdatePointData} from '@/assets/types/Map';
import {useHttpToken} from "@/assets/sripts/http_util";
import {PaginationParams} from "@/assets/types";
import {ApiError, ApiResponseSuccess} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 地图接口
 */
export function useMapApi() {
    const createHttp = () => useHttpToken()
    const http = createHttp()
    const { handleError, handleResponse } = createApiBase()

    /**
     * 获取用户的地图集列表
     */
    const getCollections = async (pagination?: PaginationParams) => {
        try {
            const result = await http.get('map/collections', {params: {...pagination}})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 创建地图集
     */
    const createCollection = async (data: CreateCollectionData) => {
        try {
            const result = await http.post('map/collection', {
                data
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
     * 更新地图集
     */
    const updateCollection = async (collectionUuid: string, data: UpdateCollectionData) => {
        try {
            const result = await http.put(`map/collection/${collectionUuid}`, {
                data
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
     * 删除地图集
     */
    const deleteCollection = async (collectionUuid: string): Promise<void> => {

        try {
            await http.del(`map/collection/${collectionUuid}`)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取地图集详情
     */
    const getCollectionDetail = async (collectionUuid: string) => {

        try {
            const result = await http.get(`map/collection/${collectionUuid}`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取坐标详情
     */
    const getPointDetail = async (pointUuid: string) => {

        try {
            const result = await http.get(`map/point/${pointUuid}`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 创建坐标点
     */
    const createPoint = async (data: CreatePointData) => {

        try {
            const result = await http.post('map/point', {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 更新坐标点
     */
    const updatePoint = async (pointUuid: string, data: UpdatePointData) => {

        try {
            const result = await http.put(`map/point/${pointUuid}`, {
                data
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
     * 删除坐标点
     */
    const deletePoint = async (pointUuid: string): Promise<void> => {

        try {
            await http.del(`map/point/${pointUuid}`)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取地图集下的所有坐标点
     */
    const getCollectionPoints = async (collectionUuid: string, pagination?: PaginationParams) => {

        try {
            const result = await http.get(`map/collections/${collectionUuid}/points`, {
                params: pagination
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
     * 搜索附近的坐标点
     */
    const getNearbyPoints = async (params: NearbySearchParams) => {

        try {
            const result = await http.get('map/point/nearby', {params})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 将坐标添加到地图集
     */
    const addPointsToCollection = async (collectionUuid: string, pointUuids: string[]) => {

        try {
            const result = await http.post(`map/collection/${collectionUuid}/points`, {
                data: {pointUuids}
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
     * 从地图集中移除坐标
     */
    const removePointsFromCollection = async (collectionUuid: string, pointUuids: string[]) => {

        try {
            const result = await http.del(`map/collection/${collectionUuid}/points`, {
                data: {pointUuids}
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
     * 获取用户的所有坐标点
     */
    const getUserPoints = async (params?: PaginationParams & { collectionUuid?: string }) => {
        try {
            const result = await http.get('map/user/points', {params})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取孤儿坐标点（没有地图集的坐标）
     */
    const getOrphanPoints = async (params?: PaginationParams) => {

        try {
            const result = await http.get('map/user/orphan-points', {params})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    return {
        getCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        getCollectionDetail,
        createPoint,
        updatePoint,
        deletePoint,
        getCollectionPoints,
        getNearbyPoints,
        addPointsToCollection,
        removePointsFromCollection,
        getUserPoints,
        getOrphanPoints,
    }
}
