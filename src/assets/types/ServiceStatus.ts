/**
 * 服务状态与构建流水线相关类型
 */

/** 单个监视器的实时状态 */
export type ServiceMonitorStatus = 'up' | 'down' | 'pending' | 'maintenance' | 'unknown'

/** 服务整体状态 */
export type ServiceOverallStatus = 'up' | 'partial' | 'down' | 'unknown'

/** 单个监视器的精简信息 */
export interface ServiceMonitor {
    id: number | string
    name: string
    status: ServiceMonitorStatus
    uptime24h: number | null
    uptime30d: number | null
}

/** 监视器分组 */
export interface ServiceMonitorGroup {
    name: string
    monitors: ServiceMonitor[]
}

/** 进行中的事件公告 */
export interface ServiceIncident {
    title: string
    content: string
    style: string
}

/** 汇总后的服务状态数据 */
export interface ServiceStatusData {
    overall: ServiceOverallStatus
    groups: ServiceMonitorGroup[]
    incident: ServiceIncident | null
    updatedAt: string | null
}

/** 构建流水线的运行阶段 */
export type BuildRunStatus = 'queued' | 'in_progress' | 'completed' | 'unknown'

/** 构建流水线的最终结论 */
export type BuildRunConclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | 'running' | 'unknown'

/** 单次构建流水线的精简信息 */
export interface BuildRun {
    id: number
    title: string
    workflow: string
    branch: string
    runNumber: number
    status: BuildRunStatus
    conclusion: BuildRunConclusion
    createdAt: string
    updatedAt: string
    url: string
}

/** 构建流水线列表数据 */
export interface BuildRunsData {
    totalCount: number
    runs: BuildRun[]
    updatedAt: string | null
}
