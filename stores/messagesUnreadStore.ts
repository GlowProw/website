import {defineStore} from 'pinia'
import {ref, watch} from 'vue'
import {useAuthStore} from '~/stores/userAccountStore'
import {useMessagesApi} from '@/assets/sripts/api/messages_service'

/**
 * 未读消息状态机
 */

const POLL_INTERVAL = 30_000

export const useMessagesUnreadStore = defineStore('messagesUnread', () => {
    const authStore = useAuthStore()
    const messagesApi = useMessagesApi()

    const unreadCount = ref(0)
    let timer: ReturnType<typeof setInterval> | null = null
    let inflight: Promise<void> | null = null

    /**
     * 拉取最新未读数
     * 并发调用合并为同一个请求
     */
    const refresh = (): Promise<void> => {
        if (inflight) return inflight
        if (!authStore.isLogin) {
            unreadCount.value = 0
            return Promise.resolve()
        }
        inflight = (async () => {
            try {
                unreadCount.value = await messagesApi.getUnreadCount()
            } catch {
                // 保留上次的值，等下轮轮询
            } finally {
                inflight = null
            }
        })()
        return inflight
    }

    const stop = () => {
        if (timer !== null) {
            clearInterval(timer)
            timer = null
        }
    }

    /**
     * 幂等启动
     **/
    const start = () => {
        if (typeof window === 'undefined') return
        if (timer !== null) return
        void refresh()
        timer = setInterval(refresh, POLL_INTERVAL)
    }

    /**
     * 本地即时状态（socket / 已读操作），轮询负责最终对账
     * @param n
     */
    const setUnread = (n: number) => {
        unreadCount.value = Math.max(0, Math.floor(n) || 0)
    }

    const bump = (n = 1) => {
        unreadCount.value = Math.max(0, unreadCount.value + n)
    }

    const subtract = (n = 1) => {
        unreadCount.value = Math.max(0, unreadCount.value - n)
    }

    const reset = () => {
        unreadCount.value = 0
    }

    /**
     * 登录态驱动：登录即轮询，登出即停并清零（store 首次被使用时生效）
     */
    watch(() => authStore.isLogin, (loggedIn) => {
        if (loggedIn) start()
        else {
            stop()
            reset()
        }
    }, {immediate: true})

    return {unreadCount, refresh, start, stop, setUnread, bump, subtract, reset}
})
