import {computed, ref, watch} from 'vue';
import {AdvancedQueryParser} from './advanced_query_parser';
import {storage} from "@/assets/sripts/index";
import {ParsedQuery, SearchCondition} from "@/assets/types/AdvancedQuery";

export function advanced_search() {
    const searchKey = 'searchHistory'
    const searchQuery = ref('')
    const parsedQuery = ref<ParsedQuery>({keywords: [], conditions: [], rawQuery: ''})
    const searchHistory = ref<string[]>([])
    const MAX_HISTORY = 10;

    /**
     * 解析查询
     * @param query
     */
    const parseSearchQuery = (query: string) => {
        searchQuery.value = query;
        parsedQuery.value = AdvancedQueryParser.parse(query)
    };

    /**
     * 添加条件
     * @param field
     * @param value
     * @param operator
     */
    const addCondition = (field: string, value: string, operator: string = ':') => {
        const condition: SearchCondition = {
            field,
            operator,
            value: AdvancedQueryParser.processValue(value)
        };

        if (AdvancedQueryParser.validate(condition)) {
            const newConditions = [...parsedQuery.value.conditions, condition];
            const newParsedQuery: ParsedQuery = {
                ...parsedQuery.value,
                conditions: newConditions
            };

            searchQuery.value = AdvancedQueryParser.build(newParsedQuery)
            parsedQuery.value = newParsedQuery;
        }
    };

    /**
     * 移除条件
     * @param index
     */
    const removeCondition = (index: number) => {
        const newConditions = [...parsedQuery.value.conditions];
        newConditions.splice(index, 1)

        const newParsedQuery: ParsedQuery = {
            ...parsedQuery.value,
            conditions: newConditions
        };

        searchQuery.value = AdvancedQueryParser.build(newParsedQuery)
        parsedQuery.value = newParsedQuery;
    };

    /**
     * 更新条件
     * @param index
     * @param updates
     */
    const updateCondition = (index: number, updates: Partial<SearchCondition>) => {
        const newConditions = [...parsedQuery.value.conditions];
        const updatedCondition = {...newConditions[index], ...updates};

        if (AdvancedQueryParser.validate(updatedCondition)) {
            newConditions[index] = updatedCondition;

            const newParsedQuery: ParsedQuery = {
                ...parsedQuery.value,
                conditions: newConditions
            };

            searchQuery.value = AdvancedQueryParser.build(newParsedQuery)
            parsedQuery.value = newParsedQuery;
        }
    };

    /**
     * 清空搜索
     */
    const clearSearch = () => {
        searchQuery.value = '';
        parsedQuery.value = {keywords: [], conditions: [], rawQuery: ''};
    };

    /**
     * 添加到历史记录
     * @param query
     */
    const addToHistory = (query: string) => {
        if (!query.trim()) return;

        // 移除重复项
        const filteredHistory = searchHistory.value.filter(item => item !== query)

        // 添加到开头
        filteredHistory.unshift(query)

        // 限制历史记录数量
        searchHistory.value = filteredHistory.slice(0, MAX_HISTORY)

        // 保存
        storage.local.set(searchKey, searchHistory.value)
    };

    /**
     * 从历史记录加载
     */
    const loadHistory = () => {
        try {
            const saved = storage.local.get(searchKey)

            if (saved.code == 0) {
                searchHistory.value = saved.data.value || [];
            }
        } catch (error) {
            console.warn('Failed to load search history:', error)
        }
    };

    // 是否有搜索条件
    const hasConditions = computed(() => parsedQuery.value.conditions.length > 0)
    const hasKeywords = computed(() => parsedQuery.value.keywords.length > 0)
    const isEmpty = computed(() => !hasConditions.value && !hasKeywords.value)

    /**
     * 监听搜索查询变化
     */
    watch(searchQuery, (newQuery) => {
        parsedQuery.value = AdvancedQueryParser.parse(newQuery)
    })

    /**
     * 初始化加载历史记录
     */
    loadHistory()

    return {
        searchKey,
        searchQuery,
        parsedQuery,
        searchHistory,
        parseSearchQuery,
        addCondition,
        removeCondition,
        updateCondition,
        clearSearch,
        addToHistory,
        hasConditions,
        hasKeywords,
        isEmpty
    };
}
