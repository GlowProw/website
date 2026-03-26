import FlexSearch from "flexsearch";
import {Commodities, Cosmetics, Items, MapLocations, Materials, Modifications, Ships, Ultimates,} from "glow-prow-data";
import NumberUtil from "@/assets/sripts/number";

const numberUtil = new NumberUtil();

let searchIndex: any = null;
let fieldIndices: any = null;
let allItems: any[] = [];
let messages: any = {};
let locale: string = "zh-CN";

/**
 * Helper to sanitize string (remove numbers)
 * @param input
 */
const sanitizeString = (input: string) => {
    try {
        const removedNumbers: string[] = [];
        if (!input) return {original: input, cleaned: input, removedNumbers};

        const cleaned = input.replace(/\d+/g, (match) => {
            removedNumbers.push(match);
            return "";
        });

        return {original: input, cleaned, removedNumbers};
    } catch (e) {
        console.error(e);
        return {original: input, cleaned: input, removedNumbers: []};
    }
};

/**
 * Helper to get translated string from messages object
 * @param key
 */
const getTranslation = (key: string) => {
    if (!messages || !key) return null;

    // Handle nested keys like "snb.items.1.name"
    const keys = key.split(".");
    let current = messages;

    for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
            current = current[k];
        } else {
            return null;
        }
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
 * Replicate logic from i18n_read_name.ts for Commodities
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

    // If translated name exists, append tier
    if (translatedName) {
        return `${translatedName} ${tierRoman}`.trim();
    }

    return id; // Fallback to ID
};

