import Storage from './storage'
import { useNoticeStore } from '~/stores/noticeStore'
import { getAppI18n } from '@/i18n'

// 存储管理实例
const storage = new Storage()

// 远端版本清单地址
const VERSION_URL = '/version.json'

// 初始延迟检测时间（毫秒）
const INITIAL_DELAY = 8 * 1000

// 轮询检测间隔（毫秒）
const POLL_INTERVAL = 5 * 60 * 1000

// 会话内已提示通知标记前缀
const NOTIFY_FLAG_PREFIX = 'app.version.notified.'

// 最多保留的历史标记数量
const KEEP_FLAG_COUNT = 5

// 定时轮询句柄
let timer: ReturnType<typeof setInterval> | null = null

// 正在执行版本检查标记
let checking = false

// 版本监听器已启动标记
let started = false

/**
 * 获取当前应用构建版本
 */
function getCurrentVersion(): string {
    try {
        return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : ''
    } catch {
        return ''
    }
}

/**
 * 删除旧版本遗留的全部 CacheStorage（workbox 预缓存、运行时缓存等）
 */
async function clearAllCaches(): Promise<void> {
    if (typeof caches === 'undefined') return
    try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
    } catch {
        // 忽略清理失败，后续刷新时新 Service Worker 仍会尝试重建缓存
    }
}

/**
 * 注销旧 Service Worker，避免其继续拦截请求返回旧资源
 */
async function unregisterServiceWorkers(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
    } catch {
        // 忽略注销失败异常
    }
}

/**
 * 记录版本通知标记并维护历史标记数量
 */
function rememberNotification(remoteVersion: string): void {
    try {
        storage.session.set(NOTIFY_FLAG_PREFIX + remoteVersion, '1')
        const fullPrefix = storage.session.name(NOTIFY_FLAG_PREFIX)
        const flags = storage.session.keys().filter((k) => k.startsWith(fullPrefix))
        const excess = flags.slice(0, Math.max(0, flags.length - KEEP_FLAG_COUNT))
        excess.forEach((k) => {
            const rawKey = k.replace(storage.STORAGENAME, '')
            storage.session.rem(rawKey)
        })
    } catch {
        // 忽略存储异常
    }
}

/**
 * 检查当前版本是否已在会话中提示过更新通知
 */
function hasNotifiedFor(remoteVersion: string): boolean {
    try {
        const item = storage.session.get(NOTIFY_FLAG_PREFIX + remoteVersion)
        return item?.code === 0 && (item?.data?.value === '1' || item?.data === '1')
    } catch {
        return false
    }
}

/**
 * 获取当前操作系统推荐的硬刷新快捷键描述文本
 */
function getRefreshShortcutText(): string {
    const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '')
    return isMac ? 'Cmd + Shift + R' : 'Ctrl + F5'
}

/**
 * 提示用户网站已有新版本并建议使用快捷键刷新
 */
function notifyVersionUpdate(currentVersion: string, remoteVersion: string): void {
    const shortcut = getRefreshShortcutText()
    const noticeStore = useNoticeStore()

    let title = '发现新版本'
    let text = `检测到网站有新版本发布（当前版本 ${currentVersion}，最新版本 ${remoteVersion}）。请使用快捷键 ${shortcut} 刷新页面以载入最新内容。`

    try {
        const i18n = getAppI18n()
        const t = i18n?.global?.t
        const te = i18n?.global?.te
        if (typeof t === 'function') {
            if (typeof te === 'function' && te('notice.versionUpdateTitle')) {
                title = t('notice.versionUpdateTitle')
            }
            if (typeof te === 'function' && te('notice.versionUpdateText')) {
                text = t('notice.versionUpdateText', {
                    current: currentVersion,
                    remote: remoteVersion,
                    shortcut,
                })
            }
        }
    } catch {
        // 国际化实例尚未就绪时降级使用默认文本
    }

    noticeStore.primary(text, {
        title,
        timeout: 0,
        mode: 'minimal'
    })
}

/**
 * 检查远端版本并在发现更新时提示用户
 */
async function checkVersion(): Promise<void> {
    if (checking || typeof window === 'undefined') return
    checking = true
    try {
        const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'same-origin',
            headers: { 'Cache-Control': 'no-cache' },
        })
        if (!res.ok) return

        const data = await res.json()
        const remoteVersion: string = data?.version
        const currentVersion = getCurrentVersion()
        if (!remoteVersion || !currentVersion) return

        if (remoteVersion === currentVersion) {
            return
        }

        // 已为该版本弹出过提示，会话内不再重复打扰
        if (hasNotifiedFor(remoteVersion)) {
            return
        }

        console.info(`[VersionUpdater] 检测到网站版本更新: 本地 ${currentVersion} -> 远端 ${remoteVersion}，已就绪新缓存清理并提示用户刷新`)

        rememberNotification(remoteVersion)

        await clearAllCaches()
        await unregisterServiceWorkers()

        notifyVersionUpdate(currentVersion, remoteVersion)
    } catch {
        // 网络异常等情况静默忽略，等待下一轮轮询
    } finally {
        checking = false
    }
}

/**
 * 启动版本监听与缓存控制
 */
export function startVersionWatcher(): void {
    if (started) return
    if (typeof window === 'undefined') return

    // 开发环境下自动清理历史残留的 Service Worker，避免拦截开发请求与打印警告
    if (import.meta.env.DEV) {
        unregisterServiceWorkers().then(() => {
            // 本地开发无需启动远端版本轮询
        })
        return
    }

    if (!import.meta.env.PROD) return

    started = true
    window.setTimeout(() => checkVersion(), INITIAL_DELAY)
    timer = setInterval(() => checkVersion(), POLL_INTERVAL)

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkVersion()
    })

    window.addEventListener('focus', () => checkVersion())
}
