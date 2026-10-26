export interface RankingAttr {
    useVersion?: string
}

export interface RankingValidationRule {
    condition: () => boolean;
    required: boolean;
    message: string;
}

export interface RankingVerificationResult {
    required: number;
    optional: number;
    verify: { required: boolean; message: string }[];
    valid: boolean;
}

export interface VersionedDataProcessing<T> {
    get: (data: T) => any;
    set: (data: T, value: any) => T;
    verify: (data: T) => RankingVerificationResult;
}

export type RankingDesignedItemsDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};
