import {defineStore} from 'pinia'
import {computed, ref, triggerRef, watch} from 'vue'
import {storage, storage_account} from "@/assets/sripts"
import {UserLocalResult} from "@/assets/types/User";

export const useAuthStore = defineStore('account', () => {
    const user = ref<UserLocalResult | null>(null)

    const isAuthenticated = computed(() => !!user.value)
    const isLogin = computed(() => !!user.value?.token)
    const currentUser = computed(() => user.value?.alternativeName || user.value?.username || 'none')

    /**
     * 判断当前用户是否为有效订阅会员（见习海盗至海盗各赞助档位）
     */
    const isSubscriber = computed<boolean>(() => {
        if (!user.value?.token) return false
        const roles = user.value?.role || []
        const privileges = (user.value?.privilege || []) as string[]
        const all = [...roles, ...privileges]
        return all.some(r =>
            ['contributor', 'contributor1', 'contributor2', 'contributor3', 'contributor4', 'contributor5'].includes(r)
        )
    })

    /**
     * 判断当前用户是否具备捐助者或管理特权
     */
    const isDonorOrPrivileged = computed<boolean>(() => {
        if (!user.value?.token) return false
        const roles = user.value?.role || []
        const privileges = (user.value?.privilege || []) as string[]
        const all = [...roles, ...privileges]
        return all.some(r =>
            ['contributor', 'contributor1', 'contributor2', 'contributor3', 'contributor4', 'contributor5', 'root', 'admin', 'super', 'dev'].includes(r)
        )
    })

    // 订阅成功账户自动禁用网站广告
    watch([isSubscriber, isDonorOrPrivileged], ([sub, donor]) => {
        if (sub || donor) {
            try {
                storage_account.updateConfiguration('ad', 'google.switch', false)
            } catch {
                // 静默容错
            }
        }
    }, { immediate: true })

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
        isSubscriber,
        isDonorOrPrivileged,
        currentUser,
        checkPrivilegeGroup,
        updateAccountAttr,
        setAccountToken,
        logout
    }
})
