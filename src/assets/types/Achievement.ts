/**
 * 账户成长相关类型，与后端 /api/user/account 返回结构对齐
 */

/**
 * 账户等级定义
 */
export interface AccountLevel {
    level: number;
    key: string;
    threshold: number;
}

export type AchievementCategory =
    | 'assembly'
    | 'mastery'
    | 'signin'
    | 'teamup'
    | 'subscription'
    | 'comment'
    | 'codex'
    | 'personalization'
    | 'security'
    | 'bot';

export type AchievementMode = 'active' | 'passive';

/**
 * locked 未达成，claimable 可领取，obtained 已获得
 */
export type AchievementStatus = 'locked' | 'claimable' | 'obtained';

/**
 * 单个成就的展示状态
 */
export interface AchievementItem {
    key: string;
    category: AchievementCategory;
    mode: AchievementMode;
    points: number;
    requirement: number;
    repeatable: boolean;
    status: AchievementStatus;
    times: number;
    earnedPoints: number;
    obtainedTime: string | null;
    claimedTime: string | null;
}

/**
 * 成就总览
 */
export interface AchievementOverview {
    points: number;
    level: AccountLevel;
    nextLevel: AccountLevel | null;
    progress: number;
    levels: AccountLevel[];
    achievements: AchievementItem[];
}

/**
 * 公开成就摘要中的已获得条目
 */
export interface PublicAchievementItem {
    key: string;
    category: AchievementCategory;
    points: number;
    obtainedTime: string | null;
}

/**
 * 公开成就摘要，hidden 为 true 时表示用户关闭了成就展示
 */
export interface PublicAchievementSummary {
    hidden: boolean;
    points?: number;
    level?: AccountLevel;
    nextLevel?: AccountLevel | null;
    progress?: number;
    achievements?: PublicAchievementItem[];
}

/**
 * 签到日历中的单日状态
 */
export interface SigninCalendarDay {
    date: string;
    signed: boolean;
    type: 'normal' | 'makeup' | null;
    platform: string | null;
    future: boolean;
}

/**
 * 签到状态
 */
export interface SigninStatus {
    today: string;
    month: string;
    todaySigned: boolean;
    streakDays: number;
    lastSignDate: string | null;
    points: number;
    makeupUsed: number;
    makeupFree: number;
    contributorBonus: number;
    streakBonus: number;
    makeupTotal: number;
    makeupRemaining: number;
    calendar: SigninCalendarDay[];
}

/**
 * 签到记录
 */
export interface SigninRecord {
    id: number;
    date: string;
    platform: string;
    points: number;
    streakDays: number;
    type: 'normal' | 'makeup';
    createdTime: string;
}

export interface SigninRecordsResult {
    month: string;
    records: SigninRecord[];
}

/**
 * 已取得标记的目标类型，后续可扩展到配装等实体
 */
export type CollectionTargetType = 'item';

/**
 * 已取得状态
 */
export interface CollectionState {
    targetType: CollectionTargetType | string;
    targetId: string;
    collected: boolean;
}
