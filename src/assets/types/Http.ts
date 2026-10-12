import {HttpMethod} from "../sripts/http";

/**
 * 请求结构
 */
export interface RequestOptions {
    method?: HttpMethod;
    body?: Record<string, any>;
    data?: Record<string, any>;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
}

/**
 * 请求地址结构
 */
export interface GetUrlOptions {
    protocol: string
    wsProtocol: string
    request: string
    wsRequest: string
    host: string
    wsHost: string
    pathname: string
    wsPathname: string
    port: string
    wsPort: string
}

export interface UseHttpOptions {
    withToken?: boolean;
    /**
     * 是否为外部资源请求
     * 不携带内部专属头 x-auth-gp 和 x-access-token）
     **/
    isExternal?: boolean;
}

export type WebSocketEventMap = {
    open: (event: Event) => void;
    close: (event: CloseEvent) => void;
    error: (event: Event) => void;
    message: (event: MessageEvent) => void;
};
