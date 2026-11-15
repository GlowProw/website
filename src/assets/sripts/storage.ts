/**
 * 获取本地存储环境前缀
 */
const getStorageEnv = (): string => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env.MODE || (import.meta.env.PROD ? 'production' : 'development');
        }
    } catch {}
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
        return process.env.NODE_ENV;
    }
    return 'production';
};

export default class Storage {
    STORAGENAME = `snb.${getStorageEnv()}:`;

    constructor() {
        return this
    }

    /**
     * 会话存储 (session)
     */
    get session() {
        let storage_name = this.STORAGENAME;

        function fullName(name: string): string {
            return storage_name + name;
        }

        const isClient = typeof window !== 'undefined';

        return {
            name: fullName,
            set: (name: string, value: any): { code: number; data: { time: number; value: any; }; } => {
                let data = {value, time: Date.now()};
                if (isClient) sessionStorage.setItem(fullName(name), JSON.stringify(data))
                return {code: 0, data};
            },
            get: (name: string): { code: number; data?: any; } => {
                if (!isClient) return {code: -1};
                let data: any | null = JSON.parse(sessionStorage.getItem(fullName(name)) ?? 'null')
                let result: { code: number, data?: any } = {code: 0, data: data};
                if (data == null || data === '' || data === undefined) {
                    result = {code: -1}
                }
                return result;
            },
            rem: (name: string) => {
                if (isClient) sessionStorage.removeItem(fullName(name))
            },
            keys: (): string[] => {
                if (!isClient) return [];
                return (sessionStorage as any).keys?.() ?? Object.keys(sessionStorage);
            }
        }
    }

    /**
     * 本地存储 (local)
     */
    get local() {
        let storage_name = this.STORAGENAME;

        function fullName(name: string): string {
            return storage_name + name;
        }

        const isClient = typeof window !== 'undefined';

        return {
            name: fullName,
            set: (name: string, value: any): { code: number; data: { time: number; value: any; }; } => {
                let data = {value, time: Date.now()}
                if (isClient) localStorage.setItem(fullName(name), JSON.stringify(data))
                return {code: 0, data};
            },
            get: (name: string): { code: number; data?: any; } => {
                if (!isClient) return {code: -1};
                let data: any | null = JSON.parse(localStorage.getItem(fullName(name)) ?? 'null')
                let result: { code: number, data?: any } = {code: 0, data};
                if (data == null || data === '' || data === undefined) {
                    result = {code: -1}
                }
                return result;
            },
            rem: (name: string) => {
                if (isClient) localStorage.removeItem(fullName(name))
            },
            keys: (): string[] => {
                if (!isClient) return [];
                return (localStorage as any).keys?.() ?? Object.keys(localStorage);
            }
        }
    }
}
