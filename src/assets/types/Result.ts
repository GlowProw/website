/**
 * 回应结构体
 */
export interface ResultBase {
    error?: number
    code: string
    message?: string
}

export interface ResultData extends ResultBase {
    data: any[] | {} | null | unknown
}
