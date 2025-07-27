// JWT 认证中间件
import {Request} from "express";

// 认证请求
export interface AuthenticatedRequest extends Request {
    userId?: string;
}

// 响应内容
export interface RequestHasAccount extends Request {
    user?: any
}

export interface Token {
    userId: number,
    username?: string,
    signWhen: number,
    expiresIn: number
}
