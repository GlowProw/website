/**
 * 额度配额相关类型
 */

/**
 * 额度资源类型：配装 / 评论（含回复）/ 组队 / 地图（集合、区域、路径）/ 别名修改
 */
export type QuotaResourceKey = 'assembly' | 'comment' | 'teamup' | 'map' | 'media' | 'alias';

/**
 * 单个周期桶：已用数量与上限（null 表示不限）
 */
export interface QuotaBucket {
    used: number
    limit: number | null
}

export interface QuotaStatusItem {
    monthly: QuotaBucket
    yearly: QuotaBucket
    /**
     * 自然季度桶，仅别名修改使用
     */
    quarterly?: QuotaBucket
}

import type { MediaQuotaDetail } from '@/assets/sripts/api/media_service';

export interface QuotaStatus {
    identity: {
        roles: string[]
        /**
         * 生效中的赞助档位：5/10/50/100 或 null
         */
        tier: string | null
        multiplier: number
        unlimited: boolean
    }
    resources: Partial<Record<QuotaResourceKey, QuotaStatusItem>>
    mediaDetails?: MediaQuotaDetail
}

/**
 * 额度状态在 sessionStorage 里的缓存载体
 */
export interface QuotaCachePayload {
    userId: string | null
    fetchedAt: number
    status: QuotaStatus
}
