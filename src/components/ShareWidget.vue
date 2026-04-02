<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNoticeStore } from '~/stores/noticeStore';

const props = withDefaults(defineProps<{
  type: string;
  targetId: string;
  url?: string;
}>(), {
  url: '',
});

const { t } = useI18n();
const notice = useNoticeStore();

const getShareUrl = () => {
  return props.url || window.location.href;
};

const getIframeCode = () => {
  const baseUrl = window.location.origin;
  const widgetUrl = `${baseUrl}/widgets/${props.type}/${props.targetId}`;
  return `<iframe src="${widgetUrl}" width="100%" height="400" frameborder="0"></iframe>`;
};

const copyToClipboard = async (text: string, messageKey: string = 'codex.share.copySuccess') => {
  try {
    await navigator.clipboard.writeText(text);
    notice.success(t(messageKey));
  } catch (err) {
    console.error('Failed to copy: ', err);
    notice.error(t('basic.tips.error', { content: err }));
  }
};

const onShareMain = () => {
  copyToClipboard(getShareUrl());
};

const onCopyIframe = () => {
  copyToClipboard(getIframeCode());
};
</script>

<template>
  <v-btn-group variant="flat" border class="share-widget" density="compact">
    <v-btn @click="onShareMain" prepend-icon="mdi-share-variant">
      {{ t('codex.share.title') }}
    </v-btn>

    <v-menu location="bottom end">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-chevron-down"
          density="comfortable"
          class="px-0"
          style="min-width: 36px"
        ></v-btn>
      </template>

      <v-list density="compact">
        <v-list-item @click="onShareMain">
          <template v-slot:prepend>
            <v-icon icon="mdi-link-variant"></v-icon>
          </template>
          <v-list-item-title>{{ t('codex.share.copyLink') }}</v-list-item-title>
        </v-list-item>

        <v-list-item @click="onCopyIframe">
          <template v-slot:prepend>
            <v-icon icon="mdi-code-tags"></v-icon>
          </template>
          <v-list-item-title>{{ t('codex.share.iframe') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn-group>
</template>

<style scoped lang="less">
.share-widget {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
</style>
