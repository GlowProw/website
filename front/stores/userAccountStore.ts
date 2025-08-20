import {defineStore} from 'pinia'
import {computed, ref, triggerRef} from 'vue'
import {storage} from "@/assets/sripts"

export const useAuthStore = defineStore('account', () => {
    const user = ref<{
        token: string
        userId: string
        privilege: string[]
        userAvatar?: string
        username?: string
        alternativeName?: string
    } | null>(null)

    const isAuthenticated = computed(() => !!user.value)
    const isLogin = computed(() => !!user.value?.token)
    const currentUser = computed(() => user.value?.alternativeName || user.value?.username || 'none')

    /**
     * 初始化
     */
    const initFromStorage = () => {
        try {
            const storedData = storage.local.get('account')
            if (storedData?.code === 0) { // 添加可选链
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
    const setAccountToken = (data) => {
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
     * 设置token
     * @param data
     */
    const updateAccountAttr = (data: {} = {}) => {
        try {
            let accountData = storage.local.get('account')
            delete data.token
            if (accountData.code == 0)
                user.value = Object.assign(accountData.data.value, user.value,data)
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
        } catch (error) {
            console.error('登出时清除存储失败:', error)
        } finally {
            user.value = null
            triggerRef(user)
        }
    }

    // 立即初始化
    initFromStorage()

    return {
        user,
        isLogin,
        isAuthenticated,
        currentUser,
        updateAccountAttr,
        setAccountToken,
        logout
    }
})
