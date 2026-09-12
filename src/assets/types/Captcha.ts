/**
 * 验证码模式
 */
export type CaptchaType = 'svg' | 'turnstile'

/**
 * 验证码请求体
 */
export interface CaptchaParams {
    type?: CaptchaType
    // 验证码哈希
    encryptCaptcha: string,
    // 用户输入
    response: string
}

/**
 * 验证码返回结构
 */
export interface CaptchaResult {
    content: string,
    hash: string
}
