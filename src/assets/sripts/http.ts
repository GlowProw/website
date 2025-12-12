import http, {type AxiosInstance, type AxiosResponse} from 'axios';
import Config from './config';
import type {GetUrlOptions, RequestOptions} from "../types/Http";

export enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete'
}

export default class Http extends Config {
    GetUrl: GetUrlOptions = {host: "", pathname: "", port: "", protocol: "", request: "", wsHost: "", wsPathname: "", wsPort: "", wsProtocol: "", wsRequest: ""};

    HTTP: AxiosInstance;

    constructor() {
        super()
        // @ts-ignore
        Config.NODE = process.env.NODE_ENV || 'development';

        this.HTTP = http.create({
            timeout: 600000,
        })
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

            switch (Config.NODE) {
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
