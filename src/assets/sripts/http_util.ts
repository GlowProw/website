/**
 * extends http
 * 用于需要token请求
 */
import { useAuthStore } from "~/stores/userAccountStore";
import { http } from "./index";
import { generateAuthGpHeader } from "./fingerprint_auth";

interface UseHttpOptions {
    withToken?: boolean;
    /** 
     * 是否为外部资源请求
     * 不携带内部专属头 x-auth-gp 和 x-access-token） 
     **/
    isExternal?: boolean;
}

/**
 * 基本请求
 * @param options 
 */
export function useHttp(options: UseHttpOptions = {}) {
    const { withToken = false, isExternal = false } = options;
    const authStore = useAuthStore();

    const addHeaders = (data: any, url?: string) => {
        const headers = data?.headers || {};

        // 外部请求或跨域绝对地址，不附加内部专有头
        const isUrlExternal = Boolean(url && /^https?:\/\//i.test(url) && http.host && !url.includes(http.host));
        if (isExternal || isUrlExternal) {
            return {
                ...data,
                isExternal: true,
                headers,
            };
        }

        if (withToken) {
            const token = authStore.user?.token;
            if (token && token !== '') {
                headers['x-access-token'] = token;
            }
        }

        if (!headers['x-auth-gp']) {
            headers['x-auth-gp'] = generateAuthGpHeader();
        }

        return {
            ...data,
            headers,
        };
    };

    // 响应拦截器只注册一次（避免重复注册）
    // 建议移到 http 实例初始化处，而不是放在这里
    http.HTTP.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.data?.code === 'user.tokenExpired') {
                authStore.logout();
            }
            return Promise.reject(error);
        }
    );

    const request = (url = '', data?: { data?: {}, params?: {}, headers?: {}, isExternal?: boolean }) => {
        return http.request(url, addHeaders(data, url));
    };

    const post = (url = '', data?: { data?: {} }) => {
        return http.post(url, addHeaders(data));
    };

    const get = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.get(url, addHeaders(data));
    };

    const put = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.put(url, addHeaders(data));
    };

    const del = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.delete(url, addHeaders(data));
    };

    return { request, post, get, put, del };
}

/**
 * 携带身份令牌请求
 * @param options 
 *  - withToken: true useHttpToken 中的withToken强制true
 */
export function useHttpToken(options: UseHttpOptions = {}) {
    return useHttp({ ...options, withToken: true });
}
