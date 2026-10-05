<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {computed, onMounted, watch} from "vue";
import {useI18n} from 'vue-i18n';
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";
import {storage, getAppOrigin, getAppUrl} from "@/assets/sripts";
import {normalizeLang, SUPPORTED_LANGS, DEFAULT_LANG, isSupportedLang} from "@/config/languages";
import {useReminderStore} from "~/stores/reminderStore";

const {t, locale} = useI18n();
const reminderStore = useReminderStore();

const route = useRoute();

// 监听路由路径中的语言前缀
watch(
  () => route.path,
  (newPath) => {
    if (!newPath) return;
    const seg = newPath.split('/').filter(Boolean)[0];
    if (seg && isSupportedLang(seg)) {
      if (seg !== locale.value) {
        locale.value = seg;
        if (typeof window !== 'undefined') {
          storage.local.set('lang', { value: seg });
        }
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

  const currentPath = route.path || '/';
  const langRegex = new RegExp('^/(' + SUPPORTED_LANGS.join('|') + ')');
  const rawPath = currentPath.replace(langRegex, '') || '/';
  const cleanRawPath = rawPath === '/' ? '' : rawPath;
  const currentLang = isSupportedLang(locale.value) ? locale.value : DEFAULT_LANG;
  const canonicalUrl = getAppUrl(`/${currentLang}${cleanRawPath}`);

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
      ...SUPPORTED_LANGS.map(l => ({
        rel: 'alternate',
        hreflang: l,
        href: getAppUrl(`/${l}${cleanRawPath}`)
      })),
      { rel: 'alternate', hreflang: 'x-default', href: getAppUrl(`/${DEFAULT_LANG}${cleanRawPath}`) },
    ],
    htmlAttrs: {
      lang: currentLang
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
