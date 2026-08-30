<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {computed, onMounted, watch} from "vue";
import {useI18n} from 'vue-i18n';
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";
import {storage} from "@/assets/sripts";
import {normalizeLang} from "@/config/languages";

const {t, locale} = useI18n();

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
  const
      titleStr = route.meta.title ? t(route.meta.title as string) : t('name'),
      descStr = t('apps.meta.description'),
      siteName = t('name');

  return {
    title: `${titleStr} | ${siteName}`,
    meta: [
      { name: 'description', content: descStr },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: window.location.origin + route.fullPath },
      { property: 'og:title', content: `${titleStr} | ${siteName}` },
      { property: 'og:description', content: descStr },
      { property: 'og:image', content: `${window.location.origin}/favicon.png` },
      { property: 'og:site_name', content: siteName },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: `${titleStr} | ${siteName}` },
      { name: 'twitter:description', content: descStr },
      { property: 'og:image', content: `${window.location.origin}/favicon.png` }
    ],
    htmlAttrs: {
      lang: locale.value
    }
  }
})

useHead(head)

onMounted(() => {
  document.dispatchEvent(new Event('render-event'));
});
</script>

<template>
  <AppMessageWidget></AppMessageWidget>
  <router-view></router-view>
</template>

<style scoped>
</style>
