<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {defineAsyncComponent, computed, onMounted, ref, watch} from "vue";
import {useI18n} from 'vue-i18n';
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";
import {getAppOrigin, getAppUrl, storage} from "@/assets/sripts";
import {DEFAULT_LANG, isSupportedLang, SUPPORTED_LANGS} from "@/config/languages";
import {useReminderStore} from "~/stores/reminderStore";
import {useAppStore} from "~/stores/appStore";
import {usePreloadStore} from "~/stores/preloadStore";
import {loadRemoteLangMessages} from "@/assets/sripts/remote_i18n";

// 纯客户端预加载遮罩（依赖 ogl 渲染），异步 + 仅客户端渲染，避免被打进 SSR/首屏核心 chunk
const GlobalPreloadOverlay = defineAsyncComponent(() => import('@/components/GlobalPreloadOverlay.vue'));
const isClient = ref(false);

const {t, locale} = useI18n();
const reminderStore = useReminderStore();
const appStore = useAppStore();
const preloadStore = usePreloadStore();

const route = useRoute();

watch(
    () => route.path,
    (newPath) => {
      if (!newPath) return;
      const seg = newPath.split('/').filter(Boolean)[0];
      if (seg && isSupportedLang(seg)) {
        if (seg !== locale.value) {
          locale.value = seg;
          if (typeof window !== 'undefined') {
            storage.local.set('lang', {value: seg});
          }
        }
      }
    },
    {immediate: true}
);

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
      {name: 'description', content: descStr},
      {name: 'keywords', content: keywordsStr},
      {property: 'og:type', content: 'website'},
      {property: 'og:url', content: canonicalUrl},
      {property: 'og:title', content: fullTitle},
      {property: 'og:description', content: descStr},
      {property: 'og:image', content: `${origin}/favicon.png`},
      {property: 'og:site_name', content: siteName},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:title', content: fullTitle},
      {name: 'twitter:description', content: descStr},
      {name: 'twitter:image', content: `${origin}/favicon.png`}
    ],
    link: [
      {rel: 'canonical', href: canonicalUrl},
      ...SUPPORTED_LANGS.map(l => ({
        rel: 'alternate',
        hreflang: l,
        href: getAppUrl(`/${l}${cleanRawPath}`)
      })),
      {rel: 'alternate', hreflang: 'x-default', href: getAppUrl(`/${DEFAULT_LANG}${cleanRawPath}`)},
    ],
    htmlAttrs: {
      lang: currentLang
    }
  }
})

useHead(head)

onMounted(async () => {
  isClient.value = true;
  preloadStore.registerTask({
    id: 'remote-i18n',
    phase: t('basic.preload.remoteI18n') || '从远程加载文本数据...',
    run: async () => {
      if (typeof window === 'undefined') return;
      await loadRemoteLangMessages(appStore.cdnLangSource, locale.value);
    }
  });

  try {
    await preloadStore.runAll();
  } catch (err) {
    console.warn('[Preload] runAll 异常（不阻塞应用）:', err);
  }

  watch(
      () => locale.value,
      async (newLang, oldLang) => {
        if (newLang === oldLang) return;
        try {
          await loadRemoteLangMessages(appStore.cdnLangSource, newLang);
        } catch (err) {
          console.warn('[remote_i18n] 语言切换加载失败:', newLang, err);
        }
      }
  );

  document.dispatchEvent(new Event('render-event'));
  reminderStore.init();
});
</script>

<template>
  <GlobalPreloadOverlay v-if="isClient" />

  <AppMessageWidget></AppMessageWidget>
  <router-view></router-view>
</template>
