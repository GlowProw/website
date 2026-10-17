<script setup lang="ts">
import {usePreloadStore} from "~/stores/preloadStore";
import {useI18n} from "vue-i18n";

const preloadStore = usePreloadStore();
const {t} = useI18n();
</script>

<template>
  <div v-if="preloadStore.appLoading" class="global-preload-mask bg-black">
    <div class="portal-up-window h-screen">
      <div class="global-preload-inner mt-n16">
        <div class="d-flex flex-column justify-center align-center">
          <v-img src="/public/logo-format.gif" class="mx-auto"/>

          <div class="mt-n15">
            {{ preloadStore.currentPhase || t('basic.preload.default') }}

            <template v-if="preloadStore.failedCount() > 0">
              <div class="mt-6 text-center">
                <div class="text-red-darken-2 mb-2">
                  {{ preloadStore.failedCount() }}
                </div>
                <v-btn
                    variant="tonal"
                    color="amber"
                    @click="preloadStore.retry()">
                  {{ t('basic.button.retry') }}
                </v-btn>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
