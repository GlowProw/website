import {useHttp, useHttpToken} from "@/assets/sripts/http_util";
import {ApiError} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";

import type {
    SubscriptionTier,
    SubscriptionPlans,
    SubscriptionProgress,
    CreateOrderParams,
    MyOrder,
    MyOrdersResult
} from "@/assets/types/Subscription";

export type {
    SubscriptionTier,
    SubscriptionPlans,
    SubscriptionProgress,
    CreateOrderParams,
    MyOrder,
    MyOrdersResult
};

/**
 * 赞助订阅接口
 */
export function useSubscriptionApi() {
    const publicHttp = useHttp()
    const tokenHttp = useHttpToken()
    const {handleError, handleResponse} = createApiBase()

    const unwrap = async (p: Promise<any>) => {
        try {
            const result = await p
            return handleResponse(result).data.data
        } catch (error) {
            if (error instanceof ApiError) throw error
            return handleError(error)
        }
    }

    /**
     * 档位目录与可用支付平台 */
    const getPlans = async (): Promise<SubscriptionPlans> => unwrap(publicHttp.get('subscription/plans'))

    /**
     * 本月赞助目标进度
     **/
    const getProgress = async (): Promise<SubscriptionProgress> => unwrap(publicHttp.get('subscription/progress'))

    /**
     * 核心捐助者榜单
     **/
    const getHall = async (): Promise<any[]> => unwrap(publicHttp.get('subscription/hall'))

    /**
     * 首页核心捐助者
     **/
    const getCoreDonors = async (): Promise<any[]> => unwrap(publicHttp.get('donors/core'))

    /**
     * 当前账户会员身份状态
     **/
    const getMyStatus = async (): Promise<Record<string, { expiryTime: string | null }>> =>
        unwrap(tokenHttp.get('subscription/my-status'))

    /**
     * 我的订单：待支付（含支付截止时间）+ 最近记录
     **/
    const getMyOrders = async (): Promise<MyOrdersResult> =>
        unwrap(tokenHttp.get('subscription/my-orders'))

    /**
     * 用户主动取消待支付订单
     **/
    const cancelOrder = async (orderId: number) => {
        try {
            const result = await tokenHttp.post(`subscription/orders/${orderId}/cancel`, {data: {}})
            return handleResponse(result).data.data as { id: number; status: number }
        } catch (error) {
            if (error instanceof ApiError) throw error
            return handleError(error)
        }
    }

    /**
     * 创建订单，返回平台支付跳转地址
     */
    const createOrder = async (data: CreateOrderParams) => {
        try {
            const result = await tokenHttp.post('subscription/orders/create', {data})
            return handleResponse(result).data.data as {
                customOrderId: string
                orderNo: string | null
                redirectUrl: string
            }
        } catch (error) {
            if (error instanceof ApiError) throw error
            return handleError(error)
        }
    }

    /**
     * 取消 Stripe 订阅：返回 Stripe Billing Portal 跳转地址，
     * 用户在平台侧取消生效后，webhook 自动收回捐助身份
     */
    const createCancelPortal = async () => {
        try {
            const result = await tokenHttp.post('subscription/cancel-portal', {data: {}})
            return handleResponse(result).data.data as { redirectUrl: string }
        } catch (error) {
            if (error instanceof ApiError) throw error
            return handleError(error)
        }
    }

    return {
        getPlans,
        getProgress,
        getHall,
        getCoreDonors,
        getMyStatus,
        getMyOrders,

        cancelOrder,
        createOrder,
        createCancelPortal
    }
}