self.onmessage = async (e: MessageEvent) => {
    const {type, payload} = e.data;

    if (type === "init") {
        try {
            messages = payload.messages;
            locale = payload.locale || "zh-CN";

            // Initialize FlexSearch
            searchIndex = new FlexSearch.Index({
                tokenize: "full",
                charset: "latin:advanced",
                preset: "default",
                cache: true,
            } as any);

            fieldIndices = {
                id: new FlexSearch.Index({preset: "default", cache: true}),
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
            let totalItems =
                Object.keys(Items).length +
                Object.keys(Ships).length +
                Object.keys(Commodities).length +
                Object.keys(Materials).length +
                Object.keys(Modifications).length +
                Object.keys(Cosmetics).length +
                Object.keys(Ultimates).length +
                Object.keys(MapLocations).length;

            let processedCount = 0;
            const reportProgress = () => {
                processedCount++;
                if (processedCount % 100 === 0 || processedCount === totalItems) {
                    self.postMessage({type: "progress", payload: processedCount / totalItems});
                }
            };

            // Process Items
            Object.values(Items).forEach((i: any) => {
                const {id, type, description = "", category = ""} = i;
                const sanitized = sanitizeString(id as string);
                const name = asString([
                    `snb.items.${i.id}.name`,
                    `snb.items.${sanitized.cleaned}.name`,
                ]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName),
                    searchableFields: {name, id, description, category, type},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // Process Ships
            Object.values(Ships).forEach((i: any) => {
                const {id, type, description = "", category = ""} = i;
                const sanitized = sanitizeString(id as string);
                const name = asString([
                    `snb.ships.${i.id}.name`,
                    `snb.ships.${sanitized.cleaned}.name`,
                ]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "ship",
                    searchableFields: {name, id, description, category, type},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // Process Commodities
            Object.values(Commodities).forEach((i: any) => {
                const {id, type, description = "", category = ""} = i;
                const name = getCommodityName(id, i.tier);

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "commoditie",
                    searchableFields: {name, id, description, category, type},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // Process Materials
            Object.values(Materials).forEach((i: any) => {
                const {id, type, description = "", category = ""} = i;
                const name = asString([`snb.materials.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "material",
                    searchableFields: {name, id, description, category, type},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // Process Modifications
            Object.values(Modifications).forEach((i: any) => {
                const {id, type, description = "", category = "", grade = ""} = i;
                const name = asString([`snb.modifications.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "modification",
                    searchableFields: {name, id, description, category, type, grade},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // Process Cosmetics
            Object.values(Cosmetics).forEach((i: any) => {
                const {id, type, description = "", category = ""} = i;
                const name = asString([`snb.cosmetics.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "cosmetic",
                    searchableFields: {name, id, description, category, type},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // Process Ultimates
            Object.values(Ultimates).forEach((i: any) => {
                const {id, type, description = "", category = ""} = i;
                const name = asString([`snb.ultimates.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "ultimate",
                    searchableFields: {name, id, description, category, type},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            // Process MapLocations
            Object.values(MapLocations).forEach((i: any) => {
                const {id, type, description = "", category = ""} = i;
                const name = asString([`snb.mapLocations.${i.id}.name`]) || id;

                const itemData = {
                    ...i,
                    name,
                    sourceType: toCamelCase(i._typeStringName) || "mapLocation",
                    searchableFields: {name, id, description, category, type},
                };

                allItems.push(itemData);
                addToIndex(itemData);
                reportProgress();
            });

            self.postMessage({type: "ready", payload: {count: allItems.length}}); // Don't send allItems back, too heavy

        } catch (err) {
            console.error("Worker initialization error:", err);
            self.postMessage({type: "error", payload: err});
        }
    } else if (type === "search") {
        if (!searchIndex) return;

        const {query, isAdvanced, parsedQuery, limit, types} = payload;
        let resultItems: any[] = [];

        if (isAdvanced && parsedQuery) {
            // Advanced search
            resultItems = allItems.filter(item => matchesAdvancedQuery(item, parsedQuery));
        } else {
            // Simple search
            const resultIds = searchIndex.search(query, {
                limit: 1000, // Increase flexsearch limit to allow filtering/proper grouping afterwards
                suggest: true,
            });

            // Map IDs to items
            resultItems = resultIds
                .map((id: any) => allItems.find(item => item.id === id))
                .filter((item: any) => item !== undefined);
        }

        // Filter by requested types if specified
        if (types && types.length > 0) {
            resultItems = resultItems.filter(item => types.includes(item.sourceType));
        }

        // Group results by type and limit
        const groupedResults = groupResultsByType(resultItems, limit !== undefined ? limit : 20);

        // Deep clone the results to strip out any non-serializable properties (like class methods)
        const serializedResults = JSON.parse(JSON.stringify(groupedResults));

        self.postMessage({type: "results", payload: serializedResults});
    }
};

/**
 * Advanced search matching logic
 * @param item
 * @param parsedQuery
 */
const matchesAdvancedQuery = (item: any, parsedQuery: any): boolean => {
    const {keywords, conditions} = parsedQuery;

    // Check keyword match (fuzzy)
    const keywordMatch = keywords.length === 0 || keywords.some((keyword: string) => {
        const searchContent = Object.values(item.searchableFields || {})
            .filter(value => value)
            .join(' ')
            .toLowerCase()
        return searchContent.includes(keyword.toLowerCase())
    })

    // Check condition match
    const conditionMatch = conditions.length === 0 || conditions.every((condition: any) => {
        const {field, operator, value, isStrict} = condition;
        const itemValue = item.searchableFields?.[field] || item[field];

        if (!itemValue) return false;

        const itemValueStr = String(itemValue).toLowerCase()
        const conditionValues = Array.isArray(value) ? value.map((v: any) => String(v).toLowerCase()) : [String(value).toLowerCase()];

        // Use different strategy based on strictness
        if (isStrict) {
            // Strict match: exact comparison
            return matchesStrictCondition(itemValue, itemValueStr, conditionValues, operator)
        } else {
            // Fuzzy match: contains
            return matchesFuzzyCondition(itemValueStr, conditionValues, operator)
        }
    })

    return keywordMatch && conditionMatch;
};

/**
 * Strict match condition
 * @param itemValue
 * @param itemValueStr
 * @param conditionValues
 * @param operator
 */
const matchesStrictCondition = (itemValue: any, itemValueStr: string, conditionValues: string[], operator: string): boolean => {
    switch (operator) {
        case ':':
        case '=':
            // Strict match: exact equal or multi-value includes
            return conditionValues.some(conditionValue =>
                itemValueStr === conditionValue ||
                (Array.isArray(itemValue) && itemValue.includes(conditionValue)))


        case '!=':
            // Strict not equal
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
 * Fuzzy match condition
 * @param itemValueStr
 * @param conditionValues
 * @param operator
 */
const matchesFuzzyCondition = (itemValueStr: string, conditionValues: string[], operator: string): boolean => {
    switch (operator) {
        case ':':
        case '=':
            // Fuzzy match: contains
            return conditionValues.some(conditionValue =>
                itemValueStr.includes(conditionValue))


        case '!=':
            // Fuzzy not match: not contains
            return !conditionValues.some(conditionValue =>
                itemValueStr.includes(conditionValue))


        default:
            // Other operators use strict match
            return conditionValues.some(conditionValue =>
                itemValueStr.includes(conditionValue))

    }
};

/**
 * Group results by type and limit count per type
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

        // Only add if under limit, or if limit is 0 (infinite)
        if (limitPerType <= 0 || grouped[type].length < limitPerType) {
            grouped[type].push(item)
        }
    })

    return grouped;
};

function addToIndex(itemData: any) {
    const {id, searchableFields} = itemData;
    searchIndex.add(id, Object.values(searchableFields).join(" ").toLowerCase());
    fieldIndices.id.add(id, searchableFields.id.toLowerCase());
    fieldIndices.name.add(id, searchableFields.name.toLowerCase());
    if (searchableFields.description) {
        fieldIndices.description.add(id, searchableFields.description.toLowerCase());
    }
}
