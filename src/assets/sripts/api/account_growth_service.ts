import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 账户成长：成就 / 等级 / 签到
 */
export function useAccountGrowthApi() {
    const http = useHttpToken()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取成就与等级总览
     */
    const getAchievements = async () => {
        try {
            const result = await http.get('user/account/achievements')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取指定用户的公开成就摘要
     * @param userId 用户 ID
     */
    const getPublicAchievements = async (userId: string) => {
        try {
            const result = await http.get('user/account/achievements/public', {
                params: {id: userId}
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
     * 领取被动成就
     * @param key 成就标识
     */
    const claimAchievement = async (key: string) => {
        try {
            const result = await http.post('user/account/achievements/claim', {
                data: {key}
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
     * 获取签到状态
     */
    const getSigninStatus = async () => {
        try {
            const result = await http.get('user/account/signin')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 今日签到
     */
    const signIn = async () => {
        try {
            const result = await http.post('user/account/signin')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 补签指定日期
     * @param date YYYY-MM-DD
     */
    const makeupSignin = async (date: string) => {
        try {
            const result = await http.post('user/account/signin/makeup', {
                data: {date}
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
     * 获取签到记录
     * @param month YYYY-MM，缺省为当月
     */
    const getSigninRecords = async (month?: string) => {
        try {
            const result = await http.get('user/account/signin/records', {
                params: month ? {month} : {}
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
        getAchievements,
        getPublicAchievements,
        claimAchievement,
        getSigninStatus,
        signIn,
        makeupSignin,
        getSigninRecords,
    };
}
