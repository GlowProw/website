import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";
import {ApiError} from "@/assets/types/Api";

export interface SmugglersReport {
    id: number;
    title: string;
    content: any;
    createdBy: number;
    createdTime: string;
    updatedTime: string;
    deletedTime: string | null;
    status: 'draft' | 'published' | 'archived';
    commentIds: number[] | null;
    author_name?: string;
    author_avatar?: string;
    comment_count?: number;
    isUserComment?: boolean;
}

export interface CreateReportParams {
    title: string;
    startTime: string;
    endTime: string;
    content: any;
    status?: 'draft' | 'published' | 'archived';
}

export interface UpdateReportParams {
    title?: string;
    content?: any;
    status?: 'draft' | 'published' | 'archived';
}

export interface ReportListParams {
    page?: number;
    pageSize?: number;
    status?: 'draft' | 'published' | 'archived';
    search?: string;
    sortBy?: 'createdTime' | 'updatedTime';
    sortOrder?: 'asc' | 'desc';
}

export interface ReportListResponse {
    data: SmugglersReport[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}

export interface CreateReportCommentParams {
    content: string;
}

export interface ReportComment {
    id: number;
    content: string;
    createdTime: string;
    updatedTime: string;
    username: string;
    avatar?: string;
}

export interface ReportCommentListResponse {
    items: ReportComment[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}

export interface PrivilegeCheckResponse {
    hasPrivilege: boolean;
    userId: number;
}

/**
 * 走私犯周报 API 服务
 */
export function useSmugglersApi() {
    const http = useHttpToken();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 检查权限
     */
    const checkPrivilege = async (privileges: string[]) => {
        try {
            const result = await http.post('smugglers/privileges/check', {
                data: {
                    privileges
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取周报列表
     */
    const getReports = async (params: ReportListParams) => {
        try {
            const result = await http.get('smugglers/reports', {
                params: {
                    page: params.page || 1,
                    pageSize: params.pageSize || 10,
                    status: params.status,
                    search: params.search,
                    sortBy: params.sortBy || 'createdTime',
                    sortOrder: params.sortOrder || 'desc'
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取符合当前时间周报
     */
    const getRangeTimeReport = async (date?: Date | string) => {
        try {
            const result = await http.get('smugglers/reports/byTime', {
                params: {
                    date: date ?? new Date()
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取周报详情
     */
    const getReport = async (reportId: number) => {
        try {
            const result = await http.get(`smugglers/reports/${reportId}`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 创建周报
     */
    const createReport = async (data: CreateReportParams) => {
        try {
            const result = await http.post('smugglers/reports', {
                data: {
                    title: data.title,
                    content: data.content,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: data.status || 'draft'
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 更新周报
     */
    const updateReport = async (reportId: number, data: UpdateReportParams) => {
        try {
            const result = await http.put(`smugglers/reports/${reportId}`, {
                data: {
                    title: data.title,
                    content: data.content,
                    status: data.status
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 删除周报
     */
    const deleteReport = async (reportId: number) => {
        try {
            const result = await http.del(`smugglers/reports/${reportId}`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取周报评论列表
     */
    const getReportComments = async (
        reportId: number | string,
        page?: number,
        pageSize?: number
    ) => {
        try {
            const result = await http.get(`smugglers/reports/${reportId}/comments`, {
                params: {
                    page: page || 1,
                    pageSize: pageSize || 10
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 添加评论到周报
     */
    const addReportComment = async (
        reportId: string,
        data: CreateReportCommentParams
    ) => {
        try {
            const result = await http.post(`smugglers/reports/${reportId}/comments`, {
                data: {
                    content: data.content
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 添加评论到周报
     */
    const editReportComment = async (
        reportId: string,
        commentId: string,
        data: CreateReportCommentParams
    ) => {
        try {
            const result = await http.put(`smugglers/reports/${reportId}/comments/${commentId}`, {
                data: {
                    content: data.content
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 删除周报评论
     */
    const delReportComment = async (reportId: string,) => {
        try {
            const result = await http.del(`smugglers/reports/${reportId}`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    }

    /**
     * 发布周报
     */
    const publishReport = async (reportId: number) => {
        try {
            const result = await http.post(`smugglers/reports/${reportId}/publish`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 归档周报
     */
    const archiveReport = async (reportId: number) => {
        try {
            const result = await http.post(`smugglers/reports/${reportId}/archive`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取用户创建的周报列表
     */
    const getMyReports = async (
        page?: number,
        pageSize?: number,
        status?: string
    ) => {
        try {
            const result = await http.get('smugglers/my-reports', {
                params: {
                    page: page || 1,
                    pageSize: pageSize || 10,
                    status: status
                }
            });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    return {
        // 权限相关
        checkPrivilege,

        // 周报CRUD
        getReports,
        getRangeTimeReport,
        getReport,
        createReport,
        updateReport,
        deleteReport,
        publishReport,
        archiveReport,
        getMyReports,

        // 评论相关
        getReportComments,
        addReportComment,
        editReportComment,
        delReportComment
    };
}
