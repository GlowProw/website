import { useHttpToken } from "@/assets/sripts/http_util";
import { PaginationParams } from "@/assets/types";
import { UserSpaceAssemblysQuery } from "@/assets/types/Assembly";
import { UserSpaceTeamupsQuery } from "@/assets/types/Teamup";
import { SigninParams } from "@/assets/types/User.Login";
import { SignupParams } from "@/assets/types/User.Signup";
import { ChangePasswordParams, ForgotPasswordParams, ResetPasswordParams } from "@/assets/types/User";
import { ApiError } from "@/assets/types/Api";
import { CaptchaParams } from "@/assets/types/Captcha";
import { createApiBase } from "@/assets/sripts/api/api-util";

export interface AvatarPreset {
    id?: string
    path: string
    url: string
    name: string
}

export interface AvatarResult {
    path: string
    url: string
}

export interface AvatarQuota {
    /**
     * 总额度上限
     */
    total: number
    /**
     * 已使用次数
     */
    used: number
    /**
     * 剩余可用次数
     */
    remaining: number
    /**
     * 冷却周期毫秒数
     */
    cooldownMs: number
    /**
     * 上次上传时间戳
     */
    lastUploadAt: number | null
    /**
     * 下次可更换时间
     */
    nextAvailableAt: string | null
    /**
     * 当前是否还有上传额度
     */
    canUpload?: boolean
}

/**
 * 用户接口
 */
