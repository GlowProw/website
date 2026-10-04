/**
 * 任务/剧情流程图 (Storyline / Quest Flow) 相关类型定义
 */

export interface FlowBranch {
    branchKey: string;
    branchIndex: number;
    branchTotal: number;
    quests: string[];
    targetMerge: string | null;
    containsActive: boolean;
}

export interface FlowStep {
    type: 'single' | 'fork' | 'merge';
    questId?: string;
    parents?: string[];
    children?: string[];
    forkFrom?: string;
    branches?: FlowBranch[];
    containsActive?: boolean;
}

export interface StoryArc {
    arcId: string;
    arcIndex: number;
    arcTotal: number;
    totalQuests: number;
    containsActive: boolean;
    steps: FlowStep[];
}
