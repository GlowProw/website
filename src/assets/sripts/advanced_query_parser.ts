import {ParsedQuery, SearchCondition} from "@/assets/types/AdvancedQuery";

export class AdvancedQueryParser {
    private static readonly FIELD_PATTERN = /(\w+):([^:\s]+(?:,[^:\s]*)*)(?=\s+|$)/g;
    private static readonly OPERATOR_PATTERN = /([<>!=]+)/;

    /**
     * 解析查询字符串为结构化的查询条件
     */
    static parse(query: string): ParsedQuery {
        if (!query.trim()) {
            return {keywords: [], conditions: [], rawQuery: query};
        }

        const conditions: SearchCondition[] = [];
        let remainingQuery = query;

        // 提取所有字段查询条件
        const fieldMatches = [...query.matchAll(this.FIELD_PATTERN)];

        fieldMatches.forEach(match => {
            const [fullMatch, field, value] = match;

            // 从剩余查询中移除已匹配的部分
            remainingQuery = remainingQuery.replace(fullMatch, '').trim()

            // 解析操作符和值
            const {operator, cleanValue} = this.parseOperatorAndValue(value)

            // 处理多值情况 (逗号分隔)
            const processedValue = this.processValue(cleanValue)

            // 确定是否严格匹配：ID 字段总是严格匹配，其他字段根据操作符决定
            const isStrict = this.shouldUseStrictMatch(field, operator)

            conditions.push({
                field,
                operator,
                value: processedValue,
                isStrict
            })
        })

        // 剩余部分作为关键词
        const keywords = remainingQuery ? remainingQuery.split(/\s+/) : [];

        return {
            keywords,
            conditions,
            rawQuery: query
        };
    }

    /**
     * 解析操作符和值
     */
    private static parseOperatorAndValue(value: string): { operator: string; cleanValue: string } {
        const operatorMatch = value.match(this.OPERATOR_PATTERN)

        if (operatorMatch) {
            const operator = operatorMatch[1];
            const cleanValue = value.replace(this.OPERATOR_PATTERN, '').trim()
            return {operator, cleanValue};
        }

        return {operator: ':', cleanValue: value};
    }

    /**
     * 处理值，支持多值情况
     */
    static processValue(value: string): string | string[] {
        if (value.includes(',')) {
            return value.split(',').map(v => v.trim()).filter(v => v)
        }
        return value;
    }

    /**
     * 确定是否使用严格匹配
     */
    private static shouldUseStrictMatch(field: string, operator: string): boolean {
        // ID 字段总是严格匹配
        if (field === 'id') {
            return true;
        }

        // 使用比较操作符时严格匹配
        if (['>', '<', '>=', '<=', '!=', '='].includes(operator)) {
            return true;
        }

        // 其他字段使用模糊匹配
        return false;
    }

    /**
     * 构建查询字符串
     */
    static build(parsedQuery: ParsedQuery): string {
        const conditionParts = parsedQuery.conditions.map(condition => {
            const value = Array.isArray(condition.value)
                ? condition.value.join(',')
                : condition.value;
            return `${condition.field}${condition.operator}${value}`;
        })

        const keywordPart = parsedQuery.keywords.join(' ')

        return [...conditionParts, keywordPart].filter(part => part).join(' ')
    }

    /**
     * 验证查询条件
     */
    static validate(condition: SearchCondition): boolean {
        const {field, operator, value} = condition;

        // 检查字段名
        if (!field || !/^[a-zA-Z_]\w*$/.test(field)) {
            return false;
        }

        // 检查操作符
        const validOperators = [':', '=', '!=', '>', '<', '>=', '<='];
        if (!validOperators.includes(operator)) {
            return false;
        }

        // 检查值
        return !(!value || (Array.isArray(value) && value.length === 0))
    }
}
