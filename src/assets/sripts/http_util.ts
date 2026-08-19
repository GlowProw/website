/**
 * extends http
 * 用于需要token请求
 */
import {useAuthStore} from "~/stores/userAccountStore";
import {http} from "./index";

/**
 * 带身份信息请求
 */
export function useHttpToken() {
    const authStore = useAuthStore()

    /**
     * token & lang headers
     */
    const addHeaders = (data: any) => {
        const headers = data?.headers || {}

        if (authStore.user && authStore.user.token) {
            const token = authStore.user.token;
            if (token != null && token !== '') {
                headers['x-access-token'] = token;
            }
        }

        return {
            ...data,
            headers
        };
    }

    // 添加响应拦截器处理 Token 过期
    http.HTTP.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.data && error.response.data.code === 'user.tokenExpired') {
                authStore.logout()
            }
            return Promise.reject(error)
        })

    /**
     * 发送 POST 请求（带 Token）
     */
    const post = (url = '', data?: { data?: {} }) => {
        return http.post(url, addHeaders(data))
    }

    /**
     * 发送 GET 请求（带 Token）
     */
    const get = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.get(url, addHeaders(data))
    }

    /**
     * 发送 PUT 请求（带 Token）
     */
    const put = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.put(url, addHeaders(data))
    }

    /**
     * 发送 DELETE 请求（带 Token）
     */
    const del = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.delete(url, addHeaders(data))
    }

    return {
        post,
        get,
        put,
        del
    }
}
