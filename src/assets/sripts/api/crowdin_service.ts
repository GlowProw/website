import {useHttp} from "@/assets/sripts/http_util";
import {ApiError} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";

// 缓存有效期（30分钟）
const CACHE_DURATION = 30 * 60 * 1000;

// 本地存储缓存键
const CROWDIN_MEMBERS_STORAGE_KEY = 'crowdin_members_cache';

// 内存中缓存数据
let memoryCachedMembers: any[] | null = null;

// 内存中缓存过期时间戳
let memoryCacheExpiresAt = 0;

// 请求阀门：正在进行中的请求 Promise
let inFlightPromise: Promise<any[]> | null = null;

/**
 * 读取本地缓存的成员列表
 * @returns 成员列表或 null
 */
const readStoredMembers = (): any[] | null => {
    if (typeof window === 'undefined') return null;
    try {
        const item = window.sessionStorage.getItem(CROWDIN_MEMBERS_STORAGE_KEY);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (parsed && Array.isArray(parsed.data) && Date.now() < parsed.expiresAt) {
            return parsed.data;
        }
    } catch {
        // ignore
    }
    return null;
};

/**
 * 将成员列表写入本地会话缓存
 * @param members 成员列表
 */
const writeStoredMembers = (members: any[]): void => {
    if (typeof window === 'undefined' || !Array.isArray(members)) return;
    try {
        window.sessionStorage.setItem(CROWDIN_MEMBERS_STORAGE_KEY, JSON.stringify({
            data: members,
            expiresAt: Date.now() + CACHE_DURATION,
        }));
    } catch {
        // ignore
    }
};

/**
 * Crowdin 翻译平台接口
 */
export function useCrowdinApi() {
    const http = useHttp();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 获取项目成员（翻译贡献者）
     * 增加请求并发阀门与 30 分钟缓存机制，防止切页面时频繁请求
     * @returns 翻译贡献者列表
     */
    const getMembers = async (): Promise<any[]> => {
        const now = Date.now();

        // 优先检查内存缓存
        if (memoryCachedMembers && memoryCachedMembers.length > 0 && now < memoryCacheExpiresAt) {
            return memoryCachedMembers;
        }

        // 检查 sessionStorage 缓存
        const stored = readStoredMembers();
        if (stored && stored.length > 0) {
            memoryCachedMembers = stored;
            memoryCacheExpiresAt = now + CACHE_DURATION;
            return stored;
        }

        // 请求阀门：复用正在请求中的 Promise
        if (inFlightPromise) {
            return inFlightPromise;
        }

        inFlightPromise = (async () => {
            try {
                const result = await http.get('crowdin/members');
                const response = handleResponse(result);
                const raw = response?.data;
                const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);

                memoryCachedMembers = list;
                memoryCacheExpiresAt = Date.now() + CACHE_DURATION;
                writeStoredMembers(list);

                return list;
            } catch (error) {
                // 如果请求失败但有旧的内存数据，降级返回
                if (memoryCachedMembers) {
                    return memoryCachedMembers;
                }
                if (error instanceof ApiError) {
                    throw error;
                }
                return handleError(error);
            } finally {
                inFlightPromise = null;
            }
        })();

        return inFlightPromise;
    };

    return {
        getMembers,
    };
}
