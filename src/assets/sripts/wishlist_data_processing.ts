/**
 * 愿望清单解析器 & 匹配器
 */

import { v6 as uuidV6 } from 'uuid';
import type { DeduplicateResult, WishlistFile, WishlistMatch, WishlistMeta, WishlistRule, WishlistValidation, } from '@/assets/types/Wishlist';

export type {
    WishlistRule,
    WishlistFile,
    WishlistMatch,
    WishlistValidation,
    DeduplicateResult,
    WishlistMeta,
};

/**
 * 生成规则的去重 key
 */
function ruleKey(rule: WishlistRule): string {
    const sortedPerks = [...rule.perks].sort().join(',');
    const sortedMods = rule.mods ? [...rule.mods].sort().join(',') : '';
    return `${rule.id}|${sortedPerks}|${sortedMods}`;
}

/**
 * 对规则列表去重
 */
export function deduplicateRules(rules: WishlistRule[]): DeduplicateResult {
    const seen = new Set<string>();
    const deduplicated: WishlistRule[] = [];

    for (const rule of rules) {
        const key = ruleKey(rule);
        if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push(rule);
        }
    }

    return {
        rules: deduplicated,
        duplicatesRemoved: rules.length - deduplicated.length,
    };
}

/**
 * 验证愿望清单（标题和描述必填）
 */
