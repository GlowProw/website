/**
 * 成功
 * 请求接口返回体
 */
export interface ApiResponseSuccess<T = any> {
    code: string;
    success?: boolean | number;
    data?: T;
    message?: string;
}

/**
 * 错误
 * 请求接口返回体
 */
export interface ApiResponseError<T = any> {
    code: string;
    error: number;
    data?: T;
    message?: string;
}

/**
 * 接口错误实体
 */
export class ApiError extends Error {
    public code: string;
    public error: number;
    public response?: any;

    constructor(message: string, code: string = 'UNKNOWN_ERROR', error: number = 1, response?: any) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.error = error;
        this.response = response;
    }
}
