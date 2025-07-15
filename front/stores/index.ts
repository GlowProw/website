import { defineStore } from 'pinia'
import { computed, ref, triggerRef } from 'vue'
import { storage } from "../src/assets/sripts"

export const useAuthStore = defineStore('account', () => {
    // 状态 - 使用更明确的类型定义
    const user = ref<{
        token?: string
        username?: string
        // 其他用户字段...
    } | null>(null)

    // 计算属性
    const isAuthenticated = computed(() => !!user.value)
    const isLogin = computed(() => !!user.value?.token)
    const currentUser = computed(() => user.value?.username || 'none')

    // 初始化
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

    // 设置token
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

    // 登出 - 修复版本
    const logout = () => {
        try {
            storage.local.rem('account')
        } catch (error) {
            console.error('登出时清除存储失败:', error)
        } finally {
            user.value = null
            triggerRef(user) // 强制更新
        }
    }

    // 立即初始化
    initFromStorage()

    return {
        user,
        isLogin,
        isAuthenticated,
        currentUser,
        setAccountToken,
        logout
    }
})
