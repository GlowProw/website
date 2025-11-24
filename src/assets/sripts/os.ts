import { ref, onMounted } from 'vue'

export type OperatingSystem =
    | 'Android'
    | 'iOS'
    | 'Windows'
    | 'MacOS'
    | 'Linux'
    | 'unknown'

/**
 * 操作系统检测的Composable
 */
export function useOS() {
    const os = ref<OperatingSystem>('unknown')
    const userAgent = ref('')
    const platform = ref('')

    /**
     * 检测操作系统
     */
    function detectOS(): OperatingSystem {
        userAgent.value = navigator.userAgent || navigator.vendor || window.opera || ''
        platform.value = navigator.platform.toLowerCase()

        const ua = userAgent.value
        const plat = platform.value

        // 判断Android
        if (/android/i.test(ua)) {
            return 'Android'
        }

        // 判断iOS
        if ((/iPad|iPhone|iPod/.test(ua) && !window.MSStream) ||
            ['iphone', 'ipad', 'ipod'].includes(plat)) {
            return 'iOS'
        }

        // 判断Windows
        if (plat.includes('win')) {
            return 'Windows'
        }

        // 判断Mac OS
        if (plat.includes('mac')) {
            return 'MacOS'
        }

        // 判断Linux
        if (plat.includes('linux')) {
            return 'Linux'
        }

        return 'unknown'
    }

    /**
     * 判断是否为移动设备
     */
    const isMobile = () => {
        return os.value === 'Android' || os.value === 'iOS'
    }

    /**
     * 判断是否为桌面设备
     */
    const isDesktop = () => {
        return ['Windows', 'MacOS', 'Linux'].includes(os.value)
    }

    /**
     * 重新检测操作系统（用于动态变化的情况）
     */
    const redetect = () => {
        os.value = detectOS()
    }

    // 组件挂载时检测
    onMounted(() => {
        os.value = detectOS()
    })

    return {
        // 响应式数据
        os,
        userAgent,
        platform,

        // 计算方法
        isMobile,
        isDesktop,

        // 方法
        redetect,
        detectOS
    }
}
