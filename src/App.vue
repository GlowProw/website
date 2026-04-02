<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget.vue'
import {onMounted} from "vue";
import {useI18n} from 'vue-i18n';
import {usePwa} from '@/composables/usePwa';

const {t} = useI18n();

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
  closePwaUpdate,
} = usePwa();

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
