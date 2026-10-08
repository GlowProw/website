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

export const languagesConfig: LanguagesConfig = {
  default: "zh-CN",
  mapping: "en-US",
  fallback: "en-US",
  child: [
    {
      label: "简体中文",
      value: "zh-CN"
    },
    {
      label: "繁体中文",
      value: "zh-TW"
    },
    {
      label: "English",
      value: "en-US"
    }
  ]
};

export const SUPPORTED_LANGS = languagesConfig.child.map(item => item.value);
export const DEFAULT_LANG = languagesConfig.default || 'zh-CN';
export const FALLBACK_LANG = languagesConfig.fallback || 'en-US';

export const isSupportedLang = (lang?: string | null): lang is string => {
  if (!lang) return false;
  return SUPPORTED_LANGS.includes(lang);
};

/**
 * 格式归一
 * @param langStr 
 * @returns 
 */
export const normalizeLang = (langStr: string | null | undefined): string | null => {
  if (!langStr || typeof langStr !== 'string') return null;
  const target = langStr.trim().replace('_', '-');
  const supported = SUPPORTED_LANGS;

  const exactMatch = supported.find(val => val.toLowerCase() === target.toLowerCase());
  if (exactMatch) return exactMatch;

  const shortLang = target.split('-')[0].toLowerCase();
  for (const s of supported) {
    if (s.split('-')[0].toLowerCase() === shortLang) {
      return s;
    }
  }

  return null;
};

/**
 * BCP-47 连字符格式
 * CDN下划线格式
 * 用于拼 CDN URL：https://lang.glow-prow.top/src/data/{toCDNLang(locale)}/ships.json
 */
export const toCDNLang = (lang: string | null | undefined): string => {
  if (!lang) return DEFAULT_LANG.replace('-', '_');
  return String(lang).trim().replace(/-/g, '_');
};

/**
 * 当前语言
 * 脱离组件上下文的全局同步值
 *
 * useI18n() 只能在 setup 内调用。
 */
let currentLang: string = DEFAULT_LANG;

export const setCurrentLang = (lang?: string | null): void => {
    if (isSupportedLang(lang)) {
        currentLang = lang;
    }
};

export const getCurrentLang = (): string => currentLang;

export default languagesConfig;
