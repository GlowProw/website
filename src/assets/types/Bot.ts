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
}

/**
 * 机器人指令目录项
 */
export interface BotCommandInfo {
    name: string
    prefixes: string[]
    primary: string
    usage: string
    description: string
    hasHelp: boolean
    adminOnly: boolean
}

/**
 * 面板执行指令的返回结果
 */
export interface BotCommandResult {
    matched: boolean
    command?: string
    reply: string
    sent: boolean
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
    access: {
        allowed: boolean
        tier: string | null
        multiplier: number
        unlimited: boolean
    }
}
