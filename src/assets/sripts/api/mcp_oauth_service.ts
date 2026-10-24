import { http as apiHttp } from "@/assets/sripts";
import { ApiError } from "@/assets/types/Api";
import { createApiBase } from "@/assets/sripts/api/api-util";

/**
 * MCP OAuth 行为端点统一挂在 /api/mcp 下，与前端接口 base（/api/）同前缀，
 * 直接使用相对路径即可（get/post 会自动拼接为 /api/mcp/consent）。
 */
const CONSENT_PATH = "mcp/consent";

export interface McpConsentClient {
    clientName: string;
    clientUri: string | null;
    logoUri: string | null;
}

export interface McpConsentInfo {
    client: McpConsentClient;
    scope: string;
    scopeDescription: string;
    redirectUri: string;
    state: string | null;
}

export interface McpConsentResult {
    ok?: boolean;
    redirectTo?: string;
    error?: string;
    code?: string;
    error_description?: string;
}

/**
 * MCP OAuth 同意页接口（AI 连接器授权）
 * 对应后端 src/routers/mcp_oauth.ts 的 GET/POST /api/mcp/consent
 */
export function useMcpOAuthApi() {
    const { handleResponse, handleError } = createApiBase();

    /**
     * 拉取本次授权的客户端信息与权限范围
     */
    const getConsent = async (code: string) => {
        try {
            const result = await apiHttp.get(CONSENT_PATH, { params: { code } });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 提交授权决定（allow / deny）
     * 成功返回 { ok: true, redirectTo }，由调用方整页跳转到 redirectTo
     */
    const submitConsent = async (code: string, decision: "allow" | "deny") => {
        try {
            const result = await apiHttp.post(CONSENT_PATH, { data: { code, decision } });
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    return { getConsent, submitConsent };
}
