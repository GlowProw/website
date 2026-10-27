import http, {type AxiosInstance, type AxiosResponse} from 'axios';
import Api_config from './api_config';
import type {GetUrlOptions, RequestOptions} from "../types/Http";
import { generateAuthGpHeader } from './fingerprint_auth';

export enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete'
}

export default class Http extends Api_config {
    GetUrl: GetUrlOptions = {host: "", pathname: "", port: "", protocol: "", request: "", wsHost: "", wsPathname: "", wsPort: "", wsProtocol: "", wsRequest: ""};

    HTTP: AxiosInstance;

    constructor() {
        super()
        // @ts-ignore
        Api_config.NODE = process.env.NODE_ENV || 'development';

        this.HTTP = http.create({
            timeout: 600000,
            // 跨域请求携带凭证（Cookie）：登录接口下发的 httpOnly token cookie 只有带上凭证
            // 才会被浏览器保存。之后从站点整页跳转到 API 源（如 MCP 授权页
            // http://localhost:3000/authorize）时，浏览器才会带上会话，
            // 授权页才能识别已登录用户并继续走「同意授权」流程。
            // 注意：跨站请求（外部资源）会在请求拦截器里关闭，避免 Cookie 外泄。
            withCredentials: true,
        })

        // 自动注入混淆加密后的浏览器安全指纹协议头 x-auth-gp
        this.HTTP.interceptors.request.use((config) => {
            try {
                // 外部请求显式标记时，不注入内部私有协议头，也不携带跨域凭证
                const isExternal = (config as any).isExternal || (config.headers as any)?.['x-is-external'];
                if (isExternal) {
                    if (config.headers) {
                        delete (config.headers as any)['x-is-external'];
                        delete (config.headers as any)['x-auth-gp'];
                    }
                    config.withCredentials = false;
                    return config;
                }

                // 自动判断：如果请求 url 为跨域绝对路径（以 http:// 或 https:// 开头且不同于当前 API 源），
                // 判定为外部资源请求：不注入内部协议头，也不携带跨域凭证（避免 Cookie 外泄）。
                // 注意必须按 origin（协议+主机+端口）比较：globalUrl.host 只是主机名（如 localhost），
                // 与 URL.host（如 localhost:3000）直接比较在开发环境会永远不相等，把同源 API 请求
                // 误判为外部请求，导致 withCredentials 被关闭、登录 cookie 无法落地。
                if (config.url && /^https?:\/\//i.test(config.url)) {
                    try {
                        const targetOrigin = new URL(config.url).origin;
                        const apiOrigin = this.location.origin;
                        if (apiOrigin && targetOrigin !== apiOrigin) {
                            config.withCredentials = false;
                            return config;
                        }
                    } catch (e) {
                        // ignore URL parse error
                    }
                }

                const authHeader = generateAuthGpHeader();
                if (config.headers) {
                    config.headers['x-auth-gp'] = authHeader;

                    // 自动携带当前网页语言给后端 (x-lang)
                    if (!config.headers['x-lang']) {
                        let currentLang = '';
                        if (typeof window !== 'undefined' && window.location) {
                            const seg = window.location.pathname.split('/').filter(Boolean)[0];
                            if (seg && ['zh-CN', 'zh-TW', 'en-US'].includes(seg)) {
                                currentLang = seg;
                            }
                        }
                        if (!currentLang && typeof window !== 'undefined' && window.localStorage) {
                            try {
                                const raw = window.localStorage.getItem('lang');
                                if (raw) {
                                    const parsed = JSON.parse(raw);
                                    const val = parsed?.data?.value ?? parsed?.value ?? parsed;
                                    if (typeof val === 'string' && val) currentLang = val;
                                }
                            } catch {
                                // ignore
                            }
                        }
                        if (currentLang) {
                            config.headers['x-lang'] = currentLang;
                        }
                    }

                    // 自动携带客户端时区给后端 (x-timezone)
                    if (!config.headers['x-timezone']) {
                        try {
                            const tz = typeof window !== 'undefined' ? (window.localStorage.getItem('app_user_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone) : 'Asia/Shanghai';
                            if (tz) {
                                config.headers['x-timezone'] = tz;
                            }
                        } catch {
                            // ignore
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to attach headers:', e);
            }
            return config;
        });

        // 统一响应拦截器，抓取 HTTP 429 速率限制
        this.HTTP.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error?.response?.status === 429) {
                    if (!error.response.data || typeof error.response.data !== 'object') {
                        error.response.data = {
                            error: 1,
                            code: 'request.rateLimited',
                            message: 'Too many requests, please slow down.'
                        };
                    } else if (!error.response.data.code) {
                        error.response.data.code = 'request.rateLimited';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    get location() {
        return new URL(this.globalUrl.location)
    }

    get host() {
        return this.globalUrl.host
    }

    // 获取全局地址
    get globalUrl(): any {
        try {
            if (!this.CONF) {
                throw new Error('not data')
            }

            switch (Api_config.NODE) {
                case 'production': // 生产
                    // @ts-ignore
                    this.GetUrl = this.CONF.child[this.CONF.requestProductionName];
                    break;
                case 'staging': // 测试
                    // @ts-ignore
                    this.GetUrl = this.CONF.child[this.CONF.requestTestName];
                    break;
                case 'development': // 开发
                default:
                    // @ts-ignore
                    this.GetUrl = this.CONF.child[this.CONF.requestDevelopmentName];
                    break;
            }

            const portStr = this.GetUrl.port ? `:${this.GetUrl.port}` : '';
            return {
                location: `${this.GetUrl.protocol || 'http'}://${this.GetUrl.host}${portStr}${this.GetUrl.pathname}`,
                host: this.GetUrl.host,
                protocol: this.GetUrl.protocol,
                wsProtocol: this.GetUrl.wsProtocol,
                pathname: this.GetUrl.pathname,
                wsPathname: this.GetUrl.wsPathname,
                port: this.GetUrl.port,
                wsPort: this.GetUrl.wsPort,
            };
        } catch (e) {
            return {
                error: 1
            }
        }
    }

    /**
     * 请求核心
     * @param url
     * @param options
     * @returns {Promise<*>}
     */
    async request(url = '', options: RequestOptions = {}): Promise<any> {
        const headers: any = { ...options.headers };
        // 如果传输 FormData，移除显式静态 Content-Type，交由浏览器/Axios 自动注入包含 boundary 的请求头
        if (typeof FormData !== 'undefined' && options.data instanceof FormData) {
            delete headers['Content-Type'];
            delete headers['content-type'];
        }

        return await this.HTTP({
            url: url,
            headers: headers,
            method: options.method,
            data: options.data,
            params: options.params,
            ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
            ...((options as any).isExternal !== undefined ? { isExternal: (options as any).isExternal } : {})
        })
    }

    /**
     * post 请求
     * @param url
     * @param options
     * @returns {Promise<AxiosResponse<any>>}
     */
    async post(url: string, options: RequestOptions = {}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: HttpMethod.POST,
            headers: options.headers,
            params: options.params,
            data: options.data,
            timeout: options.timeout,
        })
    }

    /**
     * get 请求
     */
    async get(url: string, options: RequestOptions = {}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: HttpMethod.GET,
            headers: options.headers,
            params: options.params,
            data: options.data,
            timeout: options.timeout,
        })
    }

    /**
     * put 请求
     * @param url
     * @param options
     * @returns {Promise<AxiosResponse<any>>}
     */
    async put(url: string, options: RequestOptions = {}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: HttpMethod.PUT,
            headers: options.headers,
            params: options.params,
            data: options.data,
            timeout: options.timeout,
        })
    }

    /**
     * delete 请求
     * @param url
     * @param options
     */
    async delete(url: string, options: RequestOptions = {}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: HttpMethod.DELETE,
            headers: options.headers,
            params: options.params,
            data: options.data,
            timeout: options.timeout,
        })
    }
}
