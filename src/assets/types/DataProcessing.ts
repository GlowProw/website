/**
 * 版本化数据处理相关类型定义（轮盘 / 仓库）
 */

export interface VersionedDataProcessing<T> {
    get: (data: T) => any;
    set: (data: T) => T;
    verify: (data: T) => { valid: boolean; errors?: string[] };
}

export type WheelDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};

export type WarehouseDataProcessingMap<T = any> = {
    [version: string]: VersionedDataProcessing<T>;
};
