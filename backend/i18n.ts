import i18next from 'i18next';
import config from './config';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'node:url';
import fetch from 'node-fetch';
import logger from "./logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '.locale_cache');
const REMOTE_BASE_URL = config.i18n.serverUrl.replace(/\/$/, '');

// 确保缓存目录存在
async function ensureCacheDir() {
    try {
        await fs.mkdir(CACHE_DIR, {recursive: true});
    } catch (err) {
        console.error('Failed to create cache directory:', err);
        throw err;
    }
}

// 从远程加载并缓存翻译文件
async function fetchAndCacheTranslations() {
    const locales = config.i18n.locales;
    let hasError = false;

    for (const locale of locales) {
        const cacheFile = path.join(CACHE_DIR, `${locale}.json`);

        try {
            const url = `${REMOTE_BASE_URL}/src/data/${locale}/calendar.json`;
            logger.info(`Fetching translations from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            await fs.writeFile(cacheFile, JSON.stringify(data, null, 2));
            logger.info(`Successfully updated ${locale} translations`);
        } catch (error: any) {
            hasError = true;
            logger.error(`Failed to update ${locale} translations:`, error.message);

            // 如果远程获取失败，尝试使用缓存文件
            try {
                await fs.access(cacheFile);
                logger.info(`Using cached translations for ${locale}`);
            } catch {
                logger.error(`No cached translations available for ${locale}`);
            }
        }
    }

    // 定期刷新（24小时）
    if (!hasError) {
        setTimeout(fetchAndCacheTranslations, 24 * 60 * 60 * 1000);
    } else {
        // 如果有错误，缩短重试时间（例如1小时后）
        setTimeout(fetchAndCacheTranslations, 60 * 60 * 1000);
    }
}

// 自定义后端 - 从缓存目录加载翻译
class Backend {
    type = ''

    constructor() {
        this.type = 'backend';
    }

    async read(language: string, namespace: any, callback: any) {
        try {
            const filePath = path.join(CACHE_DIR, `${language}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            callback(null, JSON.parse(data));
        } catch (err) {
            callback(err, null);
        }
    }
}

// 初始化i18next
async function initI18next() {
    await ensureCacheDir();

    // 先尝试从远程加载最新翻译
    try {
        await fetchAndCacheTranslations();
    } catch (err) {
        console.error('Initial fetch failed, using cached files:', err);
    }

    return i18next
        .use(new Backend())
        .init({
            lng: config.i18n.defaultLocale,
            fallbackLng: config.i18n.defaultLocale,
            supportedLngs: config.i18n.locales,
            ns: 'translation',
            defaultNS: 'translation',
            interpolation: {
                escapeValue: false
            },
            backend: {
                loadPath: path.join(CACHE_DIR, '{{lng}}.json')
            },
            initImmediate: false // 立即初始化
        });
}

// 立即执行初始化
const i18nInitPromise = initI18next();

// 导出一个增强的i18next实例
export default {
    ...i18next,
    ready: i18nInitPromise,
    refresh: fetchAndCacheTranslations,
    /**
     * 便捷翻译方法 (自动处理语言设置)
     * @param {string} key 翻译键
     * @param {string} [language] 可选语言代码
     * @param {object} [options] 翻译选项
     * @returns {string}
     */
    translate: async function (key: string, language?: string, options = {}): Promise<string> {
        await this.ready;
        if (language) {
            await this.changeLanguage(language);
        }

        // 获取翻译结果
        const result: any = this.t(key, {
            ...options,
            returnEmptyString: true,  // 找不到翻译时返回空字符串
            returnObjects: false,    // 确保总是返回字符串
            defaultValue: ''         // 默认返回空字符串
        });

        // 额外检查：如果结果仍然是键名（某些i18next版本可能忽略returnEmptyString）
        return result === key ? '' : result;
    }
};
