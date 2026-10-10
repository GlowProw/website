/**
 * 精通 (Mastery) 相关类型定义
 */
import type {Mastery, MasteryEdge} from "glow-prow-data";

/**
 * 精通方案存储数据
 * 与分享码 payload {v,s,n,sp} 语义一致，但使用可读字段名持久化
 */
export interface MasterySaveData {
    __version?: string;
    // 赛季 id
    season?: string;
    // 已激活常规节点 key 列表
    nodes?: string[];
    // 已选择赛季特长节点 key 列表
    perks?: string[];

    // 兼容分享码形态
    s?: string;
    n?: string[];
    sp?: string[];
}

export interface VersionedDataProcessing<T> {
    get: (data: T) => any;
    set: (data: T) => T;
    verify: (data: T) => { valid: boolean; errors?: string[] };
}

export type MasteryDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};

export interface EffectContributor {
  skillKey: string;
  skillName: string;
  skillCategory: string;
  buffCount: number;
  values: Record<string, number>;
  contributionText: string;
}

export interface AggregatedEffect {
  id: string;
  name: string;
  renderedDescription: string;
  contributors: EffectContributor[];
}

export interface NodeRequirementItem {
  key: string;
  id: string;
  name: string;
  isActive: boolean;
  isRequisite: boolean;
  isConnectedActive: boolean;
}

export interface MasterySavedBuild {
  id: string;
  name: string;
  season: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

export interface DebugContextMenu {
  // 屏幕坐标（fixed 定位）
  sx: number;
  sy: number;
  // 世界坐标（新增节点用）
  wx: number;
  wy: number;
  node: Mastery | null;
  // 命中的连线（在两节点之间插入节点用）
  edge: MasteryEdge | null;
}
