import FlexSearch from "flexsearch";
import {
    Commodities,
    Sets,
    Cosmetics,
    Items,
    MapLocations,
    Materials,
    Modifications,
    Ships,
    Ultimates,
    Masterys,
} from "glow-prow-data";
import NumberUtil from "@/assets/sripts/number";

const numberUtil = new NumberUtil();

let searchIndex: any = null;
let fieldIndices: any = null;
let allItems: any[] = [];
let itemMap: Map<string, any> = new Map();
let messages: any = {};
let locale: string = "zh-CN";

/**
 * 字符串清洗辅助方法（剔除数字）
 * @param input
 */
const sanitizeString = (input: string) => {
    try {
        const removedNumbers: string[] = [];
        if (!input) return { original: input, cleaned: input, removedNumbers };

        const cleaned = input.replace(/\d+/g, (match) => {
            removedNumbers.push(match);
            return "";
        });

        return { original: input, cleaned, removedNumbers };
    } catch (e) {
        console.error(e);
        return { original: input, cleaned: input, removedNumbers: [] };
    }
};

/**
 * 从 messages 国际化对象中提取翻译字符串的辅助方法
 * @param key
 */
const getTranslation = (key: string) => {
    if (!messages || !key) return null;

    // 处理类似 "snb.items.1.name" 的嵌套键名
    const keys = key.split(".");
    let current = messages;

    for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
            current = current[k];
        } else {
            return null;
        }
    }

    if (Array.isArray(current)) {
        return current.filter(Boolean).join(" ");
    }

    return typeof current === "string" ? current : null;
};

const asString = (keys: string[]) => {
    let result = "";
    for (const key of keys) {
        const content = getTranslation(key);
        if (content) {
            result = content;
            break;
        }
    }
    return result; // Return empty string if not found, logic in component might handle fallback
};

/**
 * 复用 i18n_read_name.ts 中针对 Commodities（商品）的名称解析逻辑
 * @param id
 * @param tier
 */
const getCommodityName = (id: string, tier: number) => {
    const sanitized = sanitizeString(id);
    const keys = [
        `snb.commodities.${id}.name`,
        `snb.commodities.${sanitized.cleaned}.name`,
    ];

    const translatedName = asString(keys);
    const tierRoman = numberUtil.intToRoman(tier) || "";

    // 若存在翻译名称，则追加罗马数字阶级
    if (translatedName) {
        return `${translatedName} ${tierRoman}`.trim();
    }

    return id; // Fallback to ID
};

