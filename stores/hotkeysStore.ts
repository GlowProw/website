/**
 * 全局快捷键状态与绑定配置 Pinia Store
 * 管理全站快捷键映射，支持动态自定义绑定与本地持久化
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import Storage from '@/assets/sripts/storage';
import type { HotkeyItem, HotkeyMode, PersistedHotkey } from '@/assets/types/Hotkeys';

const storage = new Storage();
const HOTKEYS_STORAGE_KEY = 'user.hotkeys.bindings';

const isMacClient = typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');
const defaultSearchKey = isMacClient ? 'cmd+k' : 'ctrl+k';

/**
 * 默认系统快捷键清单
 */
const DEFAULT_HOTKEYS: HotkeyItem[] = [
  {
    id: 'quickArchive',
    nameKey: 'assembly.workshop.quickArchive',
    descriptionKey: 'setting.hotkeys.quickArchiveDesc',
    category: 'workshop',
    categoryKey: 'setting.hotkeys.categoryWorkshop',
    defaultKey: 's',
    currentKey: 's',
    mode: 'hold',
    defaultMode: 'hold',
  },
  {
    id: 'quickConfirm',
    nameKey: 'assembly.workshop.quickConfirm',
    descriptionKey: 'setting.hotkeys.quickConfirmDesc',
    category: 'workshop',
    categoryKey: 'setting.hotkeys.categoryWorkshop',
    defaultKey: 'f',
    currentKey: 'f',
    mode: 'hold',
    defaultMode: 'hold',
  },
  {
    id: 'openItemDetail',
    nameKey: 'setting.hotkeys.openItemDetail',
    descriptionKey: 'setting.hotkeys.openItemDetailDesc',
    category: 'codex',
    categoryKey: 'setting.hotkeys.categoryCodex',
    defaultKey: 'f',
    currentKey: 'f',
    mode: 'hold',
    defaultMode: 'hold',
  },
  {
    id: 'quickSearch',
    nameKey: 'setting.hotkeys.quickSearch',
    descriptionKey: 'setting.hotkeys.quickSearchDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: defaultSearchKey,
    currentKey: defaultSearchKey,
    mode: 'press',
    defaultMode: 'press',
  },
  {
    id: 'toggleMessages',
    nameKey: 'setting.hotkeys.toggleMessages',
    descriptionKey: 'setting.hotkeys.toggleMessagesDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: 'alt+m',
    currentKey: 'alt+m',
    mode: 'press',
    defaultMode: 'press',
  },
  {
    id: 'toggleHeaderMenu',
    nameKey: 'setting.hotkeys.toggleHeaderMenu',
    descriptionKey: 'setting.hotkeys.toggleHeaderMenuDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: 'alt+h',
    currentKey: 'alt+h',
    mode: 'press',
    defaultMode: 'press',
  },
  {
    id: 'toggleCodexHistory',
    nameKey: 'setting.hotkeys.toggleCodexHistory',
    descriptionKey: 'setting.hotkeys.toggleCodexHistoryDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: isMacClient ? 'option+c' : 'alt+c',
    currentKey: isMacClient ? 'option+c' : 'alt+c',
    mode: 'press',
    defaultMode: 'press',
  },
  {
    id: 'closeModal',
    nameKey: 'setting.hotkeys.closeModal',
    descriptionKey: 'setting.hotkeys.closeModalDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: 'escape',
    currentKey: 'escape',
    mode: 'press',
    defaultMode: 'press',
  },
];

/**
 * 从本地存储加载快捷键配置
 * 兼容早期仅保存按键字符串的格式
 */
