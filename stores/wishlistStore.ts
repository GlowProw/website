/**
 * 愿望清单 Pinia Store
 * 持久化存储，管理所有导入的愿望清单
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
    type WishlistFile,
    type WishlistRule,
    type WishlistMatch,
    parseWishlistText,
    buildWishlistLookup,
    exportWishlistToText,
    checkItemInWishlist,
} from '@/assets/sripts/wishlist_data_processing';

export const useWishlistStore = defineStore('wishlist', () => {
    // ── State ──
    const wishlists = ref<WishlistFile[]>([]);

    // ── Getters ──
    const enabledWishlists = computed(() =>
        wishlists.value.filter(w => w.enabled)
    );

    const totalRules = computed(() =>
        wishlists.value.reduce((sum, w) => sum + w.rules.length, 0)
    );

    const enabledRules = computed(() =>
        enabledWishlists.value.reduce((sum, w) => sum + w.rules.length, 0)
    );

    /**
     * 合并所有启用清单的 lookup Map
     * 每次 enabledWishlists 改变时自动重建
     */
    const lookupMap = computed(() =>
        buildWishlistLookup(enabledWishlists.value)
    );

    // ── Actions ──

    /**
     * 根据物品 ID 检查是否在愿望清单中
     */
    function getMatchForItem(itemId: string): WishlistMatch | null {
        return checkItemInWishlist(itemId, lookupMap.value);
    }

    /**
     * 检查物品 ID 是否匹配愿望清单（简单布尔版本）
     */
    function isItemWishlisted(itemId: string): boolean {
        if (!itemId) return false;
        return lookupMap.value.has(itemId);
    }

    /**
     * 添加愿望清单
     */
    function addWishlist(wl: WishlistFile) {
        wishlists.value.push(wl);
    }

    /**
     * 从文本导入
     */
    function importFromText(text: string, source: string = 'paste'): WishlistFile {
        const wl = parseWishlistText(text, source);
        addWishlist(wl);
        return wl;
    }

    /**
     * 从 URL 导入
     */
    async function importFromUrl(url: string): Promise<WishlistFile> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        const wl = parseWishlistText(text, url);
        addWishlist(wl);
        return wl;
    }

    /**
     * 删除愿望清单
     */
    function removeWishlist(id: string) {
        const index = wishlists.value.findIndex(w => w.id === id);
        if (index >= 0) {
            wishlists.value.splice(index, 1);
        }
    }

    /**
     * 切换启用/禁用
     */
    function toggleWishlist(id: string) {
        const wl = wishlists.value.find(w => w.id === id);
        if (wl) {
            wl.enabled = !wl.enabled;
        }
    }

    /**
     * 全部启用
     */
    function enableAll() {
        wishlists.value.forEach(w => w.enabled = true);
    }

    /**
     * 全部禁用
     */
    function disableAll() {
        wishlists.value.forEach(w => w.enabled = false);
    }

    /**
     * 清空所有
     */
    function removeAll() {
        wishlists.value = [];
    }

    /**
     * 导出指定愿望清单为文本
     */
    function exportAsText(id: string): string {
        const wl = wishlists.value.find(w => w.id === id);
        if (!wl) return '';
        return exportWishlistToText(wl);
    }

    return {
        // State
        wishlists,
        // Getters
        enabledWishlists,
        totalRules,
        enabledRules,
        lookupMap,
        // Actions
        getMatchForItem,
        isItemWishlisted,
        addWishlist,
        importFromText,
        importFromUrl,
        removeWishlist,
        toggleWishlist,
        enableAll,
        disableAll,
        removeAll,
        exportAsText,
    };
}, {
    persist: {
        key: 'snb-wishlist',
        storage: localStorage,
        pick: ['wishlists'],
    },
});
