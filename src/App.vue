<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {onMounted} from "vue";
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useAppStore } from '~/stores/appStore';
import { useI18n } from 'vue-i18n';

const appStore = useAppStore();
const { t } = useI18n();

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    appStore.isPwa = true;
  },
})

// Sync PWA state to store
appStore.pwaNeedRefresh = needRefresh.value
appStore.updateServiceWorker = updateServiceWorker

// Watch for changes in needRefresh
import { watch } from 'vue'
watch(needRefresh, (value) => {
    appStore.pwaNeedRefresh = value
})

onMounted(() => {
  document.dispatchEvent(new Event('render-event'));

  // Capture PWA install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    appStore.pwaInstallPrompt = e;
  });
});

const closePwaUpdate = () => {
    offlineReady.value = false;
    needRefresh.value = false;
}
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
