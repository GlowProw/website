/**
 * 包装器
 */
import _Conf from './config';
import _Api from './apis';
import {Apis as _Apis} from './api';
import _Http from './http';
import _Ws from './ws'
import _Storage from './storage'
import _StorageCapacityMonitor from './storage_capacity_monitor'
import _StorageAccount from './storage_account'
import _StorageAds from './storage_ads'
import {StorageIntermediateTransfer as _StorageIntermediateTransfer} from './storage_assembly'
import {StorageCollect as _StorageCollect} from './storage_collect'
import _UserInfoSession from './session_user_info'
import _Date from './date';
import _Number from './number';
import _AppFuns from './app_functions'
import _AppNavs from './app_navs'
import _Rarity from './rarity'
import _AssemblyViewConfig from './assembly_view_config'

export const conf = new _Conf()
export const apis = _Apis;
export const api = new _Api()
export const http = new _Http()
export const ws = new _Ws()
export const storage = new _Storage()
export const storage_capacity_monitor = new _StorageCapacityMonitor()
export const storage_account = new _StorageAccount()
export const storage_ads = new _StorageAds()
export const storageIntermediateTransfer = new _StorageIntermediateTransfer()
export const storageCollect = new _StorageCollect()
export const sessionUserInfo = new _UserInfoSession()
export const time = new _Date()
export const number = new _Number()
export const appFuns = new _AppFuns()
export const appNavs = new _AppNavs()
export const rarity = new _Rarity()
export const assemblyViewConfig = new _AssemblyViewConfig()

export default {
    api, apis, conf, ws, http,
    storage, storage_capacity_monitor, storage_account, storage_ads, storageIntermediateTransfer, storageCollect,
    sessionUserInfo,
    time, number, appFuns, appNavs, rarity, assemblyViewConfig
};
