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
        })

        // 自动注入混淆加密后的浏览器安全指纹协议头 x-auth-gp
        this.HTTP.interceptors.request.use((config) => {
            try {
                // 外部请求显式标记时，不注入内部私有协议头
                const isExternal = (config as any).isExternal || (config.headers as any)?.['x-is-external'];
                if (isExternal) {
                    if (config.headers) {
                        delete (config.headers as any)['x-is-external'];
                        delete (config.headers as any)['x-auth-gp'];
                    }
                    return config;
                }

                // 自动判断：如果请求 url 为跨域绝对路径（以 http:// 或 https:// 开头且不同于当前 API host），判定为外部资源请求，不注入内部协议头
                if (config.url && /^https?:\/\//i.test(config.url)) {
                    try {
                        const targetHost = new URL(config.url).host;
                        const currentApiHost = this.host || (this.globalUrl && this.globalUrl.host);
                        if (currentApiHost && targetHost !== currentApiHost) {
                            return config;
                        }
                    } catch (e) {
                        // ignore URL parse error
                    }
                }

                const authHeader = generateAuthGpHeader();
                if (config.headers) {
                    config.headers['x-auth-gp'] = authHeader;
                }
            } catch (e) {
                console.error('Failed to attach x-auth-gp header:', e);
            }
            return config;
        });
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

            return {
                location: `${this.GetUrl.protocol || 'http'}://${this.GetUrl.host}:${this.GetUrl.port}${this.GetUrl.pathname}`,
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
        return await this.HTTP({
            url: url,
            headers: options.headers,
            method: options.method,
            data: options.data,
            params: options.params,
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
        })
    }
}
