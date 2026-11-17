<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';
import { useNoticeStore } from '~/stores/noticeStore';
import { parseExternalTargetUrl } from '@/assets/sripts/external_link_interceptor';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notice = useNoticeStore();

// 解析查询参数中的外部跳转目标网址（兼容 target 与 url 两个常用传参）
const rawTarget = computed(() => {
  const queryParam = route.query.target ?? route.query.url;
  if (Array.isArray(queryParam)) {
    return queryParam[0] || '';
  }
  return typeof queryParam === 'string' ? queryParam : '';
});

// 解析并校验目标 URL 的合法性与域名信息
const targetInfo = computed(() => parseExternalTargetUrl(rawTarget.value));

// 复制链接状态反馈
const isCopying = ref(false);

useHead({
  title: computed(() => `${t('linkRedirect.title')} | ${t('name')}`),
});

/**
 * 复制目标链接到剪贴板
 */
const onCopyTargetUrl = async (): Promise<void> => {
  if (!targetInfo.value.isValid || !targetInfo.value.url) return;
  try {
    isCopying.value = true;
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(targetInfo.value.url);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = targetInfo.value.url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    notice.success(t('linkRedirect.copySuccess') || '链接已复制到剪贴板');
  } catch {
    notice.error(t('linkRedirect.copyFailed') || '复制失败，请手动长按复制');
  } finally {
    setTimeout(() => {
      isCopying.value = false;
    }, 1500);
  }
};

/**
 * 返回上一页或回退至首页
 */
const onGoBack = (): void => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};
</script>

<template>
  <v-container class="py-12 d-flex justify-center align-center min-h-container">
    <v-card border elevation="4" rounded="lg" max-width="660" width="100%" class="pa-6 pa-sm-8 bg-surface">
      <div class="text-center mb-6">
        <v-avatar color="amber-lighten-4" size="80" class="mb-4">
          <v-icon icon="mdi-shield-alert-outline" color="amber-darken-3" size="44"/>
        </v-avatar>
        <div class="mb-2">
          <v-chip color="amber" variant="tonal" size="small" class="font-weight-bold">
            {{ t('linkRedirect.badge') }}
          </v-chip>
        </div>
        <h1 class="text-h5 font-weight-bold mb-2">
          {{ t('linkRedirect.title') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('linkRedirect.subtitle') }}
        </p>
      </div>

      <v-card variant="tonal" color="surface-variant" class="pa-4 mb-5 border rounded-lg">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2 text-caption font-weight-bold text-medium-emphasis">
            <v-icon icon="mdi-web" size="16"/>
            <span>{{ t('linkRedirect.targetUrl') }}</span>
          </div>
          <v-chip v-if="targetInfo.hostname" size="x-small" color="primary" variant="outlined" class="font-monospace">
            {{ targetInfo.hostname }}
          </v-chip>
        </div>

        <div v-if="targetInfo.isValid" class="d-flex align-center ga-2 bg-black pa-3 rounded border">
          <div class="text-body-2 font-monospace text-truncate flex-grow-1 select-all opacity-90" :title="targetInfo.url">
            {{ targetInfo.url }}
          </div>
          <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="small"
              color="amber"
              :title="t('linkRedirect.copyUrl')"
              @click="onCopyTargetUrl"/>
        </div>

        <div v-else class="text-body-2 text-error pa-2 rounded d-flex align-center ga-2">
          <v-icon icon="mdi-alert-circle-outline" size="18"/>
          <span>{{ t('linkRedirect.invalidUrl') }}</span>
        </div>
      </v-card>

      <v-alert type="warning" variant="tonal" border="start" density="comfortable" class="mb-6 text-caption text-sm-body-2">
        <div class="font-weight-bold mb-1 d-flex align-center ga-1">
          <v-icon icon="mdi-alert-octagon-outline" size="16"/>
          <span>{{ t('linkRedirect.warningTitle') }}</span>
        </div>
        <div class="opacity-90 line-height-relaxed">
          {{ t('linkRedirect.disclaimer') }}
        </div>
      </v-alert>

      <v-row dense class="ga-3 flex-column-reverse flex-sm-row">
        <v-col cols="12" sm="5">
          <v-btn block size="large" variant="tonal" prepend-icon="mdi-arrow-left" @click="onGoBack">
            {{ t('linkRedirect.return') }}
          </v-btn>
        </v-col>
        <v-col cols="12" sm="7" v-if="targetInfo.isValid">
          <v-btn
              block
              size="large"
              color="amber"
              variant="elevated"
              append-icon="mdi-open-in-new"
              :href="targetInfo.url"
              target="_blank"
              rel="noopener noreferrer"
              data-external-link-allowed="true">
            {{ t('linkRedirect.proceed') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>
.min-h-container {
  min-height: calc(100vh - 180px);
}

.line-height-relaxed {
  line-height: 1.65;
}

.select-all {
  user-select: all;
}
</style>
