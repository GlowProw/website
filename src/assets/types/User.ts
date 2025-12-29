/**
 * 属性
 */
export interface UserAttr {
    introduction: string
}

/**
 * 用户身份
 */
export type UserPrivilege = 'normal' | 'admin' | 'super' | 'root' | 'dev' | 'blacklisted' | 'freezed'

/**
 * 用户实体
 */
export interface User {
    attr: UserAttr
    id: string
    uuid?: string
    lastOnlineTime?: string
    privilege: UserPrivilege[]
    userAvatar?: string
    username: string
}

/**
 * 改变密码请求体
 */
export interface SpaceUserResult extends User {
    joinTime?: string
}

/**
 * 改变密码请求体
 */
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
    role: string[]
    userAvatar?: string
    username?: string
    alternativeName?: string
}
