import Time from "./date";

const time = new Time();

/** SSR-safe localStorage shim */
const safeLocalStorage = {
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    },
    keys: (): any => {
        if (typeof window === 'undefined') return [];
        return (localStorage as any).keys?.() ?? Object.keys(localStorage);
    }
};

/** SSR-safe sessionStorage shim */
const safeSessionStorage = {
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(key);
    },
    keys: (): any => {
        if (typeof window === 'undefined') return [];
        return (sessionStorage as any).keys?.() ?? Object.keys(sessionStorage);
    }
};

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

        return {
            name: fullName,
            /**
             * session 添加
             * @param name
             * @param value
             * @returns {{code: number, data: {time: number, value: *}}}
             */
            set: (name: string, value: any): { code: number; data: { time: number; value: any; }; } => {
                let data = {value, time: time.update().nowTimeStamp};
                safeSessionStorage.setItem(fullName(name), JSON.stringify(data))
                return {code: 0, data};
            },
            /**
             * session 获取
             * @param name
             * @returns {{code: number, data: any}}
             */
            get: (name: string): { code: number; data?: any; } => {
                let data: any | null = JSON.parse(
                    <any>safeSessionStorage.getItem(fullName(name)))

                let result: { code: number, data?: any } = {code: 0, data: data};
                if (data == null || data === '' || data === undefined) {
                    result = {code: -1}
                }
                return result;
            },
            /**
             * session 删除
             */
            rem: (name: string) => {
                safeSessionStorage.removeItem(fullName(name))
            },
            /**
             * 获取 sessionStorage 键名集合
             * @returns {*}
             */
            keys: (): any => {
                return safeSessionStorage.keys()
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

        return {
            name: fullName,
            /**
             * local 添加
             * @param name
             * @param value
             * @returns {{code: number, data: {time: number, value: *}}}
             */
            set: (name: string, value: any): { code: number; data: { time: number; value: any; }; } => {
                let data = {value, time: time.update().nowTimeStamp}
                safeLocalStorage.setItem(fullName(name), JSON.stringify(data))

                return {code: 0, data};
            },
            /**
             * local 获取
             * @param name
             * @returns {{code: number, data: any}}
             */
            get: (name: string): { code: number; data?: any; } => {
                let data: any | null = JSON.parse(
                    <any>safeLocalStorage.getItem(fullName(name)))

                let result: { code: number, data?: any } = {code: 0, data};
                if (data == null || data === '' || data === undefined) {
                    result = {code: -1}
                }
                return result;
            },
            /**
             * local 删除
             */
            rem: (name: string) => {
                safeLocalStorage.removeItem(fullName(name))
            },
            /**
             * 获取 localStorage 键名集合
             * @returns {*}
             */
            keys: (): any => {
                return safeLocalStorage.keys()
            }
        }
    }
}
