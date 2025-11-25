import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 验证码接口
 */
export function useCaptchaApi() {
    const http = useHttpToken();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 获取当前用户信息
     */
    const get = async (options: { isUpdateTime: boolean } = {isUpdateTime: true}) => {
        try {
            const result = await http.get('captcha', {
                params: {...options.isUpdateTime ? {t: Math.random()} : {}}
            });
            return handleResponse(result);
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
