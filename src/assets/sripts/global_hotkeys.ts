import { useHotkeysStore } from '~/stores/hotkeysStore';
import { useAppStore } from '~/stores/appStore';
import { useMessagesDrawerStore } from '~/stores/messagesDrawerStore';
import { useCodexHistoryDrawerStore } from '~/stores/codexHistoryDrawerStore';
import router from '~/router';

// 检测是否为苹果系统设备
export const isMacDevice = typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');

/**
 * 将键盘事件统一规范化为易比对的按键格式串
 * @param e 原始键盘事件
 */
export function normalizeKeyboardEvent(e: KeyboardEvent): string {
  const parts: string[] = [];

  if (e.metaKey) {
    parts.push(isMacDevice ? 'cmd' : 'win');
  }
  if (e.ctrlKey) {
    parts.push('ctrl');
  }
  if (e.altKey) {
    parts.push(isMacDevice ? 'option' : 'alt');
  }
  if (e.shiftKey) {
    parts.push('shift');
  }

  const keyLower = e.key?.toLowerCase();
  if (!['control', 'meta', 'alt', 'shift'].includes(keyLower)) {
    let mainKey = keyLower;
    if (mainKey === ' ') mainKey = 'space';
    parts.push(mainKey);
  }

  return parts.join('+');
}

/**
 * 校验目标元素是否处于正在编辑输入的控件中
 * @param target 事件源元素
 */
export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

// 缓存全局快捷键监听器引用
let globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

/**
 * 注册全站全局快捷键监听调度器
 */
export function setupGlobalHotkeys(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (globalKeydownHandler) {
    window.removeEventListener('keydown', globalKeydownHandler);
  }

  globalKeydownHandler = (e: KeyboardEvent) => {
    const hotkeysStore = useHotkeysStore();
    const appStore = useAppStore();
    const messagesDrawerStore = useMessagesDrawerStore();
    const codexHistoryDrawerStore = useCodexHistoryDrawerStore();

    const pressedKey = normalizeKeyboardEvent(e);
    const inEditable = isEditableElement(e.target);

    // ESC 关闭任意打开的浮层抽屉
    const escapeKey = hotkeysStore.getKey('closeModal') || 'escape';
    if (pressedKey === escapeKey) {
      if (appStore.globalSearchDrawer) {
        e.preventDefault();
        appStore.globalSearchDrawer = false;
        return;
      }
      if (codexHistoryDrawerStore.open) {
        e.preventDefault();
        codexHistoryDrawerStore.setOpen(false);
        return;
      }
      if (messagesDrawerStore.open) {
        e.preventDefault();
        messagesDrawerStore.setOpen(false);
        return;
      }
      if (appStore.headerDrawer) {
        e.preventDefault();
        appStore.headerDrawer = false;
        return;
      }
    }

    // 表单输入状态下避免截获字母与符号按键
    if (inEditable) {
      return;
    }

    // 全局搜索抽屉呼出与收起
    const searchKey = hotkeysStore.getKey('quickSearch');
    if (searchKey && (pressedKey === searchKey || (isMacDevice && pressedKey === 'cmd+k') || (!isMacDevice && pressedKey === 'ctrl+k'))) {
      e.preventDefault();
      const nextState = !appStore.globalSearchDrawer;
      appStore.globalSearchDrawer = nextState;
      if (nextState) {
        appStore.headerDrawer = false;
        messagesDrawerStore.setOpen(false);
      }
      return;
    }

    // 游览历史抽屉呼出与收起
    const codexHistoryKey = hotkeysStore.getKey('toggleCodexHistory');
    if (codexHistoryKey && pressedKey === codexHistoryKey) {
      e.preventDefault();
      const nextState = !codexHistoryDrawerStore.open;
      codexHistoryDrawerStore.setOpen(nextState);
      if (nextState) {
        appStore.globalSearchDrawer = false;
        messagesDrawerStore.setOpen(false);
        appStore.headerDrawer = false;
      }
      return;
    }

    // 消息私信抽屉呼出与收起
    const messagesKey = hotkeysStore.getKey('toggleMessages');
    if (messagesKey && pressedKey === messagesKey) {
      e.preventDefault();
      const nextState = !messagesDrawerStore.open;
      messagesDrawerStore.setOpen(nextState);
      if (nextState) {
        appStore.headerDrawer = false;
        appStore.globalSearchDrawer = false;
      }
      return;
    }

    // 顶部导航抽屉菜单展开与收起
    const headerMenuKey = hotkeysStore.getKey('toggleHeaderMenu');
    if (headerMenuKey && pressedKey === headerMenuKey) {
      e.preventDefault();
      const nextState = !appStore.headerDrawer;
      appStore.headerDrawer = nextState;
      if (nextState) {
        appStore.globalSearchDrawer = false;
        messagesDrawerStore.setOpen(false);
      }
      return;
    }

    // 顶栏按钮组：依次打开搜索、游览历史、消息中心与账号设置
    const headerActions: { id: string; run: () => void }[] = [
      {
        id: 'headerSearch',
        run: () => {
          appStore.headerDrawer = false;
          messagesDrawerStore.setOpen(false);
          appStore.globalSearchDrawer = true;
        },
      },
      {
        id: 'headerHistory',
        run: () => {
          appStore.headerDrawer = false;
          appStore.globalSearchDrawer = false;
          messagesDrawerStore.setOpen(false);
          codexHistoryDrawerStore.setOpen(true);
        },
      },
      {
        id: 'headerMessages',
        run: () => {
          appStore.headerDrawer = false;
          appStore.globalSearchDrawer = false;
          codexHistoryDrawerStore.setOpen(false);
          messagesDrawerStore.setOpen(true);
        },
      },
      {
        id: 'headerSettings',
        run: () => {
          const lang = router.currentRoute.value.params.lang;
          router.push({
            name: 'PortalSettingRoutine',
            params: lang ? { lang } : {},
          }).catch(() => {});
        },
      },
    ];

    for (const action of headerActions) {
      const actionKey = hotkeysStore.getKey(action.id);
      if (actionKey && pressedKey === actionKey) {
        e.preventDefault();
        action.run();
        return;
      }
    }
  };

  window.addEventListener('keydown', globalKeydownHandler);

  return () => {
    if (globalKeydownHandler) {
      window.removeEventListener('keydown', globalKeydownHandler);
      globalKeydownHandler = null;
    }
  };
}
