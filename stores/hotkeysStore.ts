/**
 * 全局快捷键状态与绑定配置 Pinia Store
 * 管理全站快捷键映射，支持动态自定义绑定与本地持久化
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import Storage from '@/assets/sripts/storage';

export interface HotkeyItem {
  /**
   * 动作唯一标识
   */
  id: string;
  /**
   * 动作名称多语言键
   */
  nameKey: string;
  /**
   * 动作描述多语言键
   */
  descriptionKey: string;
  /**
   * 动作所属类别
   */
  category: 'workshop' | 'global';
  /**
   * 类别名称多语言键
   */
  categoryKey: string;
  /**
   * 默认按键
   */
  defaultKey: string;
  /**
   * 当前生效按键
   */
  currentKey: string;
}

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
  },
  {
    id: 'quickConfirm',
    nameKey: 'assembly.workshop.quickConfirm',
    descriptionKey: 'setting.hotkeys.quickConfirmDesc',
    category: 'workshop',
    categoryKey: 'setting.hotkeys.categoryWorkshop',
    defaultKey: 'f',
    currentKey: 'f',
  },
  {
    id: 'quickSearch',
    nameKey: 'setting.hotkeys.quickSearch',
    descriptionKey: 'setting.hotkeys.quickSearchDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: defaultSearchKey,
    currentKey: defaultSearchKey,
  },
  {
    id: 'toggleMessages',
    nameKey: 'setting.hotkeys.toggleMessages',
    descriptionKey: 'setting.hotkeys.toggleMessagesDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: 'alt+m',
    currentKey: 'alt+m',
  },
  {
    id: 'toggleHeaderMenu',
    nameKey: 'setting.hotkeys.toggleHeaderMenu',
    descriptionKey: 'setting.hotkeys.toggleHeaderMenuDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: 'alt+h',
    currentKey: 'alt+h',
  },
  {
    id: 'closeModal',
    nameKey: 'setting.hotkeys.closeModal',
    descriptionKey: 'setting.hotkeys.closeModalDesc',
    category: 'global',
    categoryKey: 'setting.hotkeys.categoryGlobal',
    defaultKey: 'escape',
    currentKey: 'escape',
  },
];

/**
 * 从本地存储加载快捷键配置
 */
function loadPersistedHotkeys(): Record<string, string> {
  const d = storage.local.get(HOTKEYS_STORAGE_KEY);
  if (d.code < 0 || !d.data?.value) return {};
  return typeof d.data.value === 'object' ? d.data.value : {};
}

/**
 * 持久化快捷键字典到本地存储
 * @param mapping 动作 ID 与当前按键的映射表
 */
function savePersistedHotkeys(mapping: Record<string, string>) {
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
    hotkeyList.value = DEFAULT_HOTKEYS.map((item) => ({
      ...item,
      currentKey: (saved[item.id] || item.defaultKey).toLowerCase(),
    }));
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
   * 更新指定动作的快捷键绑定
   * @param actionId 动作唯一标识
   * @param newKey 新的按键（已格式化为小写）
   */
  const updateKey = (actionId: string, newKey: string): { success: boolean; conflictId?: string } => {
    const formatted = newKey.trim().toLowerCase();
    if (!formatted) return { success: false };

    // 检查按键冲突
    const conflict = hotkeyList.value.find((item) => item.id !== actionId && item.currentKey === formatted);

    const target = hotkeyList.value.find((item) => item.id === actionId);
    if (!target) return { success: false };

    target.currentKey = formatted;

    // 持久化存储
    const mapping: Record<string, string> = {};
    for (const item of hotkeyList.value) {
      mapping[item.id] = item.currentKey;
    }
    savePersistedHotkeys(mapping);

    return {
      success: true,
      conflictId: conflict?.id,
    };
  };

  /**
   * 重置全部快捷键为系统默认值
   */
  const resetToDefaults = () => {
    hotkeyList.value = DEFAULT_HOTKEYS.map((item) => ({
      ...item,
      currentKey: item.defaultKey.toLowerCase(),
    }));
    savePersistedHotkeys({});
  };

  return {
    hotkeyList,
    keyMap,
    getKey,
    updateKey,
    resetToDefaults,
  };
});
