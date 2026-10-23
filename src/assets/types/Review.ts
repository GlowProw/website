/**
 * 内容审查状态
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

/**
 * 内容提交后返回的审查结果
 */
export interface ReviewResult {
    status: ReviewStatus
    reason: string | null
}
