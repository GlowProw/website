import {useHttpToken} from "@/assets/sripts/http_util";
import {ApiError} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";
import type {ZoneWarStat, RegionWarStat, StateOfWarData} from "@/assets/types/StateOfWar";

export type {ZoneWarStat, RegionWarStat, StateOfWarData};

/**
 * 战事状态接口
 */
export function useStateOfWarApi() {
    const createHttp = () => useHttpToken()
    const http = createHttp()
    const { handleError, handleResponse } = createApiBase()

    /**
     * 获取最新的战事状态数据
     */
    const getLatestStateOfWar = async () => {
        try {
            const result = await http.get('stateOfWar/latest')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取特定赛季的战事状态数据 (支持赛季 ID 或数字)
     */
    const getSeasonStateOfWar = async (season: string | number) => {
        try {
            const result = await http.get(`stateOfWar/season/${season}`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取可用赛季列表
     */
    const getAvailableSeasons = async () => {
        try {
            const result = await http.get('stateOfWar/seasons')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 手动刷新战事状态数据 (管理员限定)
     */
    const refreshStateOfWar = async () => {
        try {
            const result = await http.post('stateOfWar/refresh')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取历史战事发展历程数据 (支持 1h / 1d)
     */
    const getStateOfWarHistory = async (range: '1h' | '1d' = '1d', season?: string | number) => {
        try {
            const result = await http.get('stateOfWar/history', {
                params: { range, ...(season ? { season } : {}) }
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
        getLatestStateOfWar,
        getSeasonStateOfWar,
        getAvailableSeasons,
        getStateOfWarHistory,
        refreshStateOfWar
    }
}
