import http from 'axios';
import Conf from './conf';

export default class Http extends Conf {
    GET = 'get';
    POST = 'post';
    PUT = 'put';
    DELETE = 'delete';
    //..

    GETURL = {protocol: '', request: '', host: '', pathname: '', port: ''};

    HTTP = http.create({
        timeout: 600000,
    })

    constructor() {
        super();

        this.NODE = process.env.NODE_ENV || 'development';
        console.log('node:', this.NODE, this.CONF)
    }

    get location() {
        return new URL(this.globalUrl.location);
    }

    get host() {
        return this.globalUrl.host
    }

    // 获取全局地址
    get globalUrl() {
        try {
            switch (this.NODE) {
                case 'production': // 生产
                    this.GETURL = this.CONF.child[this.CONF.requestProductionName];
                    break;
                case 'staging': // 测试
                    this.GETURL = this.CONF.child[this.CONF.requestTestName];
                    break;
                case 'development': // 开发
                default:
                    this.GETURL = this.CONF.child[this.CONF.requestDevelopmentName];
                    break;
            }

            return {
                location: `${this.GETURL.protocol || 'http'}://${this.GETURL.host}:${this.GETURL.port}${this.GETURL.pathname}`,
                host: this.GETURL.host,
                protocol: this.GETURL.protocol,
                pathname: this.GETURL.pathname,
                port: this.GETURL.port,
            };
        } catch (e) {
            return {
                error: 1
            }
        }
    }

    // 配置全局协议头
    setGlobalHeader(headers) {
        if (!headers) return;
        this.HTTP.headers = {...this.HTTP.headers, ...headers};
    }

    /**
     * 请求核心
     * @param url
     * @param requestData
     * @returns {Promise<*>}
     */
    async request(url = '', requestData = {method: this.POST, data: {}, body: {}, params: {}, headers: {}}) {
        return await this.HTTP({
            url: url,
            headers: {...this.HTTP.headers || {}, ...requestData.headers},
            method: requestData.method,
            data: requestData.data,
            params: requestData.params,
            body: requestData.body
        });
    }

    /**
     * post 请求
     * @param url
     * @param data
     * @returns {Promise<AxiosResponse<any>>}
     */
    async post(url, data = {data: {}, params: {}}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: this.POST,
            headers: data.headers,
            params: data.params,
            data: data.data,
        });
    }

    /**
     * get 请求
     * @returns {Promise<AxiosResponse<any>>}
     */
    async get(url = '', data = {data: {}, params: {}, headers: {}}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: this.GET,
            headers: data.headers,
            params: data.params,
            data: data.data,
        });
    }

    /**
     * put 请求
     * @param url
     * @param data
     * @returns {Promise<AxiosResponse<any>>}
     */
    async put(url = '', data = {data: {}, params: {}}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: this.PUT,
            headers: data.headers,
            params: data.params,
            data: data.data,
        });
    }

    /**
     * delete 请求
     * @param url
     * @param data
     */
    async delete(url = '', data = {data: {}, params: {}}) {
        const _url = this.globalUrl.location + url;

        return await this.request(_url, {
            method: this.DELETE,
            headers: data.headers,
            params: data.params,
            data: data.data,
        });
    }
}
