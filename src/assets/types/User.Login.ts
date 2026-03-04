import {CaptchaParams} from "@/assets/types/Captcha";

export interface SigninParams {
    username: string,
    password: string,
    captcha: CaptchaParams
}