self.onmessage = async (e: MessageEvent) => {
    const { type, payload } = e.data;

    if (type === "init") {
        try {
            messages = payload.messages;
            locale = payload.locale || "zh-CN";

            // 初始化 FlexSearch 搜索引擎
            searchIndex = new FlexSearch.Index({
                tokenize: "full",
                charset: "latin:advanced",
                preset: "default",
                cache: true,
            } as any);

            fieldIndices = {
                id: new FlexSearch.Index({ preset: "default", cache: true }),
                name: new FlexSearch.Index({
                    tokenize: "forward",
                    preset: "default",
                    cache: true,
                }),
                description: new FlexSearch.Index({
                    tokenize: "forward",
                    preset: "default",
                    cache: true,
                }),
            };

            allItems = [];
            itemMap = new Map();

            // 准备专精技能去重列表
            const masteryMap = new Map();
            Object.values(Masterys).forEach((tree: any) => {
                if (tree && tree.nodes) {
                    Object.values(tree.nodes).forEach((node: any) => {
                        if (!masteryMap.has(node.id)) {
                            masteryMap.set(node.id, {
                                ...node,
                                _typeStringName: 'Mastery',
                                seasons: [node.season],
                            });
                        } else {
                            const existing = masteryMap.get(node.id);
                            if (existing && !existing.seasons.includes(node.season)) {
                                existing.seasons.push(node.season);
                            }
                        }
                    });
                }
            });
            const masteryList = Array.from(masteryMap.values());

            let totalItems =
                Object.keys(Items).length +
                Object.keys(Ships).length +
                Object.keys(Commodities).length +
                Object.keys(Materials).length +
                Object.keys(Modifications).length +
                Object.keys(Cosmetics).length +
                Object.keys(Ultimates).length +
                Object.keys(MapLocations).length +
                Object.keys(Sets).length +
                masteryList.length;

            let processedCount = 0;
            const reportProgress = () => {
                processedCount++;
                if (processedCount % 100 === 0 || processedCount === totalItems) {
                    self.postMessage({ type: "progress", payload: processedCount / totalItems });
                }
            };

            // 处理物品 (Items)
            Object.values(Items).forEach((i: any) => {
                const { id, type, description = "", category = "" } = i;
                const sanitized = sanitizeString(id as string);
                const name = asString([
                    `snb.items.${i.id}.name`,
                    `snb.items.${sanitized.cleaned}.name`,
                ]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName),
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理舰船 (Ships)
            Object.values(Ships).forEach((i: any) => {
                const { id, type, description = "", category = "" } = i;
                const sanitized = sanitizeString(id as string);
                const name = asString([
                    `snb.ships.${i.id}.name`,
                    `snb.ships.${sanitized.cleaned}.name`,
                ]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "ship",
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理商品 (Commodities)
            Object.values(Commodities).forEach((i: any) => {
                const { id, type, description = "", category = "" } = i;
                const name = getCommodityName(id, i.tier);

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "commoditie",
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理材料 (Materials)
            Object.values(Materials).forEach((i: any) => {
                const { id, type, description = "", category = "" } = i;
                const name = asString([`snb.materials.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "material",
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理改装件 (Modifications)
            Object.values(Modifications).forEach((i: any) => {
                const { id, type, description = "", category = "", grade = "" } = i;
                const name = asString([`snb.modifications.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "modification",
                    searchableFields: { name, id, description, category, type, grade },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理外观饰品 (Cosmetics)
            Object.values(Cosmetics).forEach((i: any) => {
                const { id, type, description = "", category = "" } = i;
                const name = asString([`snb.cosmetics.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "cosmetic",
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理终极技能 (Ultimates)
            Object.values(Ultimates).forEach((i: any) => {
                const { id, type, description = "", category = "" } = i;
                const name = asString([`snb.ultimates.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "ultimate",
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理地图点位 (MapLocations)
            Object.values(MapLocations).forEach((i: any) => {
                const { id, type, description = "", category = "" } = i;
                const name = asString([`snb.mapLocations.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "mapLocation",
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理集合/套装 (Sets)
            Object.values(Sets).forEach((i: any) => {
                const { id, type, description: desc = "", category = "" } = i;
                const name = asString([
                    `snb.sets.${id}`,
                    `snb.sets.${id}.name`,
                ]) || id;
                const description = asString([
                    `snb.sets.${id}.description.general`,
                    `snb.sets.${id}.description`,
                ]) || desc;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "set",
                    searchableFields: { name, id, description, category, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // 处理专精技能 (Masterys)
            masteryList.forEach((i: any) => {
                const { id, key, type = "", category = "", role = "" } = i;
                const name = asString([
                    `snb.masterys.${id}.name`,
                    `snb.masterys.${key}.name`,
                ]) || id;

                let description = asString([
                    `snb.masterys.${id}.description`,
                    `snb.masterys.${key}.description`,
                ]);

                if (!description && i.effects && Array.isArray(i.effects)) {
                    const effDescriptions = i.effects.map((eff: any) => {
                        let effDesc = asString([`snb.masterys.${eff.id}.description`]);
                        if (effDesc) {
                            for (const [k, v] of Object.entries(eff)) {
                                if (k !== 'id') {
                                    effDesc = effDesc.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v));
                                }
                            }
                        }
                        return effDesc;
                    }).filter(Boolean);
                    if (effDescriptions.length > 0) {
                        description = effDescriptions.join(' ');
                    }
                }

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "mastery",
                    searchableFields: { name, id, key: key || "", description: description || "", category, role, type },
                };

                itemMap.set(`${itemData.sourceType}:${itemData.id}`, itemData);
                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            self.postMessage({ type: "ready", payload: { count: allItems.length } }); // Don't send allItems back, too heavy

        } catch (err) {
            console.error("Worker initialization error:", err);
            self.postMessage({ type: "error", payload: err });
        }
    } else if (type === "search") {
        if (!searchIndex) return;

        const { query, isAdvanced, parsedQuery, limit, types } = payload;
        let resultItems: any[] = [];

        if (isAdvanced && parsedQuery) {
            // 高级搜索
            resultItems = allItems.filter(item => matchesAdvancedQuery(item, parsedQuery));
        } else {
            // 简单关键字搜索
            const resultIds = searchIndex.search(query, {
                limit: 1000, // Increase flexsearch limit to allow filtering/proper grouping afterwards
                suggest: true,
            });

            // 将索引 Key 映射到具体数据项
            resultItems = resultIds
                .map((key: any) => itemMap.get(key) || allItems.find(item => item.id === key))
                .filter((item: any) => item !== undefined);
        }

        // 若指定了类型，则按请求类型过滤
        if (types && types.length > 0) {
            resultItems = resultItems.filter(item => {
                if (types.includes(item.sourceType)) return true;
                if (item.sourceType === 'set' && types.includes('sets')) return true;
                if (item.sourceType === 'mastery' && types.includes('masterys')) return true;
                if (item.sourceType === 'commoditie' && (types.includes('commodity') || types.includes('commodities'))) return true;
                return false;
            });
        }

        // 按类型分组并限制每组结果数量
        const groupedResults = groupResultsByType(resultItems, limit !== undefined ? limit : 20);

        // 深拷贝搜索结果以移除不可序列化的属性（如类方法）
        const serializedResults = JSON.parse(JSON.stringify(groupedResults));

        self.postMessage({ type: "results", payload: serializedResults });
    }
};

/**
 * 高级搜索匹配逻辑
 * @param item
 * @param parsedQuery
 */
const matchesAdvancedQuery = (item: any, parsedQuery: any): boolean => {
    const { keywords, conditions } = parsedQuery;

    // 检查关键词匹配（模糊包含）
    const keywordMatch = keywords.length === 0 || keywords.some((keyword: string) => {
        const searchContent = Object.values(item.searchableFields || {})
            .filter(value => value)
            .join(' ')
            .toLowerCase()
        return searchContent.includes(keyword.toLowerCase())
    })

    // 检查条件匹配
    const conditionMatch = conditions.length === 0 || conditions.every((condition: any) => {
        const { field, operator, value, isStrict } = condition;
        const itemValue = item.searchableFields?.[field] || item[field];

        if (!itemValue) return false;

        const itemValueStr = String(itemValue).toLowerCase()
        const conditionValues = Array.isArray(value) ? value.map((v: any) => String(v).toLowerCase()) : [String(value).toLowerCase()];

        // 根据严格模式采用不同的匹配策略
        if (isStrict) {
            // 严格匹配：精确比对
            return matchesStrictCondition(itemValue, itemValueStr, conditionValues, operator)
        } else {
            // 模糊匹配：包含匹配
            return matchesFuzzyCondition(itemValueStr, conditionValues, operator)
        }
    })

    return keywordMatch && conditionMatch;
};

/**
 * 严格条件匹配
 * @param itemValue
 * @param itemValueStr
 * @param conditionValues
 * @param operator
 */
const matchesStrictCondition = (itemValue: any, itemValueStr: string, conditionValues: string[], operator: string): boolean => {
    switch (operator) {
        case ':':
        case '=':
            // 严格匹配：全等比对或多值包含
            return conditionValues.some(conditionValue =>
                itemValueStr === conditionValue ||
                (Array.isArray(itemValue) && itemValue.includes(conditionValue)))


        case '!=':
            // 严格不全等
            return !conditionValues.some(conditionValue =>
                itemValueStr === conditionValue)


        case '>':
            return Number(itemValue) > Number(conditionValues[0])

        case '<':
            return Number(itemValue) < Number(conditionValues[0])

        case '>=':
            return Number(itemValue) >= Number(conditionValues[0])

        case '<=':
            return Number(itemValue) <= Number(conditionValues[0])

        default:
            return itemValueStr === conditionValues[0];
    }
};

/**
 * 将字符串转换为驼峰命名法（首字母小写）
 * @param {string} str - 输入字符串
 * @returns {string} - 驼峰命名字符串
 */
const toCamelCase = (str: string): string => {
    // 处理空值或非字符串类型
    if (!str || typeof str !== 'string') {
        return '';
    }

    // 匹配所有可能的分隔符后的单词
    return str.replace(/[-_\s]+(.)?/g, function (match, char) {
        // 如果匹配到了字符，将其转换为大写
        if (char) {
            return char.toUpperCase();
        }
        // 如果没有捕获到字符，返回空字符串
        return '';
    }).replace(/^[A-Z]/, function (firstChar) {
        // 确保首字母小写
        return firstChar.toLowerCase();
    });
}

/**
 * 模糊条件匹配
 * @param itemValueStr
 * @param conditionValues
 * @param operator
 */
const matchesFuzzyCondition = (itemValueStr: string, conditionValues: string[], operator: string): boolean => {
    switch (operator) {
        case ':':
        case '=':
            // 模糊匹配：包含
            return conditionValues.some(conditionValue =>
                itemValueStr.includes(conditionValue))


        case '!=':
            // 模糊不匹配：不包含
            return !conditionValues.some(conditionValue =>
                itemValueStr.includes(conditionValue))


        default:
            // 其他操作符退回严格匹配
            return conditionValues.some(conditionValue =>
                itemValueStr.includes(conditionValue))

    }
};

/**
 * 按类型对搜索结果分组，并限制每类返回条数
 * @param results
 * @param limitPerType
 */
const groupResultsByType = (results: any[], limitPerType: number = 20) => {
    const grouped: Record<string, any[]> = {};

    results.forEach(item => {
        const type = item.sourceType || 'unknown';
        if (!grouped[type]) {
            grouped[type] = [];
        }

        // 仅在未达到上限或上限为 0（无限制）时添加
        if (limitPerType <= 0 || grouped[type].length < limitPerType) {
            grouped[type].push(item)
        }
    })

    return grouped;
};

function addToIndex(itemData: any) {
    const { id, sourceType, searchableFields } = itemData;
    const docKey = `${sourceType}:${id}`;
    searchIndex.add(docKey, Object.values(searchableFields).join(" ").toLowerCase());
    fieldIndices.id.add(docKey, searchableFields.id.toLowerCase());
    fieldIndices.name.add(docKey, searchableFields.name.toLowerCase());
    if (searchableFields.description) {
        fieldIndices.description.add(docKey, searchableFields.description.toLowerCase());
    }
}
