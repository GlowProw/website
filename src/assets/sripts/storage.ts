import Time from "./date";

const time = new Time();

export default class Storage {
    STORAGENAME = `snb.${process.env.NODE_ENV}:`;

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
                let data = {value, time: time.update().nowTimeStamp};
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
                let data = {value, time: time.update().nowTimeStamp}
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
