export interface SearchCondition {
    field: string;
    operator: string;
    value: string | string[];
    isStrict?: boolean;
}

export interface ParsedQuery {
    keywords: string[];
    conditions: SearchCondition[];
    rawQuery: string;
}
