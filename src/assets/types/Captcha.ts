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

/**
 * Cloudflare Turnstile 预置 Key（测试与生产）
 */
export const TURNSTILE_KEYS = {
    TEST: '1x00000000000000000000AA', // 测试环境（始终通过）
    PROD: '0x4AAAAAAFBpwUqxVGBIoKa4'  // 生产环境
} as const

