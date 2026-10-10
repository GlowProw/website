/**
 * 视频相关类型定义
 */

export type VideoUrlError = 'invalid' | 'unsupported' | 'b23tv'

export interface NormalizeVideoResult {
    ok: boolean
    embed?: boolean
    url?: string
    reason?: VideoUrlError
}
