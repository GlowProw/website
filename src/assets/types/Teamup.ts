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
