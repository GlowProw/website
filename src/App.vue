<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {computed, onMounted} from "vue";
import {useI18n} from 'vue-i18n';
import {use_pwa} from '@/assets/sripts/use_pwa';
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";

const {t} = useI18n();

const {
      offlineReady,
      needRefresh,
      updateServiceWorker,
      closePwaUpdate,
    } = use_pwa(),
    route = useRoute();

// 全局响应式 Meta 信息配置
const head = computed(() => {
  const
      titleStr = route.meta.title ? t(route.meta.title as string) : t('name'),
      descStr = t('apps.meta.description'),
      siteName = t('name');

  return {
    title: titleStr,
    titleTemplate: `%s | ${siteName}`,
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
      { name: 'twitter:image', content: `${window.location.origin}/favicon.png` }
    ]
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

  <v-snackbar
      v-model="offlineReady"
      :timeout="3000"
      color="#000"
      location="bottom right">
    {{ t('pwa.offlineReady') }}
    <template v-slot:actions>
      <v-btn variant="text" @click="closePwaUpdate">{{ t('basic.button.cancel') }}</v-btn>
    </template>
  </v-snackbar>

  <v-snackbar
      v-model="needRefresh"
      :timeout="-1"
      color="info"
      location="bottom right"
      vertical
  >
    <div class="text-subtitle-1 pb-2">{{ t('pwa.newContentAvailable') }}</div>
    <p>{{ t('pwa.refreshToUpdate') }}</p>

    <template v-slot:actions>
      <v-btn variant="text" @click="updateServiceWorker()">{{ t('basic.button.refresh') }}</v-btn>
      <v-btn variant="text" @click="closePwaUpdate">{{ t('basic.button.close') }}</v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
</style>
