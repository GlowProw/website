import { inject, computed, type ComputedRef, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAppI18n } from '@/i18n';
import { DEFAULT_LANG } from '@/config/languages';

/**
 * 获取当前上下文的语言设置
 * 优先使用 manualLocale (手动传入，用于 Provider 自身实现同步显示)
 * 其次使用 provide/inject 分发的 locale (如海报区域)
 * 否则回退到全局应用语言
 */
export function use_local_locale(manualLocale?: ComputedRef<string | undefined>) {
  let globalLocaleRef: any;
  try {
    const composer = useI18n();
    globalLocaleRef = composer.locale;
  } catch {
    try {
      globalLocaleRef = getAppI18n()?.global?.locale;
    } catch {}
  }

  let contextLocale: ComputedRef<string> | string | undefined;
  try {
    contextLocale = inject<ComputedRef<string> | string | undefined>('context-locale', undefined);
  } catch {}

  const localLocale = computed(() => {
    let result = (globalLocaleRef && (globalLocaleRef.value || globalLocaleRef)) || DEFAULT_LANG;

    // 优先使用手动传入的语言 (Provider 层)
    if (manualLocale && manualLocale.value) {
      result = manualLocale.value;
    }
    // 其次使用注入的语言上下文 (Consumer 层)
    else if (contextLocale) {
      const val = typeof contextLocale === 'string' ? contextLocale : contextLocale.value;
      if (val) {
        result = val;
      }
    }

    return result;
  });

  return {
    localLocale
  };
}

