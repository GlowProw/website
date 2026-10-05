<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storage} from "@/assets/sripts";
import {useRoute, useRouter} from "vue-router";
import I18nMembersWidget from "@/components/i18nMembersWidget.vue";
import languagesConfig, { DEFAULT_LANG, SUPPORTED_LANGS } from "@/config/languages";

const {t, locale} = useI18n(),
    router = useRouter(),
    route = useRoute()

// 立即初始化语言列表，避免挂载时空数组引起的组件状态重置
const languages = ref(languagesConfig.child || []);
const langLoading = ref(false);
const selectLang = ref(locale.value || DEFAULT_LANG);

// 保证与 i18n locale 保持同步更新
watch(
  () => locale.value,
  (newLocale) => {
    if (newLocale && selectLang.value !== newLocale) {
      selectLang.value = newLocale;
    }
  },
  { immediate: true }
);

/**
 * 改变语言
 */
const onChangeLang = (newVal?: string) => {
  const targetLang = newVal || selectLang.value;
  if (!targetLang) return;

  // 如果语言与当前一致，说明并非用户主动切换语言，避免重复触发路由与刷新
  if (targetLang === locale.value) {
    return;
  }

  selectLang.value = targetLang;
  storage.local.set('lang', {value: targetLang});
  locale.value = targetLang;

  // 剥离原有的语言前缀，拼接新的目标语言前缀
  const currentPath = route.path || '/';
  const langRegex = new RegExp('^/(' + SUPPORTED_LANGS.join('|') + ')');
  const cleanPath = currentPath.replace(langRegex, '') || '';
  const newPath = `/${targetLang}${cleanPath.startsWith('/') ? cleanPath : (cleanPath ? '/' + cleanPath : '')}`;

  // 清除 query 中过时的 lang 参数
  const newQuery = { ...route.query };
  delete newQuery.lang;

  // 使用 router.replace 切换至新的 /{lang}/... 路径
  router.replace({
    path: newPath,
    query: newQuery,
    hash: route.hash
  }).catch(() => {});
}

defineOptions({
  name: 'I18nWidget'
})
</script>

<template>
  <v-select :items="languages"
            :disabled="langLoading"
            item-title="label"
            item-value="value"
            prepend-icon="mdi-translate"
            hide-no-data
            hide-spin-buttons
            persistent-hint
            variant="plain"
            density="compact"
            v-model="selectLang"
            @update:model-value="onChangeLang"></v-select>

  <keep-alive>
    <I18nMembersWidget></I18nMembersWidget>
  </keep-alive>
</template>

<style scoped lang="less">

</style>
