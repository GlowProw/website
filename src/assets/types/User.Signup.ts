import {CaptchaParams} from "@/assets/types/Captcha";

/**
 * 注册请求体
 */
export interface SignupParams {
    username: string
    alternativeName: string
    password: string
    email: string
    captcha: CaptchaParams
}
