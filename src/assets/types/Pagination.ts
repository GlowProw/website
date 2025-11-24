/**
 * 分页请求参数
 */
export interface PaginationParams {
    page?: number
    pageSize?: number
}

/**
 * 分页返回统计数据
 */
export interface PaginationResult {
    page: number
    pageSize: number
    total: number
    totalPages: number
}
