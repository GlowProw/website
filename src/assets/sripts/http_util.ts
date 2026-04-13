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

    // Add response interceptor to handle token expiration
    http.HTTP.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.data && error.response.data.code === 'user.tokenExpired') {
                authStore.logout()
            }
            return Promise.reject(error)
        })


    const post = (url = '', data?: { data?: {} }) => {
        return http.post(url, addHeaders(data))
    }

    const get = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.get(url, addHeaders(data))
    }

    const put = (url = '', data?: { data?: {}, params?: {} }) => {
        return http.put(url, addHeaders(data))
    }

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
