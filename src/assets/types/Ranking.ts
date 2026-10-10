export interface RankingAttr {
    useVersion?: string
}

export interface VersionedDataProcessing<T> {
    get: (data: T) => any;
    set: (data: T, value: any) => T;
    verify: (data: T) => { valid: boolean; errors?: string[] };
}

export type RankingDesignedItemsDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};
