/**
 * 包装器
 */
import _Conf from './config';
import _Api from './api';
import _Http from './http';
import _Ws from './ws'
import _Storage from './storage'
import {StorageIntermediateTransfer as _StorageIntermediateTransfer} from './storage_assembly'
import {StorageCollect as _StorageCollect} from './storage_collect'
import _Date from './date';
import _Number from './number';
import _AppFuns from './app_functions'
import _AppNavs from './app_navs'
import _Rarity from './rarity'
import _AssemblyViewConfig from './assembly_view_config'

export const conf = new _Conf();
export const api = new _Api();
export const http = new _Http();
export const ws = new _Ws();
export const storage = new _Storage();
export const storageIntermediateTransfer = new _StorageIntermediateTransfer()
export const storageCollect = new _StorageCollect()
export const time = new _Date();
export const number = new _Number()
export const appFuns = new _AppFuns()
export const appNavs = new _AppNavs()
export const rarity = new _Rarity()
export const assemblyViewConfig = new _AssemblyViewConfig()

export default {
    api, conf, ws, http,
    storage, storageIntermediateTransfer, storageCollect, time,
    number, appFuns, appNavs, rarity, assemblyViewConfig
};
