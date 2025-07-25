import http from 'axios';
import Conf from './conf';

interface RequestOptions {
    method?: HttpMethod;
    body?: Record<string, any>;
    data?: Record<string, any>;
    params?: Record<string, any>;
    headers?: Record<string, string>;
}

enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete'
}

export default class Http extends Conf {
    GETURL = {protocol: '', request: '', host: '', pathname: '', port: ''};

    HTTP = http.create({
        timeout: 600000,
    })

    constructor() {
        super();
        // @ts-ignore
        Conf.NODE = process.env.NODE_ENV || 'development';
    }

    get location() {
        return new URL(this.globalUrl.location);
    }

    get host() {
        return this.globalUrl.host
    }

    // 获取全局地址
    get globalUrl() : any {
        try {
            if (!this.CONF) {
                throw Error('not data')
            }

            switch (Conf.NODE) {
                case 'production': // 生产
                    // @ts-ignore
                    this.GETURL = this.CONF.child[this.CONF.requestProductionName];
                    break;
                case 'staging': // 测试
                    // @ts-ignore
                    this.GETURL = this.CONF.child[this.CONF.requestTestName];
                    break;
                case 'development': // 开发
                default:
                    // @ts-ignore
                    this.GETURL = this.CONF.child[this.CONF.requestDevelopmentName];
                    break;
            }

            return {
                location: `${this.GETURL.protocol || 'http'}://${this.GETURL.host}:${this.GETURL.port}${this.GETURL.pathname}`,
                host: this.GETURL.host,
                protocol: this.GETURL.protocol,
                wsProtocol: this.GETURL.wsProtocol,
                pathname: this.GETURL.pathname,
                wsPathname: this.GETURL.wsPathname,
                port: this.GETURL.port,
                wsPort: this.GETURL.wsPort,
            };
        } catch (e) {
            return {
                error: 1
            }
        }
    }

    // 配置全局协议头
    setGlobalHeader(headers: Map<any, any> | any = {}) {
        if (!headers) return;

        this.HTTP.headers = {...this.HTTP.headers, ...headers};
    }

    /**
     * 请求核心
     * @param url
     * @param options
     * @returns {Promise<*>}
     */
    async request(url = '', options: RequestOptions = {}) {
        // @ts-ignore
        return await this.HTTP({
            url: url,
            headers: {...this.HTTP.headers || {}, ...options.headers},
            method: options.method,
            data: options.data,
            params: options.params,
            body: options.body
        });
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
        });
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
        });
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
        });
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
        });
    }
}
