import { ApiError } from "@/assets/types/Api";

export interface SmugglersReport {
    id: number;
    title: string;
    content: ReportContent;
    createdBy: number;
    created_time: string;
    updatedTime: string;
    deletedTime: string | null;
    status: 'draft' | 'published' | 'archived';
    commentIds: number[] | null;
    author_name?: string;
    author_avatar?: string;
    comment_count?: number;
}

export interface ReportContent {
    items: ReportItem[];
    summary?: string;
    market_analysis?: string;
}

export interface ReportItem {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
    location: string;
    availability: 'high' | 'medium' | 'low';
    risk_level: 'low' | 'medium' | 'high';
    description?: string;
}

// 创建周报参数
export interface CreateReportParams {
    title: string;
    content: ReportContent;
    status?: 'draft' | 'published' | 'archived';
}

// 更新周报参数
export interface UpdateReportParams {
    title?: string;
    content?: ReportContent;
    status?: 'draft' | 'published' | 'archived';
}

// 周报列表查询参数
export interface ReportListParams {
    page?: number;
    pageSize?: number;
    status?: 'draft' | 'published' | 'archived';
    search?: string;
    sortBy?: 'created_time' | 'updatedTime';
    sortOrder?: 'asc' | 'desc';
}

// 周报列表响应
export interface ReportListResponse {
    data: SmugglersReport[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}

// 创建评论参数
export interface CreateReportCommentParams {
    content: string;
}

// 评论项
export interface ReportComment {
    id: number;
    content: string;
    createdTime: string;
    updatedTime: string;
    username: string;
    avatar?: string;
}

// 评论列表响应
export interface ReportCommentListResponse {
    items: ReportComment[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}

// 权限检查响应
export interface PrivilegeCheckResponse {
    hasPrivilege: boolean;
    userId: number;
}

// API错误类型
export class SmugglersApiError extends ApiError {
    constructor(message: string, code?: string, details?: any) {
        super(message, code, details);
        this.name = 'SmugglersApiError';
    }
}
