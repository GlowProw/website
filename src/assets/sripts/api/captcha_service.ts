import {ApiError, ApiResponseSuccess} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";

export function useCaptchaApi() {
    const http = useHttpToken();

    /**
     * 错误处理
     */
    const handleError = (error: any): never => {
        console.error(error);
        const errorData = error.response?.data;
        throw new ApiError(
            errorData?.message || error.message,
            errorData?.code || 'UNKNOWN_ERROR',
            errorData?.error || 1,
            error.response
        );
    };

    /**
     * 响应并检查错误
     */
    const handleResponseWithErrorCheck = (response: any): ApiResponseSuccess => {
        const responseData = response.data;

        if (responseData.error === 1) {
            throw new ApiError(
                responseData.message,
                responseData.code,
                responseData.error,
                response
            );
        }

        return {
            code: responseData.code,
            data: responseData,
            message: responseData.message,
            success: 1
        };
    };

    /**
     * 获取当前用户信息
     */
    const get = async (options: { isUpdateTime: boolean } = {isUpdateTime: true}) => {
        try {
            const result = await http.get('captcha', {
                params: {...options.isUpdateTime ? {t: Math.random()} : {}}
            });
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    return {
        get
    }
}
