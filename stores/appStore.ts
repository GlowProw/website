import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {storage_account} from "@/assets/sripts/index";

const CONFIG_KEYS = {
    OPEN_NEW_WINDOW: 'openNewWindow',
    ICON_SIZE: 'iconSize',
    THEME: 'theme',
    LANGUAGE: 'language',
    SIDEBAR_COLLAPSED: 'sidebarCollapsed'
} as const

export const useAppStore = defineStore('app', () => {
    // 是否在新窗口打开项目
    const itemOpenNewWindow = ref(false)

    // 图标大小
    const iconSize = ref({
        icon: 99,
        margin: 1,
        padding: 1,
    })

    // 应用主题
    const theme = ref('light')

    // 当前语言
    const language = ref('zh-CN')

    // 侧边栏是否折叠
    const sidebarCollapsed = ref(false)

    // 是否是深色主题
    const isDarkTheme = computed(() => theme.value === 'dark')

    // 是否是新窗口打开的配置状态
    const isOpenInNewWindow = computed(() => itemOpenNewWindow.value)

    // 侧边栏状态
    const isSidebarCollapsed = computed(() => sidebarCollapsed.value)

    /**
     * 初始化应用配置
     */
    const initializeAppConfig = () => {
        // 从存储中加载所有配置
        itemOpenNewWindow.value = storage_account.getConfigurationItem(
            'app',
            CONFIG_KEYS.OPEN_NEW_WINDOW,
            {defaultValue: false}
        )

        iconSize.value = storage_account.getConfigurationItem(
            'app',
            CONFIG_KEYS.ICON_SIZE,
            {
                defaultValue: {
                    icon: 99,
                    margin: 1,
                    padding: 1,
                }
            }
        )

        theme.value = storage_account.getConfigurationItem(
            'app',
            CONFIG_KEYS.THEME,
            {defaultValue: 'light'}
        )

        language.value = storage_account.getConfigurationItem(
            'app',
            CONFIG_KEYS.LANGUAGE,
            {defaultValue: 'zh-CN'}
        )

        sidebarCollapsed.value = storage_account.getConfigurationItem(
            'app',
            CONFIG_KEYS.SIDEBAR_COLLAPSED,
            {defaultValue: false}
        )

        // 应用主题
        applyTheme(theme.value)

        console.log('App config initialized:', {
            openNewWindow: itemOpenNewWindow.value,
            theme: theme.value,
            language: language.value,
            sidebarCollapsed: sidebarCollapsed.value
        })
    }

    /**
     * 切换是否在新窗口打开项目
     * @param value - true/false 或 undefined 表示切换
     */
    const toggleItemOpenNewWindow = (value?: boolean) => {
        const newValue = value !== undefined ? value : !itemOpenNewWindow.value
        itemOpenNewWindow.value = newValue

        // 保存到本地存储
        storage_account.updateConfiguration('app', CONFIG_KEYS.OPEN_NEW_WINDOW, newValue)

        return newValue
    }

    const setIconSize = (newValue: any) => {
        iconSize.value = newValue

        // 保存到本地存储
        storage_account.updateConfiguration('app', CONFIG_KEYS.ICON_SIZE, newValue)

        return newValue
    }

    /**
     * 设置应用主题
     * @param themeName - 主题名称: 'light' | 'dark' | 'auto'
     */
    const setTheme = (themeName: 'light' | 'dark' | 'auto') => {
        theme.value = themeName

        // 保存到本地存储
        storage_account.updateConfiguration('app', CONFIG_KEYS.THEME, themeName)

        // 应用主题
        applyTheme(themeName)

        return themeName
    }

    /**
     * 切换主题
     */
    const toggleTheme = () => {
        const newTheme = theme.value === 'light' ? 'dark' : 'light'
        return setTheme(newTheme)
    }

    /**
     * 设置语言
     * @param lang - 语言代码
     */
    const setLanguage = (lang: string) => {
        language.value = lang

        // 保存到本地存储
        storage_account.updateConfiguration('app', CONFIG_KEYS.LANGUAGE, lang)

        // 可以在这里触发语言切换事件
        document.documentElement.lang = lang

        return lang
    }

    /**
     * 切换侧边栏状态
     * @param collapsed - true/false 或 undefined 表示切换
     */
    const toggleSidebar = (collapsed?: boolean) => {
        const newValue = collapsed !== undefined ? collapsed : !sidebarCollapsed.value
        sidebarCollapsed.value = newValue

        // 保存到本地存储
        storage_account.updateConfiguration('app', CONFIG_KEYS.SIDEBAR_COLLAPSED, newValue)

        return newValue
    }

    /**
     * 重置所有设置为默认值
     */
    const resetToDefaults = () => {
        itemOpenNewWindow.value = false
        iconSize.value = {
            icon: 99,
            margin: 1,
            padding: 1,
        }
        theme.value = 'light'
        language.value = 'zh-CN'
        sidebarCollapsed.value = false

        // 保存到本地存储
        storage_account.updateConfiguration('app', CONFIG_KEYS.OPEN_NEW_WINDOW, false)
        storage_account.updateConfiguration('app', CONFIG_KEYS.ICON_SIZE, {
            icon: 99,
            margin: 1,
            padding: 1,
        })
        storage_account.updateConfiguration('app', CONFIG_KEYS.THEME, 'light')
        storage_account.updateConfiguration('app', CONFIG_KEYS.LANGUAGE, 'zh-CN')
        storage_account.updateConfiguration('app', CONFIG_KEYS.SIDEBAR_COLLAPSED, false)

        // 应用默认主题
        applyTheme('light')

        console.log('App config reset to defaults')
    }

    /**
     * 获取当前所有配置
     */
    const getCurrentConfig = () => {
        return {
            openNewWindow: itemOpenNewWindow.value,
            iconSize: iconSize.value,
            theme: theme.value,
            language: language.value,
            sidebarCollapsed: sidebarCollapsed.value,
            isDarkTheme: isDarkTheme.value
        }
    }

    // ========== Private Methods ==========

    /**
     * 应用主题到文档
     * @private
     */
    const applyTheme = (themeName: string) => {
        const html = document.documentElement

        // 移除现有主题类
        html.classList.remove('theme-light', 'theme-dark')

        if (themeName === 'auto') {
            // 自动模式：根据系统偏好设置
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            html.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
        } else {
            html.classList.add(`theme-${themeName}`)
        }

        // 设置 data-theme 属性
        html.setAttribute('data-theme', themeName)
    }

    initializeAppConfig()

    return {
        // State
        itemOpenNewWindow,
        iconSize,
        theme,
        language,
        sidebarCollapsed,

        // Getters
        isDarkTheme,
        isOpenInNewWindow,
        isSidebarCollapsed,

        // Actions
        initializeAppConfig,
        toggleItemOpenNewWindow,
        setIconSize,
        setTheme,
        toggleTheme,
        setLanguage,
        toggleSidebar,
        resetToDefaults,
        getCurrentConfig
    }
})
