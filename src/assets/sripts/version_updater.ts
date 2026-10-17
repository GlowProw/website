import Storage from './storage'

// 存储管理实例
const storage = new Storage()

const VERSION_URL = '/version.json'
const INITIAL_DELAY = 8 * 1000
const POLL_INTERVAL = 5 * 60 * 1000
const RELOAD_FLAG_PREFIX = 'app.version.reload.'
const KEEP_FLAG_COUNT = 5 // 最多保留的历史刷新标记数量

let timer: ReturnType<typeof setInterval> | null = null
let checking = false
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
        // 忽略清理失败，刷新后新 SW 仍会重建缓存
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
        // 忽略
    }
}

/**
 * 记录版本刷新标记并维护历史标记数量
 */
function rememberReload(remoteVersion: string): void {
    try {
        storage.session.set(RELOAD_FLAG_PREFIX + remoteVersion, '1')
        const fullPrefix = storage.session.name(RELOAD_FLAG_PREFIX)
        const flags = storage.session.keys().filter((k) => k.startsWith(fullPrefix))
        const excess = flags.slice(0, Math.max(0, flags.length - KEEP_FLAG_COUNT))
        excess.forEach((k) => {
            const rawKey = k.replace(storage.STORAGENAME, '')
            storage.session.rem(rawKey)
        })
    } catch {
        // 忽略异常
    }
}

/**
 * 检查当前版本是否已在会话中执行过刷新
 */
function hasReloadedFor(remoteVersion: string): boolean {
    try {
        const item = storage.session.get(RELOAD_FLAG_PREFIX + remoteVersion)
        return item?.code === 0 && (item?.data?.value === '1' || item?.data === '1')
    } catch {
        return false
    }
}

async function checkVersion(): Promise<void> {
    if (checking || typeof window === 'undefined') return
    checking = true
    try {
        const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'same-origin',
            headers: {'Cache-Control': 'no-cache'},
        })
        if (!res.ok) return

        const data = await res.json()
        const remoteVersion: string = data?.version
        const currentVersion = getCurrentVersion()
        if (!remoteVersion || !currentVersion) return

        if (remoteVersion === currentVersion) {
            return
        }

        // 已为该版本刷新过但仍不一致（CDN 尚未收敛），本轮不再刷新
        if (hasReloadedFor(remoteVersion)) {
            console.warn(`[VersionUpdater] 检测到新版本 ${remoteVersion}（本地版本 ${currentVersion}），该版本已执行过自动刷新，等待缓存收敛`)
            return
        }

        console.info(`[VersionUpdater] 检测到网站版本更新: 本地 ${currentVersion} -> 远端 ${remoteVersion}，正在自动清理缓存并刷新页面...`)
        rememberReload(remoteVersion)
        await clearAllCaches()
        await unregisterServiceWorkers()
        window.location.reload()
    } catch {
        // 网络异常等情况静默忽略，等待下一轮
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
            // 本地无需启动远端版本轮询
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
