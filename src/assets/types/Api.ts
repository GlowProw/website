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

    constructor(message: any, code: string = 'UNKNOWN_ERROR', error: number = 1, response?: any) {
        const formattedMsg = typeof message === 'string'
            ? message
            : (message && typeof message === 'object' ? (message.message || JSON.stringify(message)) : String(message || 'ApiError'));
        super(formattedMsg);
        this.name = 'ApiError';
        this.code = code;
        this.error = error;
        this.response = response;
    }
}
