/**
 * 国际化 (I18n) 相关类型定义
 */

export interface LanguageItem {
  label: string;
  value: string;
}

export interface LanguagesConfig {
  default: string;
  mapping: string;
  fallback: string;
  child: LanguageItem[];
}

export type SNBModule = { zh_CN: any; en_US: any; zh_TW: any };

export interface CDNLangSource {
    key: string;
    label: string;
    baseUrl: string;
    isDev?: boolean;
}

export type CategoryFetch = {
    file: string;
    bundleKey: string;
    mergeWith?: string;
};
