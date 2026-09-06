/**
 * extends http
 * 用于需要token请求
 */
import { useAuthStore } from "~/stores/userAccountStore";
import { http } from "./index";
import { generateAuthGpHeader } from "./fingerprint_auth";

interface UseHttpOptions {
    /** 是否携带 token */
    withToken?: boolean;
}

/**
 * 基本请求
 * @param options
 */
export function useHttp(options: UseHttpOptions = {}) {
    const { withToken = false } = options;
    const authStore = useAuthStore();

    const addHeaders = (data: any) => {
        const headers = data?.headers || {};

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

    return { post, get, put, del };
}

/**
 * 携带身份令牌请求
 */
export function useHttpToken() {
    return useHttp({ withToken: true });
}
