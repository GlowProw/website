/**
 * 简单的储存
 */

import {time} from "./index";

export default class Storage {
    STORAGENAME = `snb.${process.env.NODE_ENV}:`;

    constructor() {
        return this
    }

    /**
     * session
     */
    get session() {
        return {
            /**
             * session 添加
             * @param name
             * @param value
             * @returns {{code: number, data: {time: number, value: *}}}
             */
            set: (name: string, value: any): { code: number; data: { time: number; value: any; }; } => {
                let data = {value, time: time.update().nowTimeStamp};
                sessionStorage.setItem(this.STORAGENAME + name, JSON.stringify(data));
                return {code: 0, data};
            },
            /**
             * session 获取
             * @param name
             * @returns {{code: number, data: any}}
             */
            get: (name: string): { code: number; data?: any; } => {
                let data: any | null = JSON.parse(
                    sessionStorage.getItem(this.STORAGENAME + name)
                );
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
                sessionStorage.removeItem(this.STORAGENAME + name)
            },
            /**
             * get sessionStorage Keys
             * @returns {*}
             */
            keys: (): any => {
                return sessionStorage.keys()
            }
        }
    }

    /**
     * local
     */
    get local() {
        return {
            /**
             * session 添加
             * @param name
             * @param value
             * @returns {{code: number, data: {time: number, value: *}}}
             */
            set: (name: string, value: any): { code: number; data: { time: number; value: any; }; } => {
                let data = {value, time: time.update().nowTimeStamp}
                localStorage.setItem(this.STORAGENAME + name, JSON.stringify(data));

                return {code: 0, data};
            },
            /**
             * session 获取
             * @param name
             * @returns {{code: number, data: any}}
             */
            get: (name: string): { code: number; data?: any; } => {
                let data: any | null = JSON.parse(
                    localStorage.getItem(this.STORAGENAME + name)
                );
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
                localStorage.removeItem(this.STORAGENAME + name);
            },
            /**
             * get sessionStorage Keys
             * @returns {*}
             */
            keys: (): any => {
                return localStorage.keys()
            }
        }
    }
}
