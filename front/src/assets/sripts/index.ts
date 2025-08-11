/**
 * 包装器
 */
import _Conf from './config';
import _Api from './api';
import _Http from './http';
import _Ws from './ws'
import _Storage from './storage'
import {StorageAssembly as _StorageAssembly} from './storage_assembly'
import {StorageCollect as _StorageCollect} from './storage_collect'
import _Date from './date';
import _Number from './number';

export const conf = new _Conf();
export const api = new _Api();
export const http = new _Http();
export const ws = new _Ws();
export const storage = new _Storage();
export const storageAssembly = new _StorageAssembly()
export const storageCollect = new _StorageCollect()
export const time = new _Date();
export const number = new _Number()

export default {
    api, conf, ws, http,
    storage, storageAssembly, storageCollect, time,
    number,
};
