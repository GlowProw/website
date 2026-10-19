<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch} from "vue";
import {useI18n} from 'vue-i18n';
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";
import {getAppOrigin, getAppUrl, storage} from "@/assets/sripts";
import {DEFAULT_LANG, isSupportedLang, setCurrentLang, SUPPORTED_LANGS} from "@/config/languages";
import {useReminderStore} from "~/stores/reminderStore";
import {useMessagesUnreadStore} from "~/stores/messagesUnreadStore";
import {useAppStore} from "~/stores/appStore";
import {usePreloadStore} from "~/stores/preloadStore";
import {useAuthStore} from "~/stores/userAccountStore";
import {loadRemoteLangMessages} from "@/assets/sripts/remote_i18n";
import {setupGlobalHotkeys} from "@/assets/sripts/global_hotkeys";

const GlobalPreloadOverlay = defineAsyncComponent(() => import('@/components/GlobalPreloadOverlay.vue'));
const isClient = ref(false);

const {t, locale} = useI18n();
const reminderStore = useReminderStore();
const messagesUnreadStore = useMessagesUnreadStore();
const appStore = useAppStore();
const preloadStore = usePreloadStore();
const authStore = useAuthStore();

const route = useRoute();

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
      {property: 'og:image', content: `${origin}/favicon.svg`},
      {property: 'og:site_name', content: siteName},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:title', content: fullTitle},
      {name: 'twitter:description', content: descStr},
      {name: 'twitter:image', content: `${origin}/favicon.svg`}
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

// 全局快捷键注销回调
let cleanupHotkeys: (() => void) | null = null;

useHead(head)

watch(
    () => route.path,
    (newPath) => {
      if (!newPath) return;
      const seg = newPath.split('/').filter(Boolean)[0];
      if (seg && isSupportedLang(seg)) {
        // 同步给模块级单例（appFuns/appApps 等）用于拼接 /:lang 链接
        setCurrentLang(seg);
        if (seg !== locale.value) {
          locale.value = seg;
          if (typeof window !== 'undefined') {
            storage.local.set('lang', {value: seg});
          }
        }
      } else {
        setCurrentLang(locale.value);
      }
    },
    {immediate: true}
);

onMounted(async () => {
  isClient.value = true;
  cleanupHotkeys = setupGlobalHotkeys();
  document.addEventListener('visibilitychange', handleVisibilityChange);
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

  // 赞助者与特权身份全局禁用广告与追踪代码
  watch(
    () => authStore.user,
    (user) => {
      if (typeof window === 'undefined') return;
      const all = [...(user?.role || []), ...((user?.privilege || []) as string[])];
      const isDonor = all.some(r =>
        ['contributor', 'contributor1', 'contributor2', 'contributor3', 'contributor4', 'contributor5', 'root', 'admin', 'super', 'dev'].includes(r)
      );
      if (isDonor) {
        (window as any)['ga-disable-G-M7GHT4Z92C'] = true;
      }
    },
    { immediate: true }
  );
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (cleanupHotkeys) {
    cleanupHotkeys();
    cleanupHotkeys = null;
  }
});

/**
 * 页面被切到后台时暂停活动提醒计时与未读私信轮询，回到前台立即恢复并拉一次未读
 */
const handleVisibilityChange = () => {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    reminderStore.pauseWorker();
    messagesUnreadStore.stop();
  } else {
    if (reminderStore.isReminderRoute()) {
      reminderStore.resumeWorker();
    }
    messagesUnreadStore.start();
  }
};
</script>

<template>
  <GlobalPreloadOverlay v-if="isClient"/>

  <AppMessageWidget></AppMessageWidget>
  <router-view></router-view>
</template>
