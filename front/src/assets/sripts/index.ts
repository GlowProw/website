/**
 * 包装器
 */
import _Conf from './conf';
import _Api from './api';
import _Http from './http';
import _Ws from './ws'
import _Storage from './storage'
import _Time from './date';
import _I18n from './i18n'

export const conf = new _Conf();
export const api = new _Api();
export const http = new _Http();
export const ws = new _Ws();
export const storage = new _Storage();
export const time = new _Time();
export const i18n = new _I18n();

export default {
    api, conf, ws, http, storage, time, i18n
};
