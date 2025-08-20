import i18next, {Module} from 'i18next';
import config from './config';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'node:url';
import fetch from 'node-fetch';
import logger from "./logger";
import redis from './redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '.locale_cache');
const REMOTE_BASE_URL = config.i18n.serverUrl.replace(/\/$/, '');

async function getRedisCache(key: string) {
    if (!redis || !redis.status || redis.status !== 'ready') return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.error('Redis get error:', err);
        return null;
    }
}

async function setRedisCache(key: string, data: any, ttl?: number) {
    if (!redis || !redis.status || redis.status !== 'ready') return;
    try {
        const value = JSON.stringify(data);
        if (ttl) {
            await redis.setex(key, ttl, value);
        } else {
            await redis.set(key, value);
        }
    } catch (err) {
        logger.error('Redis set error:', err);
    }
}

async function ensureCacheDir() {
    try {
        await fs.mkdir(CACHE_DIR, {recursive: true});
    } catch (err) {
        console.error('Failed to create cache directory:', err);
        throw err;
    }
}

async function fetchAndCacheTranslations() {
    const locales = config.i18n.locales;
    let hasError = false;

    for (const locale of locales) {
        const cacheFile = path.join(CACHE_DIR, `${locale}.json`);
        const redisKey = `i18n:${locale}`;

        try {
            const url = `${REMOTE_BASE_URL}/src/data/${locale}/calendar.json`;
            logger.info(`Fetching translations from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            await fs.writeFile(cacheFile, JSON.stringify(data, null, 2));
            await setRedisCache(redisKey, data, 7 * 24 * 60 * 60);
            logger.info(`Successfully updated ${locale} translations`);
        } catch (error: any) {
            hasError = true;
            logger.error(`Failed to update ${locale} translations:`, error.message);

            try {
                await fs.access(cacheFile);
                logger.info(`Using cached translations for ${locale}`);
            } catch {
                logger.error(`No cached translations available for ${locale}`);
            }
        }
    }

    if (!hasError) {
        setTimeout(fetchAndCacheTranslations, 7 * 24 * 60 * 60 * 1000);
    } else {
        setTimeout(fetchAndCacheTranslations, 60 * 60 * 1000);
    }
}

class Backend {
    type = ''

    constructor() {
        this.type = 'backend';
    }

    async read(language: string, namespace: any, callback: any) {
        try {
            const redisKey = `i18n:${language}`;
            const cachedData = await getRedisCache(redisKey);

            if (cachedData) {
                callback(null, cachedData);
                return;
            }

            const filePath = path.join(CACHE_DIR + (namespace || ''), `${language}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            const parsedData = JSON.parse(data);

            await setRedisCache(redisKey, parsedData);
            callback(null, parsedData);
        } catch (err) {
            callback(err, null);
        }
    }
}

async function initI18next() {
    await ensureCacheDir();

    try {
        if (!config.__DEBUG__)
            await fetchAndCacheTranslations();
    } catch (err) {
        console.error('Initial fetch failed, using cached files:', err);
    }

    return i18next
        .use(new Backend() as Module)
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
            initImmediate: false
        });
}

const i18nInitPromise = initI18next();

export default {
    ...i18next,
    initialize: i18nInitPromise,
    refresh: fetchAndCacheTranslations,
    translate: async function (key: string, language?: string, options = {}): Promise<string> {
        await this.initialize;
        if (language) {
            await this.changeLanguage(language);
        }

        const result: any = this.t(key, {
            ...options,
            returnEmptyString: true,
            returnObjects: false,
            defaultValue: ''
        });

        return result === key ? '' : result;
    }
};
