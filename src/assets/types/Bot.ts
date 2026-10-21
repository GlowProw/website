/**
 * 机器人模块相关类型
 */

/**
 * 平台选项
 */
export interface BotPlatformOption {
    value: string
    label: string
    enabled: boolean
}

/**
 * 站点登记的机器人实例
 */
export interface BotInstanceOption {
    id: number
    platform: string
    name: string
    platformBotId: string
    displayId?: string
}

/**
 * 群推送配置
 */
export interface BotGroupSettings {
    pushEnabled: boolean
    welcome: {
        enabled: boolean
        content: string
    }
    dailyReport: {
        enabled: boolean
        times: string[]
    }
    teamup: {
        enabled: boolean
        intervalMinutes: number
    }
    drop: {
        enabled: boolean
    }
}

/**
 * 用户绑定的群记录
 */
export interface BotGroupItem {
    id: number
    botId: number
    platform: string
    groupOpenid: string
    groupNumber?: string
    groupName?: string
    ownerUserId: string
    pushEnabled: number
    active: number
    settings: BotGroupSettings
    botName?: string
    platformBotId?: string
    displayId?: string
    botStatus?: number
    recvMsgSetting?: string | null
    botRole?: string | null
    addedByOpenid?: string | null
    joinedAt?: string | null
    memberCount?: number | null
    groupDesc?: string | null
    groupClass?: string | null
    groupTags?: string | null
    lastSyncTime?: string | null
}

/**
 * 机器人群内状态
 */
export interface BotGroupState {
    available: boolean
    pushEnabled?: boolean
    recvMsgSetting?: string | null
    botRole?: string | null
    joinedAt?: string | null
    memberOpenid?: string | null
    reason?: string
}

/**
 * 群成员
 */
export interface BotGroupMember {
    openid: string
    username?: string
    role?: string
    bot?: boolean
    joinedAt?: string
}

/**
 * 群成员列表响应
 */
export interface BotGroupMembers {
    members: BotGroupMember[]
    nextCursor: string
    available: boolean
    reason?: string
}

/**
 * 群基础信息
 */
export interface BotGroupInfo {
    groupOpenid: string
    groupName?: string
    groupNumber?: string
    memberCount?: number
    description?: string
    groupClass?: string
    tags?: string[]
    avatar?: string
    createdAt?: string
    owner?: {
        openid?: string | null
        username?: string | null
    } | null
    available?: boolean
    reason?: string
}

/**
 * 主动推送额度
 */
export interface BotPushQuotaItem {
    platform: string
    scope: 'user' | 'group' | 'bot'
    scopeId: string
    dateKey: string
    usedCount: number
    limitCount: number
}

/**
 * 群维度今日推送额度
 */
export interface BotGroupQuotaItem {
    groupOpenid: string
    groupName: string
    dateKey: string
    usedCount: number
    limitCount: number
}

/**
 * 群组业务错误类型
 */
export type BotGroupErrorType = 'push' | 'command' | 'group'

/**
 * 群组错误日志，内容已在服务端过滤系统信息
 */
export interface BotGroupErrorLog {
    id: number
    groupOpenid: string
    groupName: string
    errorType: BotGroupErrorType
    command: string
    message: string
    createdTime: string
}

/**
 * 概览错误汇总
 */
export interface BotOverviewErrors {
    items: BotGroupErrorLog[]
    counts: Array<{ groupOpenid: string; count: number }>
}

/**
 * 群额度信息
 */
export interface BotGroupQuota {
    user: BotPushQuotaItem
    group: BotPushQuotaItem
    subscribed: boolean
    rateLimit: {
        botQpm: number
        unverifiedBotQpm: number
        relationQpm: number
        groupDaily: number
    }
}

/**
 * 群签到用户
 */
export interface BotGroupSignIn {
    openid: string
    username?: string
    points?: number
    lastSignTime?: string
}

/**
 * 群详情响应
 */
