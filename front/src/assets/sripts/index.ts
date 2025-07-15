/**
 * 包装器
 */
import _Conf from './conf';
import _Api from './api';
import _Http from './http';
import _Storage from './storage.ts'
import _Time from './date';
import _Application from './application.ts'

export const conf = new _Conf();
export const api = new _Api();
export const http = new _Http();
export const storage = new _Storage();
export const time = new _Time();
export const application = new _Application()


export default {
    api, http, conf, storage, time, application
};
