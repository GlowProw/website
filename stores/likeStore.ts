import {defineStore} from 'pinia';
import {http} from "@/assets/sripts/index";
import {useHttpToken} from "@/assets/sripts/http_util";
import {useAuthStore} from "./userAccountStore";

// 前端缓存时长（30分钟）
const CACHE_DURATION = 30 * 60 * 1000;

// 是否已点赞状态缓存
const checkLikeCache = new Map<string, { isLiked: boolean; expiresAt: number }>();

// 点赞数量缓存
const likeCountCache = new Map<string, { count: number; expiresAt: number }>();

// 进行中的点赞状态请求队列（请求阀门去重）
const inFlightCheckRequests = new Map<string, Promise<boolean>>();

// 进行中的点赞计数请求队列（请求阀门去重）
const inFlightCountRequests = new Map<string, Promise<number>>();

/**
 * 点赞状态机
 */
export const useLikeStore = defineStore('like', {
    state: () => ({
        likedTargets: new Map<string, boolean>(),
    }),
    actions: {
        /**
         * 检查当前用户是否已点赞（含请求阀门与30分钟本地缓存）
         * @param targetType 目标类型
         * @param targetId 目标唯一标识
         * @returns 是否已点赞
         */
        async checkLike(targetType: string, targetId: string): Promise<boolean> {
            const authStore = useAuthStore();

            if (!authStore.isLogin || !targetType || !targetId) {
                return false;
            }

            const key = `${targetType}_${targetId}`;
            const now = Date.now();

            // 命中有效缓存直接返回
            const cached = checkLikeCache.get(key);
            if (cached && now < cached.expiresAt) {
                if (cached.isLiked) {
                    this.likedTargets.set(key, true);
                }
                return cached.isLiked;
            }

            // 请求阀门：复用正在请求中的 Promise
            if (inFlightCheckRequests.has(key)) {
                return inFlightCheckRequests.get(key)!;
            }

            const requestPromise = (async () => {
                try {
                    const httpToken = useHttpToken();
                    const result = await httpToken.get(`likes/check?targetType=${targetType}&targetId=${targetId}`);
                    const isLiked = Boolean(result.data?.isLiked);

                    // 写入 30 分钟缓存
                    checkLikeCache.set(key, {
                        isLiked,
                        expiresAt: Date.now() + CACHE_DURATION,
                    });

                    if (isLiked) {
                        this.likedTargets.set(key, true);
                    } else {
                        this.likedTargets.delete(key);
                    }

                    return isLiked;
                } catch (error) {
                    // 出错时如果旧缓存存在则宽容降级返回
                    if (cached) return cached.isLiked;
                    return false;
                } finally {
                    inFlightCheckRequests.delete(key);
                }
            })();

            inFlightCheckRequests.set(key, requestPromise);
            return requestPromise;
        },

        /**
         * 点赞或取消点赞，并同步更新状态与计数缓存
         * @param userId 操作用户ID
         * @param targetType 目标类型
         * @param targetId 目标唯一标识
         * @returns 操作后点赞状态
         */
        async toggleLike(userId: string, targetType: string, targetId: string): Promise<boolean> {
            const authStore = useAuthStore();

            if (!authStore.isLogin || !targetType || !targetId) {
                return false;
            }

            const httpToken = useHttpToken();
            const result = await httpToken.post('likes/toggle', {
                data: {userId, targetType, targetId},
            });
            const isLiked = Boolean(result.data?.isLiked);
            const key = `${targetType}_${targetId}`;

            // 即时更新状态缓存
            checkLikeCache.set(key, {
                isLiked,
                expiresAt: Date.now() + CACHE_DURATION,
            });

            if (isLiked) {
                this.likedTargets.set(key, true);
            } else {
                this.likedTargets.delete(key);
            }

            // 同步调整点赞数量缓存
            const countCached = likeCountCache.get(key);
            if (countCached) {
                const nextCount = isLiked
                    ? countCached.count + 1
                    : Math.max(0, countCached.count - 1);
                likeCountCache.set(key, {
                    count: nextCount,
                    expiresAt: Date.now() + CACHE_DURATION,
                });
            }

            return isLiked;
        },

        /**
         * 获取目标点赞总数（含请求阀门与30分钟本地缓存）
         * @param targetType 目标类型
         * @param targetId 目标唯一标识
         * @returns 点赞总数
         */
        async getLikeCount(targetType: any, targetId: any): Promise<number> {
            if (!targetType || !targetId) {
                return 0;
            }

            const key = `${targetType}_${targetId}`;
            const now = Date.now();

            // 命中有效缓存直接返回
            const cached = likeCountCache.get(key);
            if (cached && now < cached.expiresAt) {
                return cached.count;
            }

            // 请求阀门：复用正在请求中的 Promise
            if (inFlightCountRequests.has(key)) {
                return inFlightCountRequests.get(key)!;
            }

            const requestPromise = (async () => {
                try {
                    const result = await http.get(`likes/count?targetType=${targetType}&targetId=${targetId}`);
                    const likeCount = Number(result.data?.likeCount) || 0;

                    // 写入 30 分钟缓存
                    likeCountCache.set(key, {
                        count: likeCount,
                        expiresAt: Date.now() + CACHE_DURATION,
                    });

                    return likeCount;
                } catch (error) {
                    if (cached) return cached.count;
                    return 0;
                } finally {
                    inFlightCountRequests.delete(key);
                }
            })();

            inFlightCountRequests.set(key, requestPromise);
            return requestPromise;
        },

        /**
         * 清理指定目标或全部点赞缓存
         * @param targetType 可选目标类型
         * @param targetId 可选目标标识
         */
        clearCache(targetType?: string, targetId?: string) {
            if (targetType && targetId) {
                const key = `${targetType}_${targetId}`;
                checkLikeCache.delete(key);
                likeCountCache.delete(key);
            } else {
                checkLikeCache.clear();
                likeCountCache.clear();
            }
        },
    },
});
