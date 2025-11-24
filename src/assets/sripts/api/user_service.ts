import {useHttpToken} from "@/assets/sripts/http_util";
import {PaginationParams} from "@/assets/types";
import {SigninParams} from "@/assets/types/User.Login";
import {SignupParams} from "@/assets/types/User.Signup";
import {ChangePasswordParams} from "@/assets/types/User";
import {ApiError, ApiResponseSuccess} from "@/assets/types/Api";

export function useUserApi() {
    const createHttp = () => useHttpToken();
    const http = createHttp();

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
     * 用户登录
     */
    const signin = async (data: SigninParams) => {
        try {
            const result = await http.post('user/signin', {data});
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 用户注册
     */
    const signup = async (data: SignupParams) => {
        try {
            const result = await http.post('user/signup', {data});
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取当前用户信息
     */
    const getMe = async () => {
        try {
            const result = await http.get('user/me');
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取当前用户信息
     */
    const updateMeAttr = async (attr) => {
        try {
            const result = await http.post('user/me', { data: {attr} });
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取用户信息
     */
    const getUserInfo = async (userId?: string) => {
        try {
            const url = userId ? `user/info/${userId}` : 'user/info';
            const result = await http.get(url);
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 修改密码
     * @param data
     */
    const changePassword = async (data: ChangePasswordParams) => {
        try {
            const result = await http.put('user/changePassword', { data });
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 修改昵称
     * @param alternativeName
     */
    const changeAlternativeName = async (alternativeName: string) => {
        try {
            const result = await http.put('user/changeAlternativeName', {
                data: {
                    username: alternativeName
                }
            });
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取用户评论
     * @param userId
     * @param pagination
     */
    const getUserComments = async (userId?: string, pagination?: PaginationParams) => {
        try {
            const url = userId ? `user/space/comments` : 'user/comments';
            const result = await http.get(url, {
                params: {...pagination, userId}
            });
            return handleResponseWithErrorCheck(result);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error);
        }
    };

    /**
     * 获取用户点赞
     */
    const getUserLikes = async (userId?: string, pagination?: PaginationParams) => {
        try {
            const url = userId ? `user/space/likes` : 'user/likes';
            const result = await http.get(url, {
                params: {...pagination, userId}
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
        signin,
        signup,
        getMe,
        updateMeAttr,
        getUserInfo,
        changePassword,
        changeAlternativeName,
        getUserComments,
        getUserLikes,
    };
}