export function validateWishlist(wl: Partial<WishlistFile>): WishlistValidation {
    const errors: string[] = [];

    if (!wl.title || wl.title.trim().length === 0) {
        errors.push('title');
    }
    if (!wl.description || wl.description.trim().length === 0) {
        errors.push('description');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * 解析愿望清单格式文本
 */
export function parseWishlistText(text: string, source: string = ''): WishlistFile {
    const lines = text.split(/\r?\n/);
    let title = '';
    let description = '';
    const updateUrls: string[] = [];
    let version = '';
    let author = '';
    let authorUrl = '';
    const rules: WishlistRule[] = [];

    let currentNotes = '';
    let currentTags: string[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // 空行跳过
        if (!line) continue;

        // 解析 title: 行
        if (line.startsWith('title:')) {
            title = line.slice('title:'.length).trim();
            continue;
        }

        // 解析 description: 行
        if (line.startsWith('description:')) {
            description = line.slice('description:'.length).trim();
            continue;
        }

        // 解析 update_url: 行（支持多行收集为数组）
        if (line.startsWith('update_url:')) {
            const url = line.slice('update_url:'.length).trim();
            if (url) updateUrls.push(url);
            continue;
        }

        // 解析 version: 行
        if (line.startsWith('version:')) {
            version = line.slice('version:'.length).trim();
            continue;
        }

        // 解析 author: 行
        if (line.startsWith('author:')) {
            author = line.slice('author:'.length).trim();
            continue;
        }

        // 解析 author_url: 行
        if (line.startsWith('author_url:')) {
            authorUrl = line.slice('author_url:'.length).trim();
            continue;
        }

        // 解析 //notes: 行 (块注释)
        if (line.startsWith('//notes:') || line.startsWith('// notes:')) {
            const notePart = line.replace(/^\/\/\s*notes:\s*/, '');
            // 解析 tags:xxx 部分
            const tagsMatch = notePart.match(/\btags:(\S+)/);
            if (tagsMatch) {
                currentTags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
                currentNotes = notePart.replace(/\btags:\S+/, '').trim();
            } else {
                currentNotes = notePart.trim();
                currentTags = [];
            }
            continue;
        }

        // 跳过普通注释
        if (line.startsWith('//')) continue;
        if (line.startsWith('---')) continue;

        // 解析 wishlist: 行
        if (line.startsWith('wishlist:')) {
            const content = line.slice('wishlist:'.length);

            // 检查行内 #notes:
            let lineNotes = currentNotes;
            let lineTags = [...currentTags];
            const hashIndex = content.indexOf('#notes:');
            let paramPart = content;
            if (hashIndex >= 0) {
                const noteText = content.slice(hashIndex + '#notes:'.length);
                const inlineTagsMatch = noteText.match(/\btags:(\S+)/);
                if (inlineTagsMatch) {
                    lineTags = inlineTagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
                    lineNotes = noteText.replace(/\btags:\S+/, '').trim();
                } else {
                    lineNotes = noteText.trim();
                }
                paramPart = content.slice(0, hashIndex);
            }

            // 解析 item=xxx&perks=xxx&mods=xxx
            const params = new URLSearchParams(paramPart);
            const itemId = params.get('item') || '';
            const perksRaw = params.get('perks') || '';
            const perks = perksRaw ? perksRaw.split(',').map(p => p.trim()).filter(Boolean) : [];
            const modsRaw = params.get('mods') || '';
            const mods = modsRaw ? modsRaw.split(',').map(m => m.trim()).filter(Boolean) : undefined;

            if (itemId) {
                rules.push({
                    id: itemId,
                    perks,
                    ...(mods && mods.length > 0 ? { mods } : {}),
                    notes: lineNotes,
                    tags: lineTags,
                });
            }
            continue;
        }
    }

    // 去重
    const { rules: dedupedRules, duplicatesRemoved } = deduplicateRules(rules);

    return {
        id: uuidV6(),
        title: title || '',
        description: description || '',
        rules: dedupedRules,
        enabled: true,
        source,
        importedAt: Date.now(),
        updateUrls: updateUrls.length > 0 ? updateUrls : undefined,
        version: version || undefined,
        author: author || undefined,
        authorUrl: authorUrl || undefined,
        lastUpdatedAt: undefined,
        duplicatesRemoved: duplicatesRemoved > 0 ? duplicatesRemoved : undefined,
    };
}

/**
 * 从已解析的愿望清单列表中构建物品查找 Map
 * key: itemId, value: { rules, wishlistNames }
 */
export function buildWishlistLookup(
    wishlists: WishlistFile[]
): Map<string, { rules: WishlistRule[]; wishlistNames: string[] }> {
    const map = new Map<string, { rules: WishlistRule[]; wishlistNames: string[] }>();

    for (const wl of wishlists) {
        if (!wl.enabled) continue;

        for (const rule of wl.rules) {
            const existing = map.get(rule.id);
            if (existing) {
                existing.rules.push(rule);
                if (!existing.wishlistNames.includes(wl.title)) {
                    existing.wishlistNames.push(wl.title);
                }
            } else {
                map.set(rule.id, {
                    rules: [rule],
                    wishlistNames: [wl.title],
                });
            }
        }
    }

    return map;
}

/**
 * 从已解析的愿望清单列表中构建模组查找 Map
 * key: perkId(modId), value: { rules, wishlistNames }
 */
export function buildWishlistModLookup(
    wishlists: WishlistFile[]
): Map<string, { rules: WishlistRule[]; wishlistNames: string[] }> {
    const map = new Map<string, { rules: WishlistRule[]; wishlistNames: string[] }>();

    const addEntry = (key: string, rule: WishlistRule, title: string) => {
        const id = key.includes(':') ? key.split(':').pop()! : key;
        const existing = map.get(id);
        if (existing) {
            existing.rules.push(rule);
            if (!existing.wishlistNames.includes(title)) {
                existing.wishlistNames.push(title);
            }
        } else {
            map.set(id, {
                rules: [rule],
                wishlistNames: [title],
            });
        }
    };

    for (const wl of wishlists) {
        if (!wl.enabled) continue;

        for (const rule of wl.rules) {
            for (const perk of rule.perks) {
                addEntry(perk, rule, wl.title);
            }
            if (rule.mods) {
                for (const mod of rule.mods) {
                    addEntry(mod, rule, wl.title);
                }
            }
        }
    }

    return map;
}

/**
 * 检查物品是否在愿望清单中
 */
export function checkItemInWishlist(
    itemId: string,
    lookup: Map<string, { rules: WishlistRule[]; wishlistNames: string[] }>
): WishlistMatch | null {
    if (!itemId || !lookup) return null;

    const entry = lookup.get(itemId);
    if (!entry || entry.rules.length === 0) return null;

    return {
        matched: true,
        rules: entry.rules,
        wishlistNames: entry.wishlistNames,
    };
}

/**
 * 检查模组是否在愿望清单中
 */
export function checkModInWishlist(
    modId: string,
    lookup: Map<string, { rules: WishlistRule[]; wishlistNames: string[] }>
): WishlistMatch | null {
    if (!modId || !lookup) return null;

    const entry = lookup.get(modId);
    if (!entry || entry.rules.length === 0) return null;

    return {
        matched: true,
        rules: entry.rules,
        wishlistNames: entry.wishlistNames,
    };
}

/**
 * 将愿望清单导出为格式文本
 */
export function exportWishlistToText(wishlist: WishlistFile): string {
    const lines: string[] = [];

    if (wishlist.title) {
        lines.push(`title:${wishlist.title}`);
    }
    if (wishlist.description) {
        lines.push(`description:${wishlist.description}`);
    }
    if (wishlist.version) {
        lines.push(`version:${wishlist.version}`);
    }
    if (wishlist.author) {
        lines.push(`author:${wishlist.author}`);
    }
    if (wishlist.authorUrl) {
        lines.push(`author_url:${wishlist.authorUrl}`);
    }
    if (wishlist.updateUrls && wishlist.updateUrls.length > 0) {
        for (const url of wishlist.updateUrls) {
            lines.push(`update_url:${url}`);
        }
    }
    lines.push('');

    // 按 notes + tags 分组
    let lastNoteKey = '';
    for (const rule of wishlist.rules) {
        const noteKey = `${rule.notes}||${rule.tags.join(',')}`;
        if (noteKey !== lastNoteKey) {
            const tagsStr = rule.tags.length > 0 ? ` tags:${rule.tags.join(',')}` : '';
            if (rule.notes || tagsStr) {
                lines.push(`//notes: ${rule.notes}${tagsStr}`);
            }
            lastNoteKey = noteKey;
        }

        const perksStr = rule.perks.length > 0 ? `&perks=${rule.perks.join(',')}` : '';
        const modsStr = rule.mods && rule.mods.length > 0 ? `&mods=${rule.mods.join(',')}` : '';
        lines.push(`wishlist:item=${rule.id}${perksStr}${modsStr}`);
    }

    return lines.join('\r\n');
}

/**
 * 从 WishlistFile 提取 WishlistMeta（不含 rules，用于索引存储）
 */
export function toWishlistMeta(wl: WishlistFile): WishlistMeta {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rules, ...rest } = wl;
    return {
        ...rest,
        rulesCount: rules.length,
    };
}
