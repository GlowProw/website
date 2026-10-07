<script setup lang="ts">
import Logo from "./Logo.vue";
import Silk from "./Silk.vue";
import {usePreloadStore} from "~/stores/preloadStore";
import {useI18n} from "vue-i18n";

const preloadStore = usePreloadStore();
const {t} = useI18n();
</script>

<template>
  <div
      v-if="preloadStore.appLoading"
      class="global-preload-mask bg-shades-black">
    <Silk
        :speed="5"
        :scale="1.2"
        :color="'#1c1c1c'"
        :noise-intensity="1"
        :rotation="-10"
        class="portal-banner-backMark w-100 h-100"/>

    <div class="portal-up-window h-screen">
      <div class="global-preload-inner">
        <v-progress-circular
            indeterminate
            size="120"
            width="4"
            color="amber">
          <Logo size="50" class=""></Logo>
        </v-progress-circular>

        <div class="mt-4 text-grey">
          {{ preloadStore.currentPhase || t('basic.preload.default') || '加载中...' }}
        </div>

        <template v-if="preloadStore.failedCount() > 0">
          <div class="mt-6 text-center">
            <div class="text-caption text-red-darken-2 mb-2">
              {{ preloadStore.failedCount() }} 个任务失败
            </div>
            <v-btn
                size="small"
                variant="tonal"
                color="amber"
                @click="preloadStore.retry()">
              {{ t('basic.button.retry') || '重试' }}
            </v-btn>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-banner-backMark {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.portal-up-window {
  position: relative;
  z-index: 2;
}

.global-preload-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);

  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  }
}

.global-preload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
