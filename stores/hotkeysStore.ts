/**
 * 全局快捷键状态与绑定配置 Pinia Store
 * 管理全站快捷键映射，支持动态自定义绑定与本地持久化
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import Storage from '@/assets/sripts/storage';
import type { HotkeyCategory, HotkeyItem, HotkeyLocation, HotkeyMode, PersistedHotkey } from '@/assets/types/Hotkeys';

const storage = new Storage();
const HOTKEYS_STORAGE_KEY = 'user.hotkeys.bindings';

const isMacClient = typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');
const defaultSearchKey = isMacClient ? 'cmd+k' : 'ctrl+k';
// 平台修饰键，用于保存、撤销等组合键默认值
const modifierKey = isMacClient ? 'cmd' : 'ctrl';
// 平台 Alt 键名称，macOS 上为 option
const altKey = isMacClient ? 'option' : 'alt';

/**
 * 快速定义快捷键动作，统一生成多语言键与分类键
 * @param id 动作唯一标识
 * @param action 动作名称键名（位于 setting.hotkeys.actions 下）
 * @param category 动作分组
 * @param locations 生效地点清单
 * @param key 默认按键
 * @param mode 触发方式
 */
function defineHotkey(
    id: string,
    action: string,
    category: HotkeyCategory,
    locations: HotkeyLocation[],
    key: string,
    mode: HotkeyMode = 'press',
): HotkeyItem {
  return {
    id,
    nameKey: `setting.hotkeys.actions.${action}`,
    descriptionKey: `setting.hotkeys.actions.${action}Desc`,
    category,
    categoryKey: `setting.hotkeys.category${category.charAt(0).toUpperCase()}${category.slice(1)}`,
    locations,
    defaultKey: key,
    currentKey: key,
    mode,
    defaultMode: mode,
  };
}

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
    locations: ['workshop'],
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
    locations: ['workshop', 'codexModification'],
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
    locations: ['codexCard', 'quest'],
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
    locations: ['global'],
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
    locations: ['global'],
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
    locations: ['global'],
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
    locations: ['global'],
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
    locations: ['global'],
    defaultKey: 'escape',
    currentKey: 'escape',
    mode: 'press',
    defaultMode: 'press',
  },

  // 顶栏按钮组
  defineHotkey('headerSearch', 'headerSearch', 'global', ['global'], `${altKey}+1`),
  defineHotkey('headerHistory', 'headerHistory', 'global', ['global'], `${altKey}+2`),
  defineHotkey('headerMessages', 'headerMessages', 'global', ['global'], `${altKey}+3`),
  defineHotkey('headerSettings', 'headerSettings', 'global', ['global'], `${altKey}+4`),

  // 图鉴列表
  defineHotkey('codexFocusSearch', 'codexFocusSearch', 'codex', ['codexList'], '/'),
  defineHotkey('codexPrevPage', 'codexPrevPage', 'codex', ['codexList'], '['),
  defineHotkey('codexNextPage', 'codexNextPage', 'codex', ['codexList'], ']'),
  defineHotkey('codexIconSizeUp', 'codexIconSizeUp', 'codex', ['codexList'], '+'),
  defineHotkey('codexIconSizeDown', 'codexIconSizeDown', 'codex', ['codexList'], '-'),

  // 图鉴详情
  defineHotkey('codexCollect', 'collectItem', 'codex', ['codexDetail'], 'c'),
  defineHotkey('codexCopyName', 'copyItemName', 'codex', ['codexDetail'], 'shift+c'),
  defineHotkey('codexShare', 'codexShare', 'codex', ['codexDetail'], `${altKey}+s`),
  defineHotkey('codexPrevItem', 'codexPrevItem', 'codex', ['codexDetail'], 'arrowleft'),
  defineHotkey('codexNextItem', 'codexNextItem', 'codex', ['codexDetail'], 'arrowright'),
  defineHotkey('codexOpenNewWindow', 'codexOpenNewWindow', 'codex', ['codexDetail'], `${altKey}+enter`),

  // 图鉴悬浮详情卡片
  defineHotkey('overlayCollect', 'collectItem', 'codex', ['overlayCard'], 's', 'hold'),
  defineHotkey('overlayCopyName', 'copyItemName', 'codex', ['overlayCard'], 'c', 'hold'),

  // 游览历史抽屉
  defineHotkey('historyPrev', 'historyPrev', 'codex', ['codexHistory'], 'arrowup'),
  defineHotkey('historyNext', 'historyNext', 'codex', ['codexHistory'], 'arrowdown'),
  defineHotkey('historyOpen', 'historyOpen', 'codex', ['codexHistory'], 'enter'),
  defineHotkey('historyDelete', 'historyDelete', 'codex', ['codexHistory'], 'backspace'),

  // 全局搜索抽屉
  defineHotkey('searchPrev', 'searchPrev', 'global', ['globalSearch'], 'arrowup'),
  defineHotkey('searchNext', 'searchNext', 'global', ['globalSearch'], 'arrowdown'),
  defineHotkey('searchOpen', 'searchOpen', 'global', ['globalSearch'], 'enter'),
  defineHotkey('searchNextCategory', 'searchNextCategory', 'global', ['globalSearch'], 'tab'),

  // 消息抽屉
  defineHotkey('messagesMarkAllRead', 'messagesMarkAllRead', 'global', ['messages'], `${altKey}+shift+r`),
  defineHotkey('messagesPrevTab', 'messagesPrevTab', 'global', ['messages'], '['),
  defineHotkey('messagesNextTab', 'messagesNextTab', 'global', ['messages'], ']'),

  // 配装工坊
  defineHotkey('workshopSave', 'workshopSave', 'workshop', ['workshop'], `${modifierKey}+s`),
  defineHotkey('workshopUndo', 'workshopUndo', 'workshop', ['workshop'], `${modifierKey}+z`),

  // 地图
  defineHotkey('mapDeleteSelected', 'mapDeleteSelected', 'map', ['map'], 'delete'),

  // 计算器
  defineHotkey('calculatorCalculate', 'calculatorCalculate', 'calculator', ['calculator'], `${modifierKey}+enter`),
  defineHotkey('calculatorCopyResult', 'calculatorCopyResult', 'calculator', ['calculator'], `${modifierKey}+c`),
  defineHotkey('calculatorReset', 'calculatorReset', 'calculator', ['calculator'], 'r'),

  // 走私犯报告
  defineHotkey('smugglersSubmit', 'submitReport', 'smugglers', ['smugglers'], `${modifierKey}+enter`),
  defineHotkey('smugglersCancelEdit', 'cancelEdit', 'smugglers', ['smugglers'], 'escape'),

  // 组队
  defineHotkey('teamupRefresh', 'refreshList', 'teamup', ['teamup'], 'r'),
  defineHotkey('teamupPublish', 'teamupPublish', 'teamup', ['teamup'], `${modifierKey}+enter`),

  // 账户设置
  defineHotkey('accountSave', 'accountSave', 'account', ['account'], `${modifierKey}+s`),
  defineHotkey('accountCancel', 'cancelEdit', 'account', ['account'], 'escape'),
  defineHotkey('accountRegenRecovery', 'accountRegenRecovery', 'account', ['account'], `${altKey}+r`),

  // 统计页
  defineHotkey('statsRange7', 'statsRange7', 'statistics', ['statistics'], '1'),
  defineHotkey('statsRange30', 'statsRange30', 'statistics', ['statistics'], '2'),
  defineHotkey('statsRange90', 'statsRange90', 'statistics', ['statistics'], '3'),
  defineHotkey('statsRefresh', 'refreshList', 'statistics', ['statistics'], 'r'),

  // 日历
  defineHotkey('calendarPrevMonth', 'calendarPrevMonth', 'calendar', ['calendar'], 'arrowleft'),
  defineHotkey('calendarNextMonth', 'calendarNextMonth', 'calendar', ['calendar'], 'arrowright'),
  defineHotkey('calendarToday', 'calendarToday', 'calendar', ['calendar'], 't'),
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
   * 判断两个动作的生效地点是否有交集，全局地点可与任意地点叠加
   * @param a 动作一
   * @param b 动作二
   */
  const isSameScope = (a: HotkeyItem, b: HotkeyItem): boolean => {
    if (a.locations.includes('global') || b.locations.includes('global')) return true;
    return a.locations.some(location => b.locations.includes(location));
  };

  /**
   * 查找与指定动作共用同一按键的其他动作
   * @param actionId 动作唯一标识
   */
  const getConflicts = (actionId: string): HotkeyItem[] => {
    const target = hotkeyList.value.find((item) => item.id === actionId);
    if (!target || !target.currentKey) return [];
    return hotkeyList.value.filter((item) =>
        item.id !== actionId && item.currentKey === target.currentKey && isSameScope(target, item));
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

    const conflict = hotkeyList.value.find((item) =>
        item.id !== actionId && item.currentKey === formatted && isSameScope(target, item));

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
    getConflicts,
    updateKey,
    updateMode,
    resetToDefaults,
  };
});
