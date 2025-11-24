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
