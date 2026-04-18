/**
 * 愿望清单解析器 & 匹配器
 */

import { v6 as uuidV6 } from 'uuid';

/**
 * 单条愿望清单规则
 */
export interface WishlistRule {
    /** 物品 hash 或 ID */
    itemId: string;
    /** perk/mod hash 列表 */
    perks: string[];
    /** 备注 */
    notes: string;
    /** 标签（如 pve, pvp） */
    tags: string[];
}

/**
 * 愿望清单文件
 */
export interface WishlistFile {
    /** 唯一 ID */
    id: string;
    /** 清单标题 */
    title: string;
    /** 清单描述 */
    description: string;
    /** 所有规则 */
    rules: WishlistRule[];
    /** 是否启用 */
    enabled: boolean;
    /** 来源（URL 或文件名） */
    source: string;
    /** 导入时间 */
    importedAt: number;
}

/**
 * 愿望清单匹配结果
 */
export interface WishlistMatch {
    /** 是否匹配 */
    matched: boolean;
    /** 匹配到的规则 */
    rules: WishlistRule[];
    /** 来源清单名 */
    wishlistNames: string[];
}

/**
 * 解析愿望清单格式文本
 */
export function parseWishlistText(text: string, source: string = ''): WishlistFile {
    const lines = text.split(/\r?\n/);
    let title = '';
    let description = '';
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

            // 解析 item=xxx&perks=xxx
            const params = new URLSearchParams(paramPart);
            const itemId = params.get('item') || '';
            const perksRaw = params.get('perks') || '';
            const perks = perksRaw ? perksRaw.split(',').map(p => p.trim()).filter(Boolean) : [];

            if (itemId) {
                rules.push({
                    itemId,
                    perks,
                    notes: lineNotes,
                    tags: lineTags,
                });
            }
            continue;
        }
    }

    return {
        id: uuidV6(),
        title: title || source || 'Unnamed Wishlist',
        description,
        rules,
        enabled: true,
        source,
        importedAt: Date.now(),
    };
}

/**
 * 从已解析的愿望清单列表中构建物品查找 Map
 * key: itemId, value: WishlistRule[]
 */
export function buildWishlistLookup(wishlists: WishlistFile[]): Map<string, WishlistRule[]> {
    const map = new Map<string, WishlistRule[]>();

    for (const wl of wishlists) {
        if (!wl.enabled) continue;

        for (const rule of wl.rules) {
            const existing = map.get(rule.itemId);
            if (existing) {
                existing.push(rule);
            } else {
                map.set(rule.itemId, [rule]);
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
    lookup: Map<string, WishlistRule[]>,
    wishlistNames?: Map<string, string>
): WishlistMatch | null {
    if (!itemId || !lookup) return null;

    const rules = lookup.get(itemId);
    if (!rules || rules.length === 0) return null;

    return {
        matched: true,
        rules,
        wishlistNames: [],
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
        lines.push(`wishlist:item=${rule.itemId}${perksStr}`);
    }

    return lines.join('\r\n');
}