export function useUserApi() {
    const createHttp = () => useHttpToken()
    const http = createHttp()
    const { handleError, handleResponse } = createApiBase()

    /**
     * 用户登录
     */
    const signin = async (data: SigninParams) => {
        try {
            const result = await http.post('user/signin', { data })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 用户注册
     */
    const signup = async (data: SignupParams) => {
        try {
            const result = await http.post('user/signup', { data })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取当前用户信息
     */
    const getMe = async () => {
        try {
            const result = await http.get('user/me')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取当前用户信息
     */
    const updateMeAttr = async (attr: any) => {
        try {
            const result = await http.post('user/me', { data: { attr } })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取用户信息
     * 公开接口
     */
    const getUserInfo = async (userId?: string) => {
        try {
            const result = await http.get('user/info', {
                params: { id: userId }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取用户空间资料（受“公开用户空间”开关保护，关闭时非本人返回 403）
     */
    const getSpaceUserInfo = async (userId: string) => {
        try {
            const result = await http.get('user/space/info', {
                params: { id: userId }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 修改密码
     * @param data
     */
    const changePassword = async (data: ChangePasswordParams) => {
        try {
            const result = await http.put('user/changePassword', { data })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
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
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取站内用户组队列表
     * @param userId
     * @param params 分页与筛选参数
     */
    const getUserTeamups = async (userId: string, params?: UserSpaceTeamupsQuery) => {
        try {
            const url = `user/space/teamups`;
            const result = await http.get(url, {
                params: { ...params, id: userId }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取站内用户组队列表
     * @param pagination
     */
    const getMeTeamups = async (pagination?: PaginationParams) => {
        try {
            const url = `user/me/teamups`;
            const result = await http.get(url, {
                params: { ...pagination }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取站内用户配装列表
     * @param userId
     * @param params 分页与筛选参数
     */
    const getUserAssemblys = async (userId: string, params?: UserSpaceAssemblysQuery) => {
        try {
            const url = `user/space/assemblys`;
            const result = await http.get(url, {
                params: { ...params, id: userId }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取自己配装列表
     * @param pagination
     */
    const getMeAssemblys = async (pagination?: PaginationParams) => {
        try {
            const url = `user/me/assemblys`;
            const result = await http.get(url, {
                params: { ...pagination }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取自己订单列表（包含订阅赞助记录）
     * @param params 分页与筛选参数
     */
    const getMyOrders = async (params?: { page?: number; pageSize?: number; status?: string; platform?: string; keyword?: string }) => {
        try {
            const url = `user/me/orders`;
            const result = await http.get(url, {
                params: { ...params }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取用户评论
     * @param pagination
     */
    const getUserComments = async (pagination?: PaginationParams) => {
        try {
            const result = await http.get('user/comments', {
                params: { ...pagination }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取用户点赞
     */
    const getUserLikes = async (userId?: string, pagination?: PaginationParams) => {
        try {
            const url = userId ? `user/space/likes` : 'user/likes';
            const result = await http.get(url, {
                params: { ...pagination, userId }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 激活账户
     */
    const activate = async (data: { username: string, code: string }) => {
        try {
            const result = await http.post('user/activate', { data })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    }

    /**
     * 请求更换邮箱验证码
     */
    const requestEmailChangeCode = async (newEmail: string) => {
        try {
            const result = await http.post('user/request-email-change', {
                data: { newEmail }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    }

    /**
     * 确认更换邮箱
     */
    const confirmEmailChange = async (newEmail: string, code: string) => {
        try {
            const result = await http.post('user/confirm-email-change', {
                data: { newEmail, code }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    }

    /**
     * 重新发送激活邮件
     */
    const resendActivationCode = async (username: string) => {
        try {
            const result = await http.post('user/resend-activation-code', {
                data: { username }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    }

    /**
     * 忘记密码 - 发送验证码
     */
    const forgotPassword = async (data: ForgotPasswordParams) => {
        try {
            const result = await http.post('user/forgot-password', {
                data
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    }

    /**
     * 重置密码 - 确认重置
     */
    const resetPassword = async (data: ResetPasswordParams) => {
        try {
            const result = await http.post('user/reset-password', {
                data
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    }

    /**
     * 获取支持的第三方登录提供商
     */
    const getOAuthProviders = async () => {
        try {
            const result = await http.get('user/oauth/providers')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 获取第三方授权跳转 URL
     */
    const getOAuthUrl = async (platform: string, redirectUrl?: string) => {
        try {
            const result = await http.get(`user/oauth/${platform}/url`, {
                params: { redirectUrl }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 处理第三方授权回调
     */
    const oauthCallback = async (platform: string, data: { code: string; state?: string }) => {
        try {
            // 第三方回调 设置 20 秒超时
            const timeout = platform === 'qq' ? 20000 : 20000;
            const result = await http.post(`user/oauth/${platform}/callback`, { data, timeout })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 第三方登录新用户补充注册
     */
    const oauthCompleteSignup = async (data: { oauthTicket: string; username: string; alternativeName?: string; password: string; email?: string; captcha: CaptchaParams }) => {
        try {
            const result = await http.post('user/oauth/complete-signup', { data })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 第三方登录绑定已有账号
     */
    const oauthCompleteBind = async (data: { oauthTicket: string; username: string; password: string; captcha: CaptchaParams }) => {
        try {
            const result = await http.post('user/oauth/complete-bind', { data })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 获取当前用户的所有第三方绑定
     */
    const getUserBindings = async () => {
        try {
            const result = await http.get('user/account/bindings')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 解绑第三方平台
     */
    const unbindOAuth = async (platform: string) => {
        try {
            const result = await http.post(`user/account/bindings/${platform}/unbind`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 获取预设头像列表
     */
    const getAvatarPresets = async (): Promise<AvatarPreset[]> => {
        try {
            const result = await http.get('user/avatar/presets')
            const res = handleResponse(result)

            return (res as any)?.data?.data?.presets || (res as any)?.data?.presets || []
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 选择预设头像
     */
    const setPresetAvatar = async (path: string): Promise<AvatarResult> => {
        try {
            const result = await http.post('user/avatar/preset', { data: { path } })
            const res = handleResponse(result)
            return (res as any)?.data?.data || (res as any)?.data || res
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 上传自定义头像
     */
    const uploadAvatar = async (file: File): Promise<AvatarResult> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            const result = await http.post('user/avatar/upload', { data: formData })
            const res = handleResponse(result)
            return (res as any)?.data?.data || (res as any)?.data || res
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 获取用户头像上传额度与冷却状态
     */
    const getAvatarQuota = async (): Promise<AvatarQuota> => {
        try {
            const result = await http.get('user/avatar/quota')
            const res = handleResponse(result)
            return (res as any)?.data?.data || (res as any)?.data || res
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    /**
     * 删除自定义头像（恢复为默认头像或 Gravatar）
     *
     * @returns {Promise<AvatarResult>} 删除操作结果
     */
    const deleteAvatar = async (): Promise<AvatarResult> => {
        try {
            const result = await http.delete('user/avatar')
            const res = handleResponse(result)
            return (res as any)?.data?.data || (res as any)?.data || res
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error)
        }
    }

    return {
        signin,
        signup,
        getMe,
        updateMeAttr,
        getUserInfo,
        getSpaceUserInfo,
        changePassword,
        changeAlternativeName,
        getUserTeamups,
        getMeTeamups,
        getUserAssemblys,
        getMeAssemblys,
        getMyOrders,
        getUserComments,
        getUserLikes,
        activate,
        requestEmailChangeCode,
        confirmEmailChange,
        resendActivationCode,
        forgotPassword,
        resetPassword,
        getOAuthProviders,
        getOAuthUrl,
        oauthCallback,
        oauthCompleteSignup,
        oauthCompleteBind,
        getUserBindings,
        unbindOAuth,
        getAvatarPresets,
        setPresetAvatar,
        uploadAvatar,
        getAvatarQuota,
        deleteAvatar,
        getUserSessions: async () => {
            try {
                const result = await http.get('user/sessions')
                return handleResponse(result)
            } catch (error) {
                if (error instanceof ApiError) throw error;
                return handleError(error)
            }
        },
        revokeOtherSessions: async () => {
            try {
                const result = await http.post('user/sessions/revoke-others', {})
                return handleResponse(result)
            } catch (error) {
                if (error instanceof ApiError) throw error;
                return handleError(error)
            }
        },
        revokeUserSession: async (sessionId: string) => {
            try {
                const result = await http.delete(`user/sessions/${sessionId}`)
                return handleResponse(result)
            } catch (error) {
                if (error instanceof ApiError) throw error;
                return handleError(error)
            }
        },
    };
}
