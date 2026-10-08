/**
 * 网站版本更新
 */

const VERSION_URL = '/version.json'
const INITIAL_DELAY = 8 * 1000
const POLL_INTERVAL = 5 * 60 * 1000
const RELOAD_FLAG_PREFIX = 'app.version.reload.'
const KEEP_FLAG_COUNT = 5 // 最多保留的历史刷新标记数量

let timer: ReturnType<typeof setInterval> | null = null
let checking = false
let started = false

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

function rememberReload(remoteVersion: string): void {
    try {
        sessionStorage.setItem(RELOAD_FLAG_PREFIX + remoteVersion, '1')
        const flags = Object.keys(sessionStorage).filter((k) => k.startsWith(RELOAD_FLAG_PREFIX))
        flags.slice(0, Math.max(0, flags.length - KEEP_FLAG_COUNT)).forEach((k) => sessionStorage.removeItem(k))
    } catch {
        // 隐私模式等场景忽略
    }
}

function hasReloadedFor(remoteVersion: string): boolean {
    try {
        return sessionStorage.getItem(RELOAD_FLAG_PREFIX + remoteVersion) === '1'
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
        if (!remoteVersion || !currentVersion || remoteVersion === currentVersion) return

        // 已为该版本刷新过但仍不一致（CDN 尚未收敛），本轮不再刷新
        if (hasReloadedFor(remoteVersion)) return

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
 * 启动静默版本监听（仅生产环境、浏览器端）
 */
export function startVersionWatcher(): void {
    if (started) return
    if (typeof window === 'undefined') return
    if (!import.meta.env.PROD) return

    started = true
    window.setTimeout(() => checkVersion(), INITIAL_DELAY)
    timer = setInterval(() => checkVersion(), POLL_INTERVAL)

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkVersion()
    })
    window.addEventListener('focus', () => checkVersion())
}
