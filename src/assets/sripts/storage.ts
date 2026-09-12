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
                sessionStorage.setItem(fullName(name), JSON.stringify(data))
                return {code: 0, data};
            },
            /**
             * session 获取
             * @param name
             * @returns {{code: number, data: any}}
             */
            get: (name: string): { code: number; data?: any; } => {
                let data: any | null = JSON.parse(
                    <any>sessionStorage.getItem(fullName(name)))

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
                sessionStorage.removeItem(fullName(name))
            },
            /**
             * 获取 sessionStorage 键名集合
             * @returns {*}
             */
            keys: (): any => {
                return sessionStorage.keys()
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
             * session 添加
             * @param name
             * @param value
             * @returns {{code: number, data: {time: number, value: *}}}
             */
            set: (name: string, value: any): { code: number; data: { time: number; value: any; }; } => {
                let data = {value, time: time.update().nowTimeStamp}
                localStorage.setItem(fullName(name), JSON.stringify(data))

                return {code: 0, data};
            },
            /**
             * session 获取
             * @param name
             * @returns {{code: number, data: any}}
             */
            get: (name: string): { code: number; data?: any; } => {
                let data: any | null = JSON.parse(
                    <any>localStorage.getItem(fullName(name)))

                let result: { code: number, data?: any } = {code: 0, data};
                if (data == null || data === '' || data === undefined) {
                    result = {code: -1}
                }
                return result;
            },
            /**
             * session 删除
             */
            rem: (name: string) => {
                localStorage.removeItem(fullName(name))
            },
            /**
             * 获取 localStorage 键名集合
             * @returns {*}
             */
            keys: (): any => {
                return localStorage.keys()
            }
        }
    }
}
