/**
 * 远程 CDN 游戏数据翻译加载器
 */
import { storage } from "./index";
import { getAppI18n } from "@/i18n/index";
import { SUPPORTED_LANGS, isSupportedLang, toCDNLang } from "@/config/languages";

export interface CDNLangSource {
    key: string;
    label: string;
    baseUrl: string;
    isDev?: boolean;
}

export const CDN_LANG_SOURCES: CDNLangSource[] = [
    {
        key: 'local-test',
        label: 'local-test',
        baseUrl: 'http://localhost:8088/src/data',
        isDev: true
    },
    {
        key: 'glow-prow',
        label: 'glow-prow',
        baseUrl: '/lang-api'
    }
];

export const DEFAULT_CDN_SOURCE = 'glow-prow';

export function getCDNSource(key?: string | null): CDNLangSource {
    const found = CDN_LANG_SOURCES.find(s => s.key === key);
    return found || CDN_LANG_SOURCES.find(s => s.key === DEFAULT_CDN_SOURCE)!;
}

type CategoryFetch = {
    file: string;
    bundleKey: string;
    mergeWith?: string;
};

const CATEGORIES: CategoryFetch[] = [
    { file: 'ships',            bundleKey: 'ships' },
    { file: 'items',            bundleKey: 'items' },
    { file: 'items_ammunition', bundleKey: 'items', mergeWith: 'items' },
    { file: 'commodities',      bundleKey: 'commodities' },
    { file: 'calendar',         bundleKey: 'calendar' },
    { file: 'materials',        bundleKey: 'materials' },
    { file: 'factions',         bundleKey: 'factions' },
    { file: 'modifications',    bundleKey: 'modifications' },
    { file: 'perks',            bundleKey: 'perks' },
    { file: 'seasons',          bundleKey: 'seasons' },
    { file: 'locations',       bundleKey: 'locations' },
    { file: 'ultimates',        bundleKey: 'ultimates' },
    { file: 'ranks',            bundleKey: 'ranks' },
    { file: 'cosmetics',        bundleKey: 'cosmetics' },
    { file: 'events',           bundleKey: 'events' },
    { file: 'worldEvents',      bundleKey: 'worldEvents' },
    { file: 'empireSkills',     bundleKey: 'empireSkills' },
    { file: 'mapLocations',     bundleKey: 'mapLocations' },
    { file: 'sets',             bundleKey: 'sets' },
    { file: 'regions',          bundleKey: 'regions' },
    { file: 'territories',      bundleKey: 'territories' },
    { file: 'npcs',             bundleKey: 'npcs' },
    { file: 'treasureMaps',     bundleKey: 'treasureMaps' },
    { file: 'zones',            bundleKey: 'zones' },
    { file: 'masterys',         bundleKey: 'masterys' },
    { file: 'quest',            bundleKey: 'quests' },
];

const cacheKey = (sourceKey: string, lang: string) => `i18n_cache_${sourceKey}_${lang}`;

async function fetchCategory(url: string, timeoutMs: number): Promise<Record<string, any> | null> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        let resp: Response;
        try {
            resp = await fetch(url, {
                method: 'GET',
                cache: 'no-store',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
        } finally {
            clearTimeout(timer);
        }
        if (!resp.ok) return null;
        const json = await resp.json();
        return (json && typeof json === 'object') ? json : null;
    } catch {
        return null;
    }
}

export async function loadRemoteLangMessages(
    sourceKey: string,
    lang: string,
    opts: { forceRefresh?: boolean; timeoutMs?: number } = {}
): Promise<{ ok: boolean; fromCache: boolean; fetchedCategories: number }> {
    if (!isSupportedLang(lang)) return { ok: false, fromCache: false, fetchedCategories: 0 };

    const source = getCDNSource(sourceKey);
    const base = source.baseUrl.replace(/\/+$/, '');
    const cdnLang = toCDNLang(lang);
    const perCatTimeout = (opts.timeoutMs ?? 10000);

    const i18n = getAppI18n();
    if (!i18n || !i18n.global || typeof i18n.global.setLocaleMessage !== 'function') {
        return { ok: false, fromCache: false, fetchedCategories: 0 };
    }

    // 并行 fetch 所有 category
    if (!opts.forceRefresh) {
        const urls = CATEGORIES.map(c => `${base}/${cdnLang}/${c.file}.json`);
        const results = await Promise.allSettled(urls.map(u => fetchCategory(u, perCatTimeout)));

        const bundle: Record<string, any> = {};
        let fetchedCount = 0;

        CATEGORIES.forEach((cat, idx) => {
            const res = results[idx];
            if (res.status === 'fulfilled' && res.value) {
                fetchedCount++;
                const data = res.value;
                if (cat.mergeWith && bundle[cat.bundleKey]) {
                    bundle[cat.bundleKey] = { ...bundle[cat.bundleKey], ...data };
                } else {
                    bundle[cat.bundleKey] = data;
                }
            }
        });

        if (fetchedCount > 0) {
            const wrapped = { snb: bundle };
            storage.session.set(cacheKey(source.key, lang), wrapped);
            mergeIntoI18n(i18n.global, lang, wrapped);
            return { ok: true, fromCache: false, fetchedCategories: fetchedCount };
        }
    }

    // session 缓存 fallback
    const cached = storage.session.get(cacheKey(source.key, lang));
    if (cached?.code === 0 && cached.data?.value && typeof cached.data.value === 'object') {
        mergeIntoI18n(i18n.global, lang, cached.data.value);
        return { ok: true, fromCache: true, fetchedCategories: 0 };
    }

    return { ok: false, fromCache: false, fetchedCategories: 0 };
}

export async function loadAllRemoteLangMessages(
    sourceKey: string,
    opts: { forceRefresh?: boolean; timeoutMs?: number } = {}
): Promise<{ succeeded: string[]; failed: string[]; categoryStats: Record<string, number> }> {
    const results = await Promise.allSettled(
        SUPPORTED_LANGS.map(lang => loadRemoteLangMessages(sourceKey, lang, opts))
    );

    const succeeded: string[] = [];
    const failed: string[] = [];
    const categoryStats: Record<string, number> = {};

    results.forEach((res, idx) => {
        const lang = SUPPORTED_LANGS[idx];
        if (res.status === 'fulfilled' && res.value.ok) {
            succeeded.push(lang);
            categoryStats[lang] = res.value.fetchedCategories;
        } else {
            failed.push(lang);
            categoryStats[lang] = 0;
        }
    });

    return { succeeded, failed, categoryStats };
}

function isPlainObject(v: any): boolean {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepMergeSafe(target: any, ...sources: any[]): any {
    let result = { ...(isPlainObject(target) ? target : {}) };
    for (const src of sources) {
        if (!isPlainObject(src)) continue;
        for (const key in src) {
            const sv = src[key];
            if (isPlainObject(sv)) {
                if (!isPlainObject(result[key])) result[key] = {};
                result[key] = deepMergeSafe(result[key], sv);
            } else {
                result[key] = sv;
            }
        }
    }
    return result;
}

function mergeIntoI18n(i18nGlobal: any, locale: string, remoteMessages: Record<string, any>) {
    try {
        const existing = i18nGlobal.getLocaleMessage(locale) || {};
        const merged = deepMergeSafe(existing, remoteMessages);
        i18nGlobal.setLocaleMessage(locale, merged);
    } catch (err) {
        console.warn('[remote_i18n] merge 失败:', err);
    }
}

export function clearRemoteLangCache(sourceKey: string) {
    for (const lang of SUPPORTED_LANGS) {
        storage.session.rem(cacheKey(sourceKey, lang));
    }
}
