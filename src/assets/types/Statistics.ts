/**
 * 全站公开统计（事态）相关类型，与后端 /api/public/stats 结构对齐
 */

export type PublicStatsRange = '7' | '30' | '90';

/**
 * 指标值及其与上一区间的对比
 */
export interface PublicStatsMetric {
    value: number;
    previous: number;
    change: number;
    changeRate: number | null;
}

/**
 * 分组指标项
 */
export interface PublicStatsGroupMetric extends PublicStatsMetric {
    key: string;
}

/**
 * 统计区间
 */
export interface PublicStatsPeriod {
    start: string;
    end: string;
}

/**
 * 图鉴统计结果
 */
export interface PublicCodexStats {
    range: PublicStatsRange;
    asOf: string;
    period: PublicStatsPeriod;
    previousPeriod: PublicStatsPeriod;
    metrics: {
        collections: PublicStatsMetric;
        collectors: PublicStatsMetric;
        dailyAverage: PublicStatsMetric;
        coveredTypes: PublicStatsMetric;
    };
    byType: PublicStatsGroupMetric[];
    daily: Array<{ date: string; value: number; previousValue: number }>;
    updatedAt: number;
}

/**
 * 签到统计结果
 */
export interface PublicSigninStats {
    range: PublicStatsRange;
    asOf: string;
    period: PublicStatsPeriod;
    previousPeriod: PublicStatsPeriod;
    metrics: {
        signins: PublicStatsMetric;
        users: PublicStatsMetric;
        dailyAverage: PublicStatsMetric;
        makeup: PublicStatsMetric;
    };
    byPlatform: PublicStatsGroupMetric[];
    daily: Array<{ date: string; value: number; previousValue: number }>;
    updatedAt: number;
}

/**
 * 单个赛季的图鉴汇总
 */
export interface PublicSeasonSummary {
    season: string;
    name: string;
    entries: number;
    collected: number;
    startDate: string | null;
    byType: Array<{targetType: string; count: number}>;
}

/**
 * 赛季统计结果
 */
export interface PublicSeasonStats {
    asOf: string;
    totals: {
        entries: number;
        seasons: number;
        collections: number;
    };
    seasons: PublicSeasonSummary[];
    updatedAt: number;
}

/**
 * 赛季图鉴条目与类型分组
 */
export interface PublicSeasonItems {
    season: string;
    entries: number;
    groups: Array<{
        targetType: string;
        items: Array<{id: string}>;
    }>;
}

/**
 * 单个图鉴条目的周度取得情况
 */
export interface PublicCodexItemWeek {
    weekStart: string;
    weekEnd: string;
    rate: number;
    collectors?: number;
    newCollectors?: number;
}

/**
 * 单个图鉴条目的全站统计结果
 */
export interface PublicCodexItemStats {
    targetType: string;
    targetId: string;
    asOf: string;
    rate: number;
    weekly: PublicCodexItemWeek[];
    updatedAt: number;
    totalUsers?: number;
    collectors?: number;
}

/**
 * 统计页概览卡片展示数据
 */
export interface PublicStatsCardItem {
    key: string;
    title: string;
    value: number;
    icon: string;
    color: string;
    series: number[];
    detail: string;
    change: number;
    changeRate: number | null;
}

/**
 * 统计栏目二级导航项
 */
export interface StatisticsTabItem {
    name: string;
    value: string;
    icon: string;
}
