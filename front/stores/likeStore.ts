import {defineStore} from 'pinia';
import {http} from "../src/assets/sripts";
import {useHttpToken} from "../src/assets/sripts/httpUtil";
import {useAuthStore} from "./index";

export const useLikeStore = defineStore('like', {
    state: () => ({
        likedTargets: new Map(),
    }),
    actions: {
        /**
         * 检查是否点赞
         * @param userId
         * @param targetType
         * @param targetId
         */
        async checkLike(userId: string, targetType: string, targetId: string) {
            const authStore = useAuthStore()

            if (!authStore.isLogin)
                return ;

            const httpToken = useHttpToken()
            const result = await httpToken.get(`likes/check?userId=${userId}&targetType=${targetType}&targetId=${targetId}`);

            const {isLiked} = result.data;

            if (isLiked) this.likedTargets.set(`${targetType}_${targetId}`, true);
            return isLiked;
        },

        /**
         * 点赞/取消点赞
         * @param userId
         * @param targetType
         * @param targetId
         */
        async toggleLike(userId: string, targetType: string, targetId: string) {
            const authStore = useAuthStore()

            if (!authStore.isLogin)
                return ;

            const httpToken = useHttpToken()
            const result = await httpToken.post('likes/toggle', {
                data: {userId, targetType, targetId},
            });
            const {isLiked} = result.data;

            const key = `${targetType}_${targetId}`;
            if (isLiked) {
                this.likedTargets.set(key, true);
            } else {
                this.likedTargets.delete(key);
            }

            return isLiked;
        },

        /**
         * 获取点赞数
         * @param targetType
         * @param targetId
         */
        async getLikeCount(targetType, targetId) {
            const result = await http.get(`likes/count?targetType=${targetType}&targetId=${targetId}`);
            const {likeCount} = result.data;
            return likeCount;
        },
    },
});
