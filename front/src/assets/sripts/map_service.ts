import type {CreateCollectionData, CreatePointData, NearbySearchParams, PaginationParams, UpdateCollectionData, UpdatePointData} from '@/assets/types/map';
import {useHttpToken} from "@/assets/sripts/http_util";

const createHttp = () => useHttpToken();

/**
 * 统一错误处理
 */
const handleError = (error: any, operation: string): never => {
    console.error(`Map-${operation}-error:`, error);
    throw error;
};

/**
 * 获取用户的地图集列表
 */
export const getCollections = async (pagination: PaginationParams) => {
    const http = createHttp();
    try {
        const result = await http.get('map/collections', {params: pagination});
        return result.data;
    } catch (error) {
        return handleError(error, '获取地图集列表');
    }
};

/**
 * 创建地图集
 */
export const createCollection = async (data: CreateCollectionData) => {
    const http = createHttp();
    try {
        const result = await http.post('map/collection', data);
        return result.data;
    } catch (error) {
        return handleError(error, '创建地图集');
    }
};

/**
 * 更新地图集
 */
export const updateCollection = async (collectionUuid: string, data: UpdateCollectionData) => {
    const http = createHttp();
    try {
        const result = await http.put(`map/collection/${collectionUuid}`, data);
        return result.data;
    } catch (error) {
        return handleError(error, '更新地图集');
    }
};

/**
 * 删除地图集
 */
export const deleteCollection = async (collectionUuid: string): Promise<void> => {
    const http = createHttp();
    try {
        await http.del(`map/collection/${collectionUuid}`);
    } catch (error) {
        return handleError(error, '删除地图集');
    }
};

/**
 * 获取地图集详情
 */
export const getCollectionDetail = async (collectionUuid: string) => {
    const http = createHttp();
    try {
        const result = await http.get(`map/collection/${collectionUuid}`);
        return result.data;
    } catch (error) {
        return handleError(error, '获取地图集详情');
    }
};

/**
 * 获取坐标详情
 */
export const getPointDetail = async (pointUuid: string) => {
    const http = createHttp();
    try {
        const result = await http.get(`map/point/${pointUuid}`);
        return result.data;
    } catch (error) {
        return handleError(error, '获取坐标详情');
    }
};

/**
 * 创建坐标点
 */
export const createPoint = async (data: CreatePointData) => {
    const http = createHttp();
    try {
        const result = await http.post('map/point', {data});
        return result.data;
    } catch (error) {
        return handleError(error, '创建坐标点');
    }
};

/**
 * 更新坐标点
 */
export const updatePoint = async (pointUuid: string, data: UpdatePointData) => {
    const http = createHttp();
    try {
        const result = await http.put(`map/point/${pointUuid}`, data);
        return result.data;
    } catch (error) {
        return handleError(error, '更新坐标点');
    }
};

/**
 * 删除坐标点
 */
export const deletePoint = async (pointUuid: string): Promise<void> => {
    const http = createHttp();
    try {
        await http.del(`map/point/${pointUuid}`);
    } catch (error) {
        return handleError(error, '删除坐标点');
    }
};

/**
 * 获取地图集下的所有坐标点
 */
export const getCollectionPoints = async (collectionUuid: string, pagination?: PaginationParams) => {
    const http = createHttp();
    try {
        const result = await http.get(`map/collections/${collectionUuid}/points`, {
            params: pagination
        });
        return result.data;
    } catch (error) {
        return handleError(error, '获取坐标点列表');
    }
};

/**
 * 搜索附近的坐标点
 */
export const getNearbyPoints = async (params: NearbySearchParams) => {
    const http = createHttp();
    try {
        const result = await http.get('map/point/nearby', {params});
        return result.data;
    } catch (error) {
        return handleError(error, '搜索附近坐标');
    }
};

/**
 * 将坐标添加到地图集
 */
export const addPointsToCollection = async (collectionUuid: string, pointUuids: string[]) => {
    const http = createHttp();
    try {
        const result = await http.post(`map/collection/${collectionUuid}/points`, {
            data: {pointUuids}
        });
        return result.data;
    } catch (error) {
        return handleError(error, '添加坐标到地图集');
    }
};

/**
 * 从地图集中移除坐标
 */
export const removePointsFromCollection = async (collectionUuid: string, pointUuids: string[]) => {
    const http = createHttp();
    try {
        const result = await http.del(`map/collection/${collectionUuid}/points`, {
            data: {pointUuids}
        });
        return result.data;
    } catch (error) {
        return handleError(error, '从地图集移除坐标');
    }
};

/**
 * 获取用户的所有坐标点
 */
export const getUserPoints = async (params?: PaginationParams & { collectionUuid?: string }) => {
    const http = createHttp();
    try {
        const result = await http.get('map/user/points', {params});
        return result.data;
    } catch (error) {
        return handleError(error, '获取用户坐标点列表');
    }
};

/**
 * 获取孤儿坐标点（没有地图集的坐标）
 */
export const getOrphanPoints = async (params?: PaginationParams) => {
    const http = createHttp();
    try {
        const result = await http.get('map/user/orphan-points', {params});
        return result.data;
    } catch (error) {
        return handleError(error, '获取孤儿坐标点列表');
    }
};
