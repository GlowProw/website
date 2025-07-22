// JWT 认证中间件
export interface AuthenticatedRequest extends Request {
    userId?: string;
}
