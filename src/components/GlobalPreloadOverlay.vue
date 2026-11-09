<script setup lang="ts">
import {onMounted} from "vue";
import {usePreloadStore} from "~/stores/preloadStore";
import {useI18n} from "vue-i18n";
import Logo from "@/components/Logo.vue";
import BannerRightSeasonInfo from "@/components/BannerRightSeasonInfo.vue";
import {checkVersion} from "@/assets/sripts/version_updater";

const preloadStore = usePreloadStore();
const {t} = useI18n();

preloadStore.registerTask({
  id: 'version-check',
  phase: t('basic.preload.versionCheck') || '检查网站版本更新...',
  run: async () => {
    if (typeof window === 'undefined') return;
    await checkVersion();
  }
});

onMounted(() => {
  // 确保在独立渲染或未经过预加载队列时也能执行一次版本检测
  if (!preloadStore.tasks.some(t => t.id === 'version-check' && (t.status === 'running' || t.status === 'done'))) {
    checkVersion().catch(() => {});
  }
});
</script>

<template>
  <div v-if="preloadStore.appLoading || !preloadStore.pageReady" class="global-preload-mask pa-6 bg-black">
    <v-row no-gutters>
      <v-col cols="auto" class="d-flex align-center">
        <Logo size="25"></Logo>
        <span>{{ t('name') }}</span>
      </v-col>
      <v-spacer></v-spacer>
    </v-row>

    <BannerRightSeasonInfo :top="10"></BannerRightSeasonInfo>

    <div class="d-flex justify-center align-center h-100 w-100">
      <div class="mt-n16">
        <div class="d-flex flex-column justify-center align-center">
          <img src="/logo-format.gif" class="mx-auto"/>

          <div class="mt-n15 text-center">
            <div class="text-body-2 opacity-80 mb-2">
              {{ preloadStore.currentPhase || t('basic.preload.default') }}
            </div>

            <v-progress-linear
                v-if="preloadStore.tasks.length > 0"
                :model-value="(preloadStore.tasks.filter(t => t.status === 'done').length / preloadStore.tasks.length) * 100"
                color="amber"
                rounded
                height="4"
                class="mx-auto mt-2"
                style="max-width: 200px"></v-progress-linear>

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
.global-preload-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background-color: #000;

  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  }
}
</style>
