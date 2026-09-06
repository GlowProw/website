<script lang="ts">
export default { name: 'I18nWidget' }
</script>

<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storage} from "@/assets/sripts";
import {useRoute, useRouter} from "vue-router";
import I18nMembersWidget from "@/components/i18nMembersWidget.vue";
import languagesConfig from "@/config/languages";

const {t, locale} = useI18n(),
    router = useRouter(),
    route = useRoute()

// 立即初始化语言列表，避免挂载时空数组引起的组件状态重置
const languages = ref(languagesConfig.child || []);
const langLoading = ref(false);
const selectLang = ref(locale.value || 'zh-CN');

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

  // 使用 router.replace 避免产生无用历史栈，且使用 path 保持路径稳定
  router.replace({
    path: route.path,
    query: {...route.query, 'lang': targetLang}
  }).catch(() => {});
}
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
