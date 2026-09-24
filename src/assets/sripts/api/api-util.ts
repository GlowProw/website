import { ApiError, ApiResponseSuccess } from "@/assets/types/Api";

const formatMessage = (msg: any): string => {
    if (!msg) return 'ApiError';
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object') {
        try { return msg.message || JSON.stringify(msg); } catch { return String(msg); }
    }
    return String(msg);
};

/**
 * 统一错误处理
 */
export const handleApiError = (error: any): never => {
    console.error(error)
    const errorData = error.response?.data;
    const isRateLimited = error.response?.status === 429 || errorData?.code === 'request.rateLimited' || errorData?.code === 'rate.limit';
    const code = isRateLimited ? 'request.rateLimited' : (errorData?.code || 'error');
    throw new ApiError(
        formatMessage(errorData?.message || (isRateLimited ? 'Too many requests, please slow down.' : error.message)),
        code,
        errorData?.error || 1,
        error.response
    )
};

/**
 * 统一响应检查
 */
export const handleApiResponse = (response: any): ApiResponseSuccess => {
    const responseData = response.data;

    if (responseData.error === 1) {
        throw new ApiError(
            formatMessage(responseData.message),
            responseData.code,
            responseData.error,
            response
        )
    }

    return {
        code: responseData.code,
        data: responseData,
        message: responseData.message,
        success: 1
    };
};

/**
 * 创建 API 基础功能
 */
export const createApiBase = () => {
    const handleError = handleApiError;
    const handleResponse = handleApiResponse;

    return {
        handleError,
        handleResponse
    };
};
