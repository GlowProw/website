import { PaginationParams } from "./Pagination";

export interface TeamupItem {
    id: number | string;
    player: string;
    description: string;
    tags: string[];
    expiresAt: number;
    createdAt: number;
    username?: string | null;
    userId?: string | null;
}

export interface TeamupListParams extends PaginationParams {
    keyword?: string;
    sortBy?: 'recent' | 'expires' | string;
    page?: number;
    limit?: number;
}

/**
 * 用户空间组队列表查询参数
 */
export interface UserSpaceTeamupsQuery extends PaginationParams {
    sortOrder?: string;
    createdStart?: string | null;
    createdEnd?: string | null;
}

export interface CreateTeamupParams {
    player: string;
    description: string;
    expiresMinutesAt?: number;
    tags?: string[];
    fingerprint?: string;
}

export interface TeamupListResponse {
    success: number;
    code: string;
    data: TeamupItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
