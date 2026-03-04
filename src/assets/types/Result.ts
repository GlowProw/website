/**
 * 回应结构体
 */
export interface ResultBase {
    error?: number
    code: string
    message?: string
}

export interface ResultData<T = any> extends ResultBase {
    data: T
}
