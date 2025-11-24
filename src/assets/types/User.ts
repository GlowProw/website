export interface ChangePasswordParams {
    oldPassword: string
    newPassword: string
}

/**
 * 用户数据
 * 存储本地数据结构
 */
export interface UserLocalResult {
    token: string
    userId: string
    privilege: string[]
    userAvatar?: string
    username?: string
    alternativeName?: string
}
