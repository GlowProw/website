/**
 * 持久数据统计
 */
export default class StorageCapacityMonitor {
    utf16Multiplier: number

    constructor() {
        this.utf16Multiplier = 2; // UTF-16编码乘数
    }

    /**
     * 获取存储使用情况
     * @param {Storage} storage - localStorage 或 sessionStorage
     */
    getStorageUsage(storage: Storage = localStorage) {
        const usage: any = {
            keys: [],
            totalKeys: 0,
            totalSize: 0,
            details: []
        };

        for (let i = 0; i < storage.length; i++) {
            const key: any = storage.key(i)
            const value: any = storage.getItem(key)

            if (key) {
                const keySize = new Blob([key]).size;
                const valueSize = new Blob([value]).size;
                const entrySize = keySize + valueSize;

                usage.keys.push(key)
                usage.totalSize += entrySize;
                usage.details.push({
                    key,
                    valueLength: value ? value.length : 0,
                    keySize,
                    valueSize,
                    totalSize: entrySize
                })
            }
        }

        usage.totalKeys = usage.keys.length;

        return usage;
    }

    /**
     * 格式化字节大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的字符串
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取详细报告
     * @param {Storage} storage - localStorage 或 sessionStorage
     * @returns {Object} 详细报告
     */
    getDetailedReport(storage: Storage = localStorage): object {
        const usage = this.getStorageUsage(storage)

        return {
            summary: {
                totalKeys: usage.totalKeys,
                totalSize: usage.totalSize,
                formattedSize: this.formatBytes(usage.totalSize)
            },
            keys: usage.keys,
            details: usage.details.map((item: any) => ({
                key: item.key,
                valueLength: item.valueLength,
                keySize: this.formatBytes(item.keySize),
                valueSize: this.formatBytes(item.valueSize),
                totalSize: this.formatBytes(item.totalSize)
            }))
        };
    }

    /**
     * 获取存储统计
     * @returns {Object} 包含localStorage和sessionStorage的统计
     */
    getAllStorageStats() {
        return {
            localStorage: {
                usage: this.getDetailedReport(localStorage),
                capacity: this.estimateCapacity(localStorage)
            },
            sessionStorage: {
                usage: this.getDetailedReport(sessionStorage),
                capacity: this.estimateCapacity(sessionStorage)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 估算最大容量
     * @param {Storage} storage - 存储对象
     * @returns {Object} 容量信息
     */
    estimateCapacity(storage: Storage = localStorage): object {
        // 不同浏览器的典型容量
        const browserCapacities: any = {
            chrome: 10 * 1024 * 1024, // 10MB
            firefox: 10 * 1024 * 1024, // 10MB
            safari: 5 * 1024 * 1024,   // 5MB
            edge: 10 * 1024 * 1024,    // 10MB
            opera: 10 * 1024 * 1024,   // 10MB
            ie: 10 * 1024 * 1024       // 10MB
        };

        // 获取浏览器类型
        const userAgent = navigator.userAgent.toLowerCase()
        let browser = 'unknown';

        if (userAgent.includes('chrome')) browser = 'chrome';
        else if (userAgent.includes('firefox')) browser = 'firefox';
        else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'safari';
        else if (userAgent.includes('edge')) browser = 'edge';
        else if (userAgent.includes('opera')) browser = 'opera';
        else if (userAgent.includes('trident') || userAgent.includes('msie')) browser = 'ie';

        const typicalCapacity = browserCapacities[browser] || 5 * 1024 * 1024;
        const used = this.getStorageUsage(storage).totalSize;

        return {
            estimatedMax: typicalCapacity,
            estimatedMaxFormatted: this.formatBytes(typicalCapacity),
            used: used,
            usedFormatted: this.formatBytes(used),
            remaining: typicalCapacity - used,
            remainingFormatted: this.formatBytes(typicalCapacity - used),
            percentage: ((used / typicalCapacity) * 100).toFixed(2) + '%',
            browser: browser
        };
    }

    /**
     * 清理存储
     * @param {Storage} storage - 存储对象
     * @param {Array} keysToKeep - 要保留的键数组
     */
    clearStorage(storage: Storage = localStorage, keysToKeep: Array<any> = []) {
        const keysToRemove = [];

        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i)
            if (key && !keysToKeep.includes(key)) {
                keysToRemove.push(key)
            }
        }

        keysToRemove.forEach(key => storage.removeItem(key))

        return {
            cleared: keysToRemove.length,
            remaining: storage.length
        };
    }
}
