import type {CreateCollectionData, CreatePointData, CreateShapeData, NearbySearchParams, SharedCollectionInfo, UpdateCollectionData, UpdatePointData, UpdateShapeData, UserShapesParams} from '@/assets/types/Map';
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
     * 获取分享链接中公开地图集的信息（名称、创建者、数量）
     */
    const getSharedCollection = async (collectionUuid: string) => {
        try {
            const result = await http.get(`map/collection/share/${collectionUuid}`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 将公开地图集导入（克隆）到当前用户账户
     */
    const importSharedCollection = async (collectionUuid: string) => {
        try {
            const result = await http.post(`map/collection/share/${collectionUuid}/import`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 克隆自己的地图集（完整复制集合及其全部标记/图形）
     */
    const cloneCollection = async (collectionUuid: string) => {
        try {
            const result = await http.post(`map/collection/${collectionUuid}/clone`)
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
    const getUserPoints = async (params?: PaginationParams & { collectionUuid?: string; keyword?: string }) => {
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

    /* ========================= 图形（路径/区域） ========================= */

    /**
     * 获取当前用户的图形列表（管理页）
     */
    const getUserShapes = async (params?: UserShapesParams) => {
        try {
            const result = await http.get('map/user/shapes', {params})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 获取未分组图形（地图渲染用）
     */
    const getOrphanShapes = async (shapeType?: 'path' | 'region') => {
        try {
            const result = await http.get('map/user/shapes/orphan', {params: {shapeType}})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 获取地图集下的图形（地图渲染用）
     */
    const getCollectionShapes = async (collectionUuid: string, shapeType?: 'path' | 'region') => {
        try {
            const result = await http.get(`map/collections/${collectionUuid}/shapes`, {
                params: {shapeType}
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 获取图形详情
     */
    const getShapeDetail = async (uuid: string) => {
        try {
            const result = await http.get(`map/shape/item/${uuid}`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 创建图形
     */
    const createShape = async (data: CreateShapeData) => {
        try {
            const result = await http.post('map/shape', {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 更新图形
     */
    const updateShape = async (shapeUuid: string, data: UpdateShapeData) => {
        try {
            const result = await http.put(`map/shape/${shapeUuid}`, {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 删除图形
     */
    const deleteShape = async (shapeUuid: string): Promise<void> => {
        try {
            await http.del(`map/shape/${shapeUuid}`)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 批量删除图形
     */
    const batchDeleteShapes = async (uuids: string[]) => {
        try {
            const result = await http.post('map/shapes/batch-delete', {data: {uuids}})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 批量移动图形到地图集（collectionUuid=null 表示移出集合）
     */
    const batchMoveShapes = async (uuids: string[], collectionUuid: string | null) => {
        try {
            const result = await http.post('map/shapes/batch-move', {
                data: {uuids, collectionUuid}
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /* ========================= 标记批量操作 ========================= */

    /**
     * 批量删除标记点
     */
    const batchDeletePoints = async (uuids: string[]) => {
        try {
            const result = await http.post('map/points/batch-delete', {data: {uuids}})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    /**
     * 批量移动标记点到地图集（collectionUuid=null 表示移出集合）
     */
    const batchMovePoints = async (uuids: string[], collectionUuid: string | null) => {
        try {
            const result = await http.post('map/points/batch-move', {
                data: {uuids, collectionUuid}
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    };

    return {
        getCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        getCollectionDetail,
        getSharedCollection,
        importSharedCollection,
        cloneCollection,
        createPoint,
        updatePoint,
        deletePoint,
        getCollectionPoints,
        getNearbyPoints,
        addPointsToCollection,
        removePointsFromCollection,
        getUserPoints,
        getPointDetail,
        getOrphanPoints,
        getUserShapes,
        getOrphanShapes,
        getCollectionShapes,
        getShapeDetail,
        createShape,
        updateShape,
        deleteShape,
        batchDeleteShapes,
        batchMoveShapes,
        batchDeletePoints,
        batchMovePoints,
    }
}
