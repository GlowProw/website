import {ref, onMounted, onUnmounted, Ref} from 'vue'

export interface UseFullscreenReturn {
    isFullscreen: Ref<boolean>
    enterFullscreen: (element?: Element) => Promise<void>
    exitFullscreen: () => Promise<void>
    toggleFullscreen: (element?: Element) => Promise<void>
    isSupported: Ref<boolean>
}

/**
 * 全屏功能
 */
export function useFullscreen(target?: Ref<Element | null>): UseFullscreenReturn {
    const isFullscreen = ref(false)
    const isSupported = ref(false)

    /**
     * 检查浏览器支持情况
     */
    const checkSupport = () => {
        return !!(
            document.fullscreenEnabled ||
            (document as any).webkitFullscreenEnabled ||
            (document as any).mozFullScreenEnabled ||
            (document as any).msFullscreenEnabled
        )
    }

    /**
     * 获取全屏元素
     */
    const getFullscreenElement = (): Element | null => {
        return (
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        )
    }

    /**
     * 进入全屏
     * @param element
     */
    const enterFullscreen = async (element?: Element): Promise<void> => {
        const targetElement = element || target?.value || document.documentElement

        if (!targetElement) return

        try {
            if (targetElement.requestFullscreen) {
                await targetElement.requestFullscreen()
            } else if ((targetElement as any).webkitRequestFullscreen) {
                await (targetElement as any).webkitRequestFullscreen()
            } else if ((targetElement as any).mozRequestFullScreen) {
                await (targetElement as any).mozRequestFullScreen()
            } else if ((targetElement as any).msRequestFullscreen) {
                await (targetElement as any).msRequestFullscreen()
            }
        } catch (error) {
            console.error('进入全屏失败:', error)
        }
    }

    /**
     * 退出全屏
     */
    const exitFullscreen = async (): Promise<void> => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen()
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen()
            } else if ((document as any).mozCancelFullScreen) {
                await (document as any).mozCancelFullScreen()
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen()
            }
        } catch (error) {
            console.error('退出全屏失败:', error)
        }
    }

    /**
     * 切换全屏
     * @param element
     */
    const toggleFullscreen = async (element?: Element): Promise<void> => {
        if (isFullscreen.value) {
            await exitFullscreen()
        } else {
            await enterFullscreen(element)
        }
    }

    /**
     * 全屏变化事件处理
     */
    const handleFullscreenChange = () => {
        isFullscreen.value = !!getFullscreenElement()
    }

    /**
     * 初始化
     */
    onMounted(() => {
        isSupported.value = checkSupport()

        // 添加事件监听
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.addEventListener('mozfullscreenchange', handleFullscreenChange)
        document.addEventListener('MSFullscreenChange', handleFullscreenChange)

        // 初始状态
        isFullscreen.value = !!getFullscreenElement()
    })

    /**
     * 移除事件监听
     */
    onUnmounted(() => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    })

    return {
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen,
        isSupported
    }
}
