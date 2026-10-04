<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {computed, onMounted, watch} from "vue";
import {useI18n} from 'vue-i18n';
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";
import {storage, getAppOrigin, getAppUrl} from "@/assets/sripts";
import {normalizeLang} from "@/config/languages";
import {useReminderStore} from "~/stores/reminderStore";

const {t, locale} = useI18n();
const reminderStore = useReminderStore();

const route = useRoute();

// 监听 URL 中 ?lang= 改变
watch(
  () => route.query.lang,
  (newLang) => {
    if (typeof newLang === 'string' && newLang) {
      const normalized = normalizeLang(newLang);
      if (normalized && normalized !== locale.value) {
        storage.local.set('lang', { value: normalized });
        locale.value = normalized;
      }
    }
  },
  { immediate: true }
);

// 全局响应式 Meta 信息配置
const head = computed(() => {
  const siteName = t('name');
  const titleStr = route.meta.title ? t(route.meta.title as string) : '';
  const fullTitle = titleStr && titleStr !== siteName ? `${titleStr} | ${siteName}` : siteName;
  const descStr = t('apps.meta.description') || '《碧海黑帆 (Skull and Bones)》全能游戏助手与全收集交互地图。';
  const keywordsStr = route.meta.keywords ? t(route.meta.keywords as string) : t('home.meta.keywords');
  const origin = getAppOrigin();
  const canonicalUrl = getAppUrl(route.path);

  return {
    title: fullTitle,
    meta: [
      { name: 'description', content: descStr },
      { name: 'keywords', content: keywordsStr },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: descStr },
      { property: 'og:image', content: `${origin}/favicon.png` },
      { property: 'og:site_name', content: siteName },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: descStr },
      { name: 'twitter:image', content: `${origin}/favicon.png` }
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', hreflang: 'zh-CN', href: getAppUrl(`${route.path}?lang=zh_CN`) },
      { rel: 'alternate', hreflang: 'zh-TW', href: getAppUrl(`${route.path}?lang=zh_TW`) },
      { rel: 'alternate', hreflang: 'en-US', href: getAppUrl(`${route.path}?lang=en_US`) },
      { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl },
    ],
    htmlAttrs: {
      lang: locale.value === 'zh_CN' ? 'zh-CN' : (locale.value === 'zh_TW' ? 'zh-TW' : 'en-US')
    }
  }
})

useHead(head)

onMounted(() => {
  document.dispatchEvent(new Event('render-event'));
  reminderStore.init();
});
</script>

<template>
  <AppMessageWidget></AppMessageWidget>
  <router-view></router-view>
</template>

<style scoped>
</style>
