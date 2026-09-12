/**
 * 愿望清单 Pinia Store
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
    WishlistFile,
    WishlistMatch,
    WishlistMeta,
} from '@/assets/types/Wishlist';
import {
    parseWishlistText,
    buildWishlistLookup,
    buildWishlistModLookup,
    exportWishlistToText,
    checkItemInWishlist,
    checkModInWishlist,
    validateWishlist,
    toWishlistMeta,
} from '@/assets/sripts/wishlist_data_processing';
import Storage from '@/assets/sripts/storage';

const storage = new Storage();
const INDEX_KEY = 'wishlist.index';
const DATA_KEY_PREFIX = 'wishlist.data.';

function loadIndex(): WishlistMeta[] {
    const d = storage.local.get(INDEX_KEY);
    if (d.code < 0 || !d.data?.value) return [];
    return Array.isArray(d.data.value) ? d.data.value : [];
}

function saveIndex(metas: WishlistMeta[]) {
    storage.local.set(INDEX_KEY, metas);
}

function loadWishlistData(id: string): WishlistFile | null {
    const d = storage.local.get(DATA_KEY_PREFIX + id);
    if (d.code < 0 || !d.data?.value) return null;
    return d.data.value as WishlistFile;
}

function saveWishlistData(wl: WishlistFile) {
    storage.local.set(DATA_KEY_PREFIX + wl.id, wl);
}

function removeWishlistData(id: string) {
    storage.local.rem(DATA_KEY_PREFIX + id);
}

export const useWishlistStore = defineStore('wishlist', () => {
    // 状态 (State)
    /** 索引列表（不含 rules 数据） */
    const metaList = ref<WishlistMeta[]>([]);
    /** 已加载的完整清单缓存 */
    const loadedWishlists = ref<Map<string, WishlistFile>>(new Map());
    /** 更新中的清单 ID 集合 */
    const updatingIds = ref<Set<string>>(new Set());

    // 初始化
    function init() {
        metaList.value = loadIndex();
        // 预加载所有清单数据到缓存
        for (const meta of metaList.value) {
            const data = loadWishlistData(meta.id);
            if (data) {
                loadedWishlists.value.set(meta.id, data);
            }
        }
    }

    // 立即初始化
    init();

    const wishlists = computed<WishlistFile[]>(() => {
        return metaList.value
            .map(m => loadedWishlists.value.get(m.id))
            .filter((w): w is WishlistFile => !!w);
    });

    const enabledWishlists = computed(() =>
        wishlists.value.filter(w => w.enabled)
    );

    const totalRules = computed(() =>
        metaList.value.reduce((sum, m) => sum + m.rulesCount, 0)
    );

    const enabledRules = computed(() =>
        wishlists.value
            .filter(w => w.enabled)
            .reduce((sum, w) => sum + w.rules.length, 0)
    );

    /**
     * 合并所有启用清单的 lookup Map
     */
    const lookupMap = computed(() =>
        buildWishlistLookup(enabledWishlists.value)
    );

    /**
     * 合并所有启用清单的模组 lookup Map
     */
    const modLookupMap = computed(() =>
        buildWishlistModLookup(enabledWishlists.value)
    );

    // 持久化辅助

    function persistWishlist(wl: WishlistFile) {
        saveWishlistData(wl);
        loadedWishlists.value.set(wl.id, wl);
        // 更新索引
        const meta = toWishlistMeta(wl);
        const idx = metaList.value.findIndex(m => m.id === wl.id);
        if (idx >= 0) {
            metaList.value[idx] = meta;
        } else {
            metaList.value.push(meta);
        }
        saveIndex(metaList.value);
    }

    function unpersistWishlist(id: string) {
        removeWishlistData(id);
        loadedWishlists.value.delete(id);
        metaList.value = metaList.value.filter(m => m.id !== id);
        saveIndex(metaList.value);
    }

    /**
     * 根据物品 ID 检查是否在愿望清单中（含来源信息）
     */
    function getMatchForItem(itemId: string): WishlistMatch | null {
        return checkItemInWishlist(itemId, lookupMap.value);
    }

    /**
     * 根据模组 ID 检查是否在愿望清单中（含来源信息）
     */
    function getMatchForMod(modId: string): WishlistMatch | null {
        return checkModInWishlist(modId, modLookupMap.value);
    }

    /**
     * 简单布尔判断
     */
    function isItemWishlisted(itemId: string): boolean {
        if (!itemId) return false;
        return lookupMap.value.has(itemId);
    }

    /**
     * 添加愿望清单（需先通过验证）
     */
    function addWishlist(wl: WishlistFile): { success: boolean; errors?: string[] } {
        if (!loadedWishlists.value.has(wl.id) && metaList.value.length >= 10) {
            return { success: false, errors: ['max_limit'] };
        }
        const validation = validateWishlist(wl);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }
        persistWishlist(wl);
        return { success: true };
    }

    /**
     * 从文本导入
     */
    function importFromText(
        text: string,
        source: string = 'paste'
    ): { success: boolean; wishlist?: WishlistFile; errors?: string[] } {
        const wl = parseWishlistText(text, source);
        const result = addWishlist(wl);
        return result.success
            ? { success: true, wishlist: wl }
            : { success: false, errors: result.errors };
    }

    /**
     * 从 URL 导入
     */
    async function importFromUrl(
        url: string
    ): Promise<{ success: boolean; wishlist?: WishlistFile; errors?: string[] }> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        const wl = parseWishlistText(text, url);
        // 如果没有 updateUrls，将导入 URL 作为默认更新源
        if (!wl.updateUrls || wl.updateUrls.length === 0) {
            wl.updateUrls = [url];
        }
        const result = addWishlist(wl);
        return result.success
            ? { success: true, wishlist: wl }
            : { success: false, errors: result.errors };
    }

    /**
     * 从 updateUrls 更新清单内容
     */
    async function updateFromUrls(id: string): Promise<{ success: boolean; error?: string }> {
        const existing = loadedWishlists.value.get(id);
        if (!existing) return { success: false, error: 'not_found' };
        if (!existing.updateUrls || existing.updateUrls.length === 0) {
            return { success: false, error: 'no_update_urls' };
        }

        updatingIds.value.add(id);
        try {
            let lastError = '';
            for (const url of existing.updateUrls) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        lastError = `${response.status} ${response.statusText}`;
                        continue;
                    }
                    const text = await response.text();
                    const parsed = parseWishlistText(text, url);

                    // 验证
                    const validation = validateWishlist(parsed);
                    if (!validation.valid) {
                        lastError = 'validation_failed';
                        continue;
                    }

                    // 保留原有 ID、启用状态
                    parsed.id = existing.id;
                    parsed.enabled = existing.enabled;
                    parsed.importedAt = existing.importedAt;
                    parsed.lastUpdatedAt = Date.now();
                    // 保留原有 updateUrls 如果新版中没有
                    if (!parsed.updateUrls || parsed.updateUrls.length === 0) {
                        parsed.updateUrls = existing.updateUrls;
                    }

                    persistWishlist(parsed);
                    return { success: true };
                } catch (e: any) {
                    lastError = e.message || 'fetch_error';
                    continue;
                }
            }
            return { success: false, error: lastError };
        } finally {
            updatingIds.value.delete(id);
        }
    }

    /**
     * 删除愿望清单
     */
    function removeWishlist(id: string) {
        unpersistWishlist(id);
    }

    /**
     * 切换启用/禁用
     */
    function toggleWishlist(id: string) {
        const wl = loadedWishlists.value.get(id);
        if (wl) {
            wl.enabled = !wl.enabled;
            persistWishlist(wl);
        }
    }

    /**
     * 全部启用
     */
    function enableAll() {
        for (const wl of loadedWishlists.value.values()) {
            wl.enabled = true;
            saveWishlistData(wl);
        }
        metaList.value.forEach(m => m.enabled = true);
        saveIndex(metaList.value);
    }

    /**
     * 全部禁用
     */
    function disableAll() {
        for (const wl of loadedWishlists.value.values()) {
            wl.enabled = false;
            saveWishlistData(wl);
        }
        metaList.value.forEach(m => m.enabled = false);
        saveIndex(metaList.value);
    }

    /**
     * 清空所有
     */
    function removeAll() {
        for (const meta of metaList.value) {
            removeWishlistData(meta.id);
        }
        loadedWishlists.value.clear();
        metaList.value = [];
        saveIndex([]);
    }

    /**
     * 导出指定愿望清单为文本
     */
    function exportAsText(id: string): string {
        const wl = loadedWishlists.value.get(id);
        if (!wl) return '';
        return exportWishlistToText(wl);
    }

    /**
     * 检查清单是否正在更新
     */
    function isUpdating(id: string): boolean {
        return updatingIds.value.has(id);
    }

    return {
        // 状态 (State)
        metaList,
        wishlists,
        updatingIds,

        // 计算属性 (Getters)
        enabledWishlists,
        totalRules,
        enabledRules,
        lookupMap,
        modLookupMap,

        // 操作方法 (Actions)
        init,
        getMatchForItem,
        getMatchForMod,
        isItemWishlisted,
        addWishlist,
        importFromText,
        importFromUrl,
        updateFromUrls,
        removeWishlist,
        toggleWishlist,
        enableAll,
        disableAll,
        removeAll,
        exportAsText,
        isUpdating,
    };
});
