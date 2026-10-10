/**
 * CDN 静态资源服务相关类型
 */

export interface CDNAssetsService {
    name: string;
    urlTemplate: string;
    enabled: boolean;
    priority: number;
}

export interface CDNAssetsParams {
    id: string;
    type?: string;
    category: string;

    [key: string]: string;
}

// 多服务参数：按服务名分组
export interface MultiServiceParams {
    [serviceName: string]: CDNAssetsParams;
}

// 单个服务或多服务的入参
export type UrlParams = CDNAssetsParams | MultiServiceParams;

export interface ModeAssetsParams {
    category?: string;
    t?: string;
    id?: string;
    format?: 'bin' | 'json';
    [key: string]: string | undefined;
}

export interface ImageServiceItem extends CDNAssetsService {
    url: (params: UrlParams, forceName?: string) => string;
}

export interface ModeServiceItem extends CDNAssetsService {
    url: (params?: ModeAssetsParams | string) => string;
}

export interface CurrentService extends CDNAssetsService {
    image: ImageServiceItem;
    mode: ModeServiceItem;
    url: (params: UrlParams, forceName?: string) => string;
}
