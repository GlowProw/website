/**
 * 分页请求参数
 */
export interface PaginationParams {
    page?: number | string
    pageSize?: number | string
}

/**
 * 分页返回统计数据
 */
export interface PaginationResult {
    page: number | string
    pageSize: number | string
    total: number | string
    totalPages: number | string
}