export interface BotGroupDetail {
    group: BotGroupItem
    info: BotGroupInfo
    state?: BotGroupState
    members?: BotGroupMembers
    quota: BotGroupQuota
    signIns: BotGroupSignIn[]
    pushNowCooldown?: number
    /**
     * 当前账户在群面板可用的操作能力
     */
    capabilities?: {
        commandPush: boolean
    }
}

/**
 * 群黑名单成员
 */
export interface BotBlocklistItem {
    id: number
    memberOpenid: string
    memberName: string | null
    createdTime: string
}

/**
 * 入群申请
 */
export interface BotJoinRequest {
    join_request_id: string
    member_openid: string
    username: string
    apply_at: string
    apply_source?: string
    risk_tips?: string
    verify_info?: {
        method?: string
        verify_message?: string
    }
}

/**
 * 群禁言状态
 */
export interface BotGroupMuteState {
    globalRule: {
        mode?: string
    }
    members: Array<{
        member_openid: string
        mute_expire_at: string
        username: string
    }>
}

/**
 * 组队同步可选平台与机器人
 */
export interface BotPushTargetPlatform {
    value: string
    label: string
    bound: boolean
    bots: BotInstanceOption[]
}

/**
 * 机器人模块准入状态
 */
export interface BotAccountStatus {
    access: {
        allowed: boolean
        tier: string | null
        multiplier: number
        unlimited: boolean
    }
    groups: number
    hasQqBinding: boolean
    firstUse: boolean
}

/**
 * 机器人概览统计
 */
export interface BotAccountOverview {
    groups: number
    subscriptionGroups: number
    push: {
        sent: number
        failed: number
        pending: number
    }
    quota: BotPushQuotaItem
    /**
     * 各群今日推送额度
     */
    groupQuotas?: BotGroupQuotaItem[]
    /**
     * 所选范围内的群组错误日志
     */
    errors?: BotOverviewErrors
    access: {
        allowed: boolean
        tier: string | null
        multiplier: number
        unlimited: boolean
    }
    /**
     * 本月签到统计
     */
    signin?: BotOverviewSignin
    /**
     * 群消息与指令统计
     */
    messages?: BotOverviewMessages
}

/**
 * 概览统计的单群每日数据
 */
export interface BotOverviewDayPoint {
    date: string
    count: number
}

/**
 * 折线图上可悬浮的数据点
 */
export interface BotOverviewChartPoint extends BotOverviewDayPoint {
    x: number
    y: number
    tipX: number
    tipY: number
}

/**
 * 概览统计的单群曲线
 */
export interface BotOverviewSeries {
    groupOpenid: string
    groupName: string
    days: BotOverviewDayPoint[]
}

/**
 * 本月签到统计与排行
 */
export interface BotOverviewSignin {
    month: string
    series: BotOverviewSeries[]
    top: Array<{
        openid: string
        username: string
        groupOpenid: string
        groupName: string
        platform: string
        days: number
    }>
    total: number
}

/**
 * 消息类型计数
 */
export interface BotMessageTypeCounts {
    text: number
    image: number
    video: number
    forward: number
    card: number
    other: number
}

/**
 * 群消息类型、曲线与指令使用统计
 */
export interface BotOverviewMessages {
    series: BotOverviewSeries[]
    types: BotMessageTypeCounts
    /**
     * 按群拆分的消息类型计数
     */
    typesByGroup?: Array<{
        groupOpenid: string
        groupName: string
        types: BotMessageTypeCounts
    }>
    commands: Array<{command: string; count: number}>
    /**
     * 按群拆分的指令调用次数
     */
    commandsByGroup?: Array<{
        groupOpenid: string
        groupName: string
        commands: Array<{command: string; count: number}>
    }>
    /**
     * 按群、按天拆分的指令调用明细，用于每日指令柱状图
     */
    commandDailyByGroup?: Array<{
        groupOpenid: string
        groupName: string
        days: Array<{
            date: string
            commands: Array<{command: string; count: number}>
        }>
    }>
    /**
     * 未开启全量消息模式的群，统计会偏少
     */
    partialModeGroups: Array<{groupOpenid: string; groupName: string; recvMsgSetting: string}>
}
