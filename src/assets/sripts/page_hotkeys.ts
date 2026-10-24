/**
 * 页面级快捷键组合式函数
 * 将当前页面注册的动作 ID 与其真实按键比对，仅在该页面挂载期间响应
 */
import { onBeforeUnmount, onMounted } from 'vue';
import { useHotkeysStore } from '~/stores/hotkeysStore';
import { isEditableElement, normalizeKeyboardEvent } from '@/assets/sripts/global_hotkeys';

/**
 * 页面快捷键配置
 */
export interface PageHotkeysOptions {
  /**
   * 允许在输入控件中触发的动作，例如 Esc 取消编辑
   */
  allowInEditable?: string[];
  /**
   * 是否响应快捷键，抽屉类组件可传入开合状态
   */
  active?: () => boolean;
}

/**
 * 把键盘事件规范化为可与绑定值比对的字符串
 * 加号在多数键盘上需要配合 Shift 才能输入，这里统一映射为 `+`
 * @param e 原始键盘事件
 */
function normalizePressedKey(e: KeyboardEvent): string {
  const pressed = normalizeKeyboardEvent(e);
  if (pressed === '=' || pressed === 'shift+=') return '+';
  return pressed;
}

/**
 * 绑定当前页面的快捷键动作
 * @param mapping 动作 ID 与触发回调的映射
 * @param options 输入控件与启用状态配置
 */
export function usePageHotkeys(
    mapping: Record<string, (e: KeyboardEvent) => void>,
    options: PageHotkeysOptions = {},
) {
  const hotkeysStore = useHotkeysStore();
  const allowInEditable = options.allowInEditable || [];

  const handler = (e: KeyboardEvent) => {
    if (options.active && !options.active()) return;

    const pressed = normalizePressedKey(e);
    if (!pressed) return;

    for (const [actionId, callback] of Object.entries(mapping)) {
      if (isEditableElement(e.target) && !allowInEditable.includes(actionId)) continue;

      const boundKey = hotkeysStore.getKey(actionId);
      if (boundKey && pressed === boundKey) {
        e.preventDefault();
        callback(e);
        return;
      }
    }
  };

  onMounted(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', handler);
  });

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', handler);
  });
}

export default usePageHotkeys;
