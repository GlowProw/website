import { ApiError, ApiResponseSuccess } from "@/assets/types/Api";

/**
 * 统一错误处理
 */
export const handleApiError = (error: any): never => {
    console.error(error)
    const errorData = error.response?.data;
    throw new ApiError(
        errorData?.message || error.message,
        errorData?.code || 'error',
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
            responseData.message,
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
