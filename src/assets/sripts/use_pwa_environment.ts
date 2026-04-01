import { ref, onMounted, onUnmounted } from 'vue'
import {useAppStore} from "~/stores/appStore";

export function usePWAEnvironment() {
    const isPWA = ref(false)
    // 显示模式: 'browser' | 'standalone' | 'fullscreen' | 'minimal-ui'
    const displayMode = ref('browser')
    const appStore = useAppStore()

    /**
     * 获取当前显示模式
     */
    const getDisplayMode = () => {
        // 使用 matchMedia
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return 'standalone'
        }
        if (window.matchMedia('(display-mode: fullscreen)').matches) {
            return 'fullscreen'
        }
        if (window.matchMedia('(display-mode: minimal-ui)').matches) {
            return 'minimal-ui'
        }

        // iOS 特殊判断
        // @ts-ignore
        if (window.navigator.standalone === true) {
            return 'standalone'
        }

        // 通过 URL 参数判断（自定义）
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('mode') === 'pwa') {
            return 'standalone'
        }

        return 'browser'
    }

    /**
     * 更新状态
     */
    const updateStatus = () => {
        const mode = getDisplayMode()
        displayMode.value = mode
        isPWA.value = mode !== 'browser'

        console.log(`PWA 运行模式: ${mode}`)
    }

    /**
     * 监听模式变化
     */
    const setupListeners = () => {
        const queries = [
            '(display-mode: standalone)',
            '(display-mode: fullscreen)',
            '(display-mode: minimal-ui)'
        ]

        const handlers = []

        queries.forEach(query => {
            const mql = window.matchMedia(query)
            const handler = (e) => {
                if (e.matches) {
                    updateStatus()
                }
            }

            mql.addEventListener('change', handler)
            handlers.push({ mql, handler })
        })

        return () => {
            handlers.forEach(({ mql, handler }) => {
                mql.removeEventListener('change', handler)
            })
        }
    }

    /**
     * 获取启动参数（从启动 URL 中获取）
     */
    const getLaunchParams = () => {
        const params = new URLSearchParams(window.location.search)
        return {
            source: params.get('source'),      // 来源
            campaign: params.get('campaign'),  // 活动
            ...Object.fromEntries(params)
        }
    }

    /**
     * 在 PWA 中打开外部链接
     * @param url
     * @param target
     */
    const openExternalLink = (url, target = '_blank') => {
        if (isPWA.value) {
            // 在 PWA 中，使用 _blank 会在浏览器中打开
            window.open(url, target)
        } else {
            // 浏览器中正常打开
            window.open(url, target)
        }
    }

    onMounted(() => {
        updateStatus()
        const cleanup = setupListeners()

        appStore.isPwa = isPWA.value

        onUnmounted(() => {
            cleanup()
        })
    })

    return {
        isPWA,
        displayMode,
        getLaunchParams,
        openExternalLink
    }
}
