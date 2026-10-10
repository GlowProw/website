import type {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";

export type AccountStorageType = 'app' | 'ad' | 'search' | 'poster' | 'appFun' | 'assembly' | 'map' | 'comment';

export interface StorageOptions {
    defaultValue?: any;
}

export interface StorageIntermediateTransferOptions {
    // 转存id
    uid?: string
    // 转存类型，如数据/存稿
    saveType?: StorageIntermediateTransferSaveType
    // 转存大类
    category: 'assembly' | 'ranking'
}