function loadPersistedHotkeys(): Record<string, PersistedHotkey> {
  const d = storage.local.get(HOTKEYS_STORAGE_KEY);
  if (d.code < 0 || !d.data?.value) return {};
  const raw = d.data.value;
  if (typeof raw !== 'object') return {};

  const result: Record<string, PersistedHotkey> = {};
  for (const [id, value] of Object.entries(raw as Record<string, any>)) {
    if (typeof value === 'string') {
      result[id] = {key: value, mode: 'press'};
      continue;
    }
    if (value && typeof value === 'object' && typeof value.key === 'string') {
      result[id] = {
        key: value.key,
        mode: value.mode === 'hold' ? 'hold' : 'press',
      };
    }
  }
  return result;
}

/**
 * 持久化快捷键配置到本地存储
 * @param mapping 动作 ID 与当前绑定配置的映射表
 */
function savePersistedHotkeys(mapping: Record<string, PersistedHotkey>) {
  storage.local.set(HOTKEYS_STORAGE_KEY, mapping);
}

export const useHotkeysStore = defineStore('hotkeys', () => {
  // 响应式快捷键配置列表
  const hotkeyList = ref<HotkeyItem[]>([]);

  /**
   * 初始化快捷键配置：合并默认值与本地持久化覆盖
   */
  const init = () => {
    const saved = loadPersistedHotkeys();
    hotkeyList.value = DEFAULT_HOTKEYS.map((item) => {
      const persisted = saved[item.id];
      return {
        ...item,
        currentKey: (persisted?.key || item.defaultKey).toLowerCase(),
        mode: persisted?.mode || item.defaultMode,
      };
    });
  };

  // 初始执行一次
  init();

  /**
   * 动作 ID 与按键映射字典
   */
  const keyMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const item of hotkeyList.value) {
      map[item.id] = item.currentKey;
    }
    return map;
  });

  /**
   * 获取指定动作当前绑定的快捷键
   * @param actionId 动作唯一标识
   */
  const getKey = (actionId: string): string => {
    return keyMap.value[actionId] || '';
  };

  /**
   * 获取指定动作当前的触发方式
   * @param actionId 动作唯一标识
   */
  const getMode = (actionId: string): HotkeyMode => {
    return hotkeyList.value.find((item) => item.id === actionId)?.mode || 'press';
  };

  /**
   * 更新指定动作的快捷键绑定
   * @param actionId 动作唯一标识
   * @param newKey 新的按键（已格式化为小写）
   */
  const updateKey = (actionId: string, newKey: string): { success: boolean; conflictId?: string } => {
    const formatted = newKey.trim().toLowerCase();
    if (!formatted) return { success: false };

    const target = hotkeyList.value.find((item) => item.id === actionId);
    if (!target) return { success: false };

    // 仅在同一类别内判定冲突，不同类别的动作不会同时处于可用界面
    const conflict = hotkeyList.value.find((item) =>
        item.id !== actionId && item.currentKey === formatted && item.category === target.category);

    target.currentKey = formatted;
    persist();

    return {
      success: true,
      conflictId: conflict?.id,
    };
  };

  /**
   * 更新指定动作的触发方式
   * @param actionId 动作唯一标识
   * @param mode 按下立即触发或按住蓄力触发
   */
  const updateMode = (actionId: string, mode: HotkeyMode): boolean => {
    const target = hotkeyList.value.find((item) => item.id === actionId);
    if (!target) return false;
    target.mode = mode;
    persist();
    return true;
  };

  /**
   * 持久化当前全部快捷键配置
   */
  const persist = () => {
    const mapping: Record<string, PersistedHotkey> = {};
    for (const item of hotkeyList.value) {
      mapping[item.id] = {key: item.currentKey, mode: item.mode};
    }
    savePersistedHotkeys(mapping);
  };

  /**
   * 重置全部快捷键为系统默认值
   */
  const resetToDefaults = () => {
    hotkeyList.value = DEFAULT_HOTKEYS.map((item) => ({
      ...item,
      currentKey: item.defaultKey.toLowerCase(),
      mode: item.defaultMode,
    }));
    savePersistedHotkeys({});
  };

  return {
    hotkeyList,
    keyMap,
    getKey,
    getMode,
    updateKey,
    updateMode,
    resetToDefaults,
  };
});
