/**
 * 全局快捷键自定义指令 v-hotkeys
 * 支持通过动作名动态绑定或通过按键对象静态绑定快捷键
 */
import type { Directive, DirectiveBinding } from 'vue';
import { useHotkeysStore } from '~/stores/hotkeysStore';

interface HotkeyBindingValue {
  [key: string]: (e: KeyboardEvent) => void;
}

interface HotkeyElement extends HTMLElement {
  __hotkeyHandler__?: (e: KeyboardEvent) => void;
}

import { normalizeKeyboardEvent, isEditableElement } from '@/assets/sripts/global_hotkeys';

export const vHotkeys: Directive<HotkeyElement, HotkeyBindingValue | ((e: KeyboardEvent) => void)> = {
  mounted(el: HotkeyElement, binding: DirectiveBinding) {
    if (typeof window === 'undefined') return;

    const handler = (e: KeyboardEvent) => {
      // 默认在文本输入状态下不捕获快捷键，除非使用了 .input 修饰符
      if (!binding.modifiers.input && isEditableElement(e.target)) {
        return;
      }

      const hotkeysStore = useHotkeysStore();
      const pressed = normalizeKeyboardEvent(e);

      // 情况 1：使用了指令参数指定动作名，例如 v-hotkeys:quickArchive="callback"
      if (binding.arg) {
        const boundKey = hotkeysStore.getKey(binding.arg) || binding.arg.toLowerCase();
        if (pressed === boundKey) {
          if (binding.modifiers.prevent) e.preventDefault();
          if (binding.modifiers.stop) e.stopPropagation();
          if (typeof binding.value === 'function') {
            binding.value(e);
          }
        }
        return;
      }

      // 情况 2：传入了快捷键映射字典，例如 v-hotkeys="{ s: onSave, f: onConfirm }"
      if (binding.value && typeof binding.value === 'object') {
        const mapping = binding.value as HotkeyBindingValue;
        for (const [rawKey, fn] of Object.entries(mapping)) {
          // 若 rawKey 为已注册的动作 ID 则解析其真实按键，否则直接当作键名
          const resolvedKey = hotkeysStore.getKey(rawKey) || rawKey.toLowerCase();
          if (pressed === resolvedKey && typeof fn === 'function') {
            if (binding.modifiers.prevent) e.preventDefault();
            if (binding.modifiers.stop) e.stopPropagation();
            fn(e);
            break;
          }
        }
        return;
      }

      // 情况 3：单一回调函数
      if (typeof binding.value === 'function') {
        if (binding.modifiers.prevent) e.preventDefault();
        if (binding.modifiers.stop) e.stopPropagation();
        binding.value(e);
      }
    };

    el.__hotkeyHandler__ = handler;
    window.addEventListener('keydown', handler);
  },

  unmounted(el: HotkeyElement) {
    if (typeof window === 'undefined') return;
    if (el.__hotkeyHandler__) {
      window.removeEventListener('keydown', el.__hotkeyHandler__);
      delete el.__hotkeyHandler__;
    }
  },
};

export default vHotkeys;
