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
            if (accountData.code == 0)
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

    // 立即初始化
    initFromStorage()

    return {
        user,
        isLogin,
        isAuthenticated,
        currentUser,
        checkPrivilegeGroup,
        updateAccountAttr,
        setAccountToken,
        logout
    }
})
