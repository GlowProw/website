import {defineStore} from 'pinia'
import {computed, ref, triggerRef} from 'vue'
import {storage} from "@/assets/sripts"
import {UserLocalResult} from "@/assets/types/User";

export const useAuthStore = defineStore('account', () => {
    const user = ref<UserLocalResult | null>(null)

    const isAuthenticated = computed(() => !!user.value)
    const isLogin = computed(() => !!user.value?.token)
    const currentUser = computed(() => user.value?.alternativeName || user.value?.username || 'none')

    /**
     * 初始化
     */
    const initFromStorage = () => {
        try {
            const storedData = storage.local.get('account')
            if (storedData?.code === 0) {
                user.value = storedData.data?.value || null
            }
        } catch (error) {
            console.error('初始化存储失败:', error)
        }
    }

    /**
     * 设置token
     * @param data
     */
    const setAccountToken = (data: any) => {
        try {
            user.value = data
            storage.local.set('account', data)
            return true
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    /**
     * 设置令牌
     * @param data
     */
    const updateAccountAttr = (data: any | {} = {}) => {
        try {
            let accountData = storage.local.get('account')
            delete data?.token
            if (accountData?.code == 0 && accountData.data?.value)
                user.value = Object.assign(accountData.data.value, user.value, data)
            storage.local.set('account', user.value)
            return true
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    /**
     * 登出
     */
    const logout = () => {
        try {
            storage.local.rem('account')
            // 同步清掉按账号隔离的额度会话缓存，避免换号后读到上一个账号的额度
            storage.session.rem('quota.status')
        } catch (error) {
            console.error('登出时清除存储失败:', error)
        } finally {
            user.value = null
            triggerRef(user)
        }
    }

    /**
     * 检查权限组
     * @param currentPrivilegeGroup
     * @param {Array} targetPrivilegeGroup 检查是否包含的身份
     * @returns {boolean}
     */
    const checkPrivilegeGroup = (currentPrivilegeGroup: Array<any> = [], targetPrivilegeGroup: Array<any> = ['root', 'admin', 'super', 'dev']): boolean => {
        let isBool = false;
        const privilege = currentPrivilegeGroup;
        if (!privilege) return false;
        for (const i of targetPrivilegeGroup) {
            for (const j of privilege) {
                if (j === i) isBool = true;
            }
        }
        return Boolean(isBool);
    }

    const accountProfile = ref<any>(null)
    const profileLoading = ref<boolean>(false)
    let pendingProfilePromise: Promise<any> | null = null

    /**
     * 统一获取用户个人资料
     * 自动合并并发请求并做状态机缓存，避免路由守卫与视图组件重复发起多次网络请求
     * @param force 是否强制跳过缓存重新请求
     */
    const fetchAccountProfile = async (force = false): Promise<any> => {
        // 未登录则直接返回 null
        if (!user.value?.token) {
            accountProfile.value = null
            return null
        }

        // 非强制模式下，若已有缓存直接复用
        if (!force && accountProfile.value) {
            return accountProfile.value
        }

        // 若已有在途请求，直接复用同一个 Promise 避免重复并发
        if (pendingProfilePromise) {
            return pendingProfilePromise
        }

        profileLoading.value = true
        pendingProfilePromise = (async () => {
            try {
                const { apis } = await import('@/assets/sripts')
                const result = await apis.userApi().getMe()
                const profile = result?.data?.data || result?.data || null
                accountProfile.value = profile
                if (result?.data) {
                    updateAccountAttr(result.data)
                }
                return profile
            } catch (error) {
                console.error('Failed to fetch account profile:', error)
                throw error
            } finally {
                profileLoading.value = false
                pendingProfilePromise = null
            }
        })()

        return pendingProfilePromise
    }

    /**
     * 手动更新个人资料状态机缓存
     * @param data 局部更新的数据
     */
    const setAccountProfile = (data: any) => {
        if (!accountProfile.value) {
            accountProfile.value = data
        } else {
            accountProfile.value = { ...accountProfile.value, ...data }
        }
    }

    // 立即初始化
    initFromStorage()

    return {
        user,
        accountProfile,
        profileLoading,
        fetchAccountProfile,
        setAccountProfile,
        isLogin,
        isAuthenticated,
        currentUser,
        checkPrivilegeGroup,
        updateAccountAttr,
        setAccountToken,
        logout
    }
})
