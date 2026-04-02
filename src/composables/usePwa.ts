import { useAppStore } from '~/stores/appStore'
import { computed } from 'vue'

/**
 * PWA 相关组合式函数
 * 现在作为 appStore 中单例 PWA 逻辑的包装器
 */
export function usePwa() {
  const appStore = useAppStore()

  /**
   * 关闭 PWA 更新提示
   */
  const closePwaUpdate = () => {
    appStore.pwaOfflineReady = false
    appStore.pwaNeedRefresh = false
  }

  /**
   * 执行 PWA 安装
   */
  const install = async () => {
    console.log('Attempting to install PWA...', appStore.pwaInstallPrompt)
    if (appStore.pwaInstallPrompt) {
      appStore.pwaInstallPrompt.prompt()
      const { outcome } = await appStore.pwaInstallPrompt.userChoice
      console.log(`User response to the install prompt: ${outcome}`)
      if (outcome === 'accepted') {
        appStore.pwaInstallPrompt = null
      }
    } else {
      console.warn('PWA install prompt is not available.')
    }
  }

  /**
   * 检查应用是否已安装
   */
  const isInstalled = computed(() => appStore.isPwaInstalled)

  /**
   * 重载 Service Worker 服务
   */
  const reload = async () => {
    if (appStore.pwaUpdateServiceWorker) {
      await appStore.pwaUpdateServiceWorker(true)
    }
  }

  /**
   * 获取 PWA 服务状态
   */
  const status = computed(() => {
    if (appStore.pwaNeedRefresh) return 'needRefresh'
    if (appStore.pwaOfflineReady) return 'offlineReady'
    if (appStore.isPwaInstalled) return 'installed'
    return 'ready'
  })

  return {
    offlineReady: computed(() => appStore.pwaOfflineReady),
    needRefresh: computed(() => appStore.pwaNeedRefresh),
    updateServiceWorker: appStore.pwaUpdateServiceWorker,
    reload,
    closePwaUpdate,
    install,
    isInstalled,
    status,
    // 暴露原始 prompt 状态以便调试
    installPrompt: computed(() => appStore.pwaInstallPrompt)
  }
}
