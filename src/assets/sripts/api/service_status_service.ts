import {storage} from "@/assets/sripts";
import type {
    BuildRun,
    BuildRunConclusion,
    BuildRunStatus,
    BuildRunsData,
    ServiceMonitorStatus,
    ServiceOverallStatus,
    ServiceStatusData,
} from "@/assets/types/ServiceStatus";

/**
 * 状态页接口前缀：开发环境由 vite 代理转发，生产环境由边缘节点反代同名路径
 */
const STATUS_BASE = '/status-api/status-page'
/**
 * 状态页标识
 */
const STATUS_SLUG = 'glow-prow'
/**
 * 网站构建流水线地址
 */
const GITHUB_RUNS_URL = 'https://api.github.com/repos/GlowProw/website/actions/runs?per_page=20'

/**
 * 会话缓存键名
 */
const STATUS_CACHE_KEY = 'service.status'
const BUILDS_CACHE_KEY = 'build.runs'
/**
 * 缓存有效期 60 秒，徽章与状态页共享同一份数据
 */
const CACHE_TTL_MS = 60_000
/**
 * 上游请求超时时间
 */
const FETCH_TIMEOUT_MS = 8_000

// 心跳状态码与语义的映射：0 宕机、1 正常、2 波动、3 维护中
const HEARTBEAT_STATUS: ServiceMonitorStatus[] = ['down', 'up', 'pending', 'maintenance']

/**
 * 读取会话缓存，校验有效期
 * @param key 缓存键名
 */
const readCache = <T>(key: string): T | null => {
    try {
        if (typeof window === 'undefined') return null
        const result = storage.session.get(key)
        if (result?.code !== 0 || !result.data?.value) return null
        const payload = result.data.value
        if (Date.now() - payload.fetchedAt > CACHE_TTL_MS) return null
        return payload.data as T
    } catch {
        return null
    }
}

/**
 * 写入会话缓存
 * @param key 缓存键名
 * @param data 需要缓存的数据
 */
const writeCache = (key: string, data: unknown): void => {
    try {
        if (typeof window === 'undefined') return
        storage.session.set(key, {fetchedAt: Date.now(), data})
    } catch {
        // 隐私模式或配额受限时静默降级为每次请求
    }
}

/**
 * 带超时控制地请求 JSON 接口
 * @param url 请求地址
 */
const fetchJson = async (url: string): Promise<any> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
            headers: {'Accept': 'application/json'}
        })
        if (!res.ok) throw new Error(`request failed with ${res.status}`)
        return await res.json()
    } finally {
        clearTimeout(timer)
    }
}

/**
 * 把状态页配置与心跳数据合并为前端易用的精简结构
 * @param page 状态页分组数据
 * @param heartbeat 心跳与可用率数据
 */
const mergeServiceStatus = (page: any, heartbeat: any): ServiceStatusData => {
    const heartbeatList = heartbeat?.heartbeatList || {}
    const uptimeList = heartbeat?.uptimeList || {}

    const groups = (page?.publicGroupList || []).map((group: any) => ({
        name: group?.name || '',
        monitors: (group?.monitorList || []).map((monitor: any) => {
            const beats = heartbeatList[String(monitor.id)] || []
            const lastBeat = beats.length > 0 ? beats[beats.length - 1] : null
            const status: ServiceMonitorStatus = lastBeat
                ? (HEARTBEAT_STATUS[lastBeat.status] || 'unknown')
                : 'unknown'
            return {
                id: monitor.id,
                name: monitor.name,
                status,
                uptime24h: uptimeList[`${monitor.id}_24`] ?? null,
                uptime30d: uptimeList[`${monitor.id}_720`] ?? null,
            }
        })
    }))

    const allMonitors = groups.flatMap((group: any) => group.monitors)
    let overall: ServiceOverallStatus = 'unknown'
    if (allMonitors.length > 0) {
        const upCount = allMonitors.filter((m: any) => m.status === 'up').length
        const downCount = allMonitors.filter((m: any) => m.status === 'down').length
        if (upCount === allMonitors.length) overall = 'up'
        else if (downCount === allMonitors.length) overall = 'down'
        else overall = 'partial'
    }

    // 状态页当前生效的事件公告（维护或故障说明）
    const incident = (page?.incidents || [])[0] || null

    return {
        overall,
        groups,
        incident: incident ? {
            title: incident.title || '',
            content: incident.content || '',
            style: incident.style || 'info',
        } : null,
        updatedAt: new Date().toISOString(),
    }
}

/**
 * 把 GitHub 的原始字段归一到有限的构建状态与结论
 * @param status GitHub 原始运行阶段
 * @param conclusion GitHub 原始运行结论
 */
const normalizeBuildRun = (status: string, conclusion: string | null): { status: BuildRunStatus; conclusion: BuildRunConclusion } => {
    const runStatus: BuildRunStatus = (['queued', 'in_progress', 'completed'].includes(status)
        ? status
        : 'unknown') as BuildRunStatus

    if (runStatus !== 'completed') {
        return {status: runStatus, conclusion: 'running'}
    }

    const runConclusion: BuildRunConclusion = (['success', 'failure', 'cancelled', 'skipped'].includes(conclusion || '')
        ? conclusion
        : 'unknown') as BuildRunConclusion

    return {status: runStatus, conclusion: runConclusion}
}

/**
 * 服务状态接口
 */
export function useServiceStatusApi() {
    /**
     * 获取服务整体状态与各监视器可用率
     * @param force true 时绕过会话缓存强制刷新
     */
    const getServiceStatus = async (force = false): Promise<ServiceStatusData> => {
        if (!force) {
            const cached = readCache<ServiceStatusData>(STATUS_CACHE_KEY)
            if (cached) return cached
        }

        const [page, heartbeat] = await Promise.all([
            fetchJson(`${STATUS_BASE}/${STATUS_SLUG}`),
            fetchJson(`${STATUS_BASE}/heartbeat/${STATUS_SLUG}`),
        ])
        const data = mergeServiceStatus(page, heartbeat)
        writeCache(STATUS_CACHE_KEY, data)
        return data
    }

    /**
     * 获取网站构建流水线的最近运行记录
     * @param force true 时绕过会话缓存强制刷新
     */
    const getBuildRuns = async (force = false): Promise<BuildRunsData> => {
        if (!force) {
            const cached = readCache<BuildRunsData>(BUILDS_CACHE_KEY)
            if (cached) return cached
        }

        const raw = await fetchJson(GITHUB_RUNS_URL)
        const runs: BuildRun[] = (raw?.workflow_runs || []).map((run: any) => {
            const normalized = normalizeBuildRun(run.status, run.conclusion)
            return {
                id: run.id,
                title: run.display_title || run.name || '',
                workflow: run.name || '',
                branch: run.head_branch || '',
                runNumber: run.run_number || 0,
                status: normalized.status,
                conclusion: normalized.conclusion,
                createdAt: run.created_at || '',
                updatedAt: run.updated_at || '',
                url: run.html_url || '',
            }
        })

        const data: BuildRunsData = {
            totalCount: raw?.total_count || 0,
            runs,
            updatedAt: new Date().toISOString(),
        }
        writeCache(BUILDS_CACHE_KEY, data)
        return data
    }

    return {
        getServiceStatus,
        getBuildRuns,
    }
}
