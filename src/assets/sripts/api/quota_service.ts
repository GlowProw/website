import {useHttpToken} from "@/assets/sripts/http_util";
import {ApiError} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";
import {storage} from "@/assets/sripts";
import {useAuthStore} from "~/stores/userAccountStore";

/** 额度资源类型：配装 / 评论（含回复）/ 组队 / 地图（集合、区域、路径） */
export type QuotaResourceKey = 'assembly' | 'comment' | 'teamup' | 'map';

/** 单个周期桶：已用数量与上限（null 表示不限） */
export interface QuotaBucket {
    used: number
    limit: number | null
}

export interface QuotaStatusItem {
    monthly: QuotaBucket
    yearly: QuotaBucket
}

export interface QuotaStatus {
    identity: {
        roles: string[]
        /** 生效中的赞助档位：5/10/50/100 或 null */
        tier: string | null
        multiplier: number
        unlimited: boolean
    }
    resources: Partial<Record<QuotaResourceKey, QuotaStatusItem>>
}

/** sessionStorage 缓存键名（按账号隔离） */
const QUOTA_CACHE_KEY = 'quota.status';
/** 缓存有效期 60 秒：展开面板等重复读取直接走缓存，减少接口请求 */
const QUOTA_CACHE_TTL_MS = 60_000;

interface QuotaCachePayload {
    userId: string | null
    fetchedAt: number
    status: QuotaStatus
}

/** 读取当前账号的会话缓存（校验账号一致与有效期） */
const readQuotaCache = (userId: string | null): QuotaStatus | null => {
    try {
        const result = storage.session.get(QUOTA_CACHE_KEY);
        if (result?.code !== 0 || !result.data?.value) return null;
        const payload = result.data.value as QuotaCachePayload;
        if (payload.userId !== userId) return null;
        if (Date.now() - payload.fetchedAt > QUOTA_CACHE_TTL_MS) return null;
        return payload.status || null;
    } catch {
        return null;
    }
};

/** 写入当前账号的会话缓存 */
const writeQuotaCache = (userId: string | null, status: QuotaStatus): void => {
    try {
        const payload: QuotaCachePayload = { userId, fetchedAt: Date.now(), status };
        storage.session.set(QUOTA_CACHE_KEY, payload);
    } catch {
        // sessionStorage 不可用（隐私模式/配额限制）时静默降级为每次请求
    }
};

/**
 * 发布额度接口
 */
export function useQuotaApi() {
    const http = useHttpToken()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取当前登录用户四类资源的月/年用量与上限
     * @param force true 时绕过会话缓存强制请求（默认优先读 60 秒内缓存）
     */
    const getQuotaStatus = async (force = false): Promise<QuotaStatus> => {
        const authStore = useAuthStore();
        const userId = authStore.user?.userId ?? null;

        if (!force) {
            const cached = readQuotaCache(userId);
            if (cached) return cached;
        }

        try {
            const result = await http.get('quota')
            // handleResponse 返回 { code, data: 完整响应体 }，真实额度数据在响应体的 data 字段
            const wrapped = handleResponse(result) as unknown as { data: any };
            const body = wrapped?.data;
            const status = (body && typeof body === 'object' && 'identity' in body
                ? body
                : body?.data) as QuotaStatus;
            if (!status || !status.identity) {
                throw new ApiError('Invalid quota response', 'quota.badResponse', 1, result);
            }
            writeQuotaCache(userId, status);
            return status;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error
            }
            return handleError(error)
        }
    }

    return {
        getQuotaStatus,
    }
}
