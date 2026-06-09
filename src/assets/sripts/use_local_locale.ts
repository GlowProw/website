import { inject, computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * 获取当前上下文的语言设置
 * 优先使用 manualLocale (手动传入，用于 Provider 自身实现同步显示)
 * 其次使用 provide/inject 分发的 locale (如海报区域)
 * 否则回退到全局应用语言
 */
export function use_local_locale(manualLocale?: ComputedRef<string | undefined>) {
  const { locale: globalLocale } = useI18n();
  const contextLocale = inject<ComputedRef<string> | string | undefined>('context-locale', undefined);

  const localLocale = computed(() => {
    let result = globalLocale.value;
    
    // 1. 优先使用手动传入的语言 (Provider 层)
    if (manualLocale && manualLocale.value) {
      result = manualLocale.value;
    }
    // 2. 其次使用注入的语言上下文 (Consumer 层)
    else if (contextLocale) {
      const val = typeof contextLocale === 'string' ? contextLocale : contextLocale.value;
      if (val) {
        result = val;
      }
    }
    
    // console.log('[use_local_locale] Computed Locale:', result);
    return result;
  });

  return {
    localLocale
  };
}
