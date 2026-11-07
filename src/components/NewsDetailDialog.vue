<script setup lang="ts">
/**
 * 新闻资讯详情弹窗组件
 * 与全站风格保持一致，采用暗色卡片、主题边框与精细字体渲染
 * 支持图文混排正文、媒体多图画廊预览、一键复制正文与分享链接
 */
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useDisplay} from 'vuetify';
import {apis} from '@/assets/sripts';
import type {NewsItem} from '@/assets/sripts/api/news_service';
import {useNoticeStore} from '~/stores/noticeStore';
import TimeView from '@/components/TimeView.vue';
import Loading from '@/components/Loading.vue';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  newsItem?: NewsItem | null;
  newsId?: string | null;
}>(), {
  modelValue: false,
  newsItem: null,
  newsId: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'close'): void;
}>();

const {t} = useI18n();
const {mobile} = useDisplay();
const notice = useNoticeStore();
const newsApi = apis.newsApi();

// 内部加载状态与条目数据
const internalLoading = ref(false);
const activeNews = ref<NewsItem | null>(null);

// 大图预览弹窗状态
const previewImageDialog = ref(false);
const previewImageUrl = ref('');

/**
 * 平台配置映射
 */
const platformConfig = computed(() => {
  const plat = activeNews.value?.platform || '';
  switch (plat) {
    case 'x':
      return {label: 'X (Twitter)', icon: 'mdi-twitter', color: '#1DA1F2'};
    case 'xiaoheihe':
      return {label: t('news.xiaoheihe'), icon: 'mdi-cube-outline', color: '#F59E0B'};
    default:
      return {label: plat ? plat.toUpperCase() : 'NEWS', icon: 'mdi-newspaper-variant-outline', color: 'primary'};
  }
});

/**
 * 解析媒体图片列表
 */
const mediaUrls = computed((): string[] => {
  const raw = activeNews.value?.mediaUrl || (activeNews.value as any)?.media_url;
  if (!raw) return [];
  return String(raw).split(',').map(u => u.trim()).filter(Boolean);
});

/**
 * 根据 ID 远端拉取单条新闻
 * @param id 新闻 ID
 */
const loadNewsById = async (id: string) => {
  internalLoading.value = true;
  try {
    const res: any = await newsApi.getNewsItem(id);
    const item = res?.data?.data || res?.data || res;
    if (item && item.id) {
      activeNews.value = item;
    }
  } catch (err: any) {
    notice.error(err?.message || '获取新闻详情失败');
  } finally {
    internalLoading.value = false;
  }
};

/**
 * 打开全尺寸大图预览
 * @param url 图片地址
 */
const onPreviewImage = (url: string) => {
  previewImageUrl.value = url;
  previewImageDialog.value = true;
};

/**
 * 一键复制新闻纯文本内容
 */
const onCopyContent = async () => {
  if (!activeNews.value?.content) return;
  try {
    const plainText = activeNews.value.content.replace(/<[^>]+>/g, '').trim();
    await navigator.clipboard.writeText(plainText);
    notice.success(t('news.copySuccess') || '正文内容已复制到剪贴板', {mode: 'minimal'});
  } catch {
    notice.error(t('basic.tips.copyFailed') || '复制失败');
  }
};

/**
 * 一键复制分享链接
 */
const onCopyShareLink = async () => {
  if (!activeNews.value?.id) return;
  try {
    const shareUrl = `${window.location.origin}/news?id=${activeNews.value.id}`;
    await navigator.clipboard.writeText(shareUrl);
    notice.success(t('news.copyLinkSuccess') || '新闻分享链接已复制到剪贴板', {mode: 'minimal'});
  } catch {
    notice.error(t('basic.tips.copyFailed') || '复制失败');
  }
};

/**
 * 关闭弹窗处理
 */
const onClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

/**
 * 监听外部传入的条目或 ID 变动
 */
watch(() => [props.modelValue, props.newsItem, props.newsId], ([visible, item, id]) => {
  if (visible) {
    if (item) {
      activeNews.value = item as NewsItem;
    } else if (id && typeof id === 'string') {
      loadNewsById(id);
    }
  }
}, {immediate: true});
</script>

<template>
  <v-dialog
      :model-value="modelValue"
      :max-width="mobile ? '95%' : 780"
      scrollable
      @update:model-value="emit('update:modelValue', $event)">
    <v-card border rounded="lg" class="news-detail-dialog bg-surface-darken-2">
      <!-- 弹窗顶栏 S -->
      <v-card-title class="d-flex align-center justify-space-between px-4 py-3 border-b bg-surface-darken-3">
        <div class="d-flex align-center ga-2 flex-wrap min-width-0">
          <v-chip
              v-if="activeNews"
              size="small"
              variant="tonal"
              :color="platformConfig.color"
              :prepend-icon="platformConfig.icon"
              class="font-weight-bold">
            {{ platformConfig.label }}
          </v-chip>

          <span class="text-subtitle-1 font-weight-bold text-white text-truncate">
            {{ t('news.dialogTitle') }}
          </span>
        </div>

        <div class="d-flex align-center ga-1 flex-shrink-0">
          <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="small"
              :title="t('news.copyContent')"
              @click="onCopyContent">
          </v-btn>
          <v-btn
              icon="mdi-share-variant-outline"
              variant="text"
              size="small"
              :title="t('news.copyLink')"
              @click="onCopyShareLink">
          </v-btn>
          <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="onClose">
          </v-btn>
        </div>
      </v-card-title>
      <!-- 弹窗顶栏 E -->

      <!-- 弹窗主体内容 S -->
      <v-card-text class="pa-4 pa-sm-6">
        <!-- 加载中状态 -->
        <div v-if="internalLoading" class="d-flex justify-center align-center py-12">
          <Loading size="42"></Loading>
        </div>

        <div v-else-if="activeNews">
          <!-- 作者与时间元信息 S -->
          <div class="d-flex align-center justify-space-between flex-wrap ga-2 pb-4 mb-4 border-b border-opacity-10">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-account-circle-outline" size="20" class="opacity-70"></v-icon>
              <span class="text-body-2 font-weight-bold text-white">
                {{ activeNews.author || platformConfig.label }}
              </span>
            </div>

            <div class="text-caption text-medium-emphasis d-flex align-center ga-1">
              <v-icon icon="mdi-clock-outline" size="14" class="opacity-60"></v-icon>
              <TimeView :time="activeNews.createdTime || (activeNews as any).created_at" />
            </div>
          </div>
          <!-- 作者与时间元信息 E -->

          <!-- 富文本正文 S -->
          <div class="news-dialog-body mb-5" v-html="activeNews.content"></div>
          <!-- 富文本正文 E -->

          <!-- 媒体图片画廊 S -->
          <div v-if="mediaUrls.length > 0" class="news-media-gallery mt-4">
            <v-row density="compact">
              <v-col
                  v-for="(url, idx) in mediaUrls"
                  :key="idx"
                  :cols="mediaUrls.length === 1 ? 12 : (mediaUrls.length === 2 ? 6 : (mobile ? 12 : 6))">
                <v-hover v-slot="{ isHovering, props }">
                  <v-card
                      border
                      v-bind="props"
                      variant="tonal"
                      class="media-item-card rounded-lg overflow-hidden cursor-pointer"
                      @click="onPreviewImage(url)">
                    <v-img
                        :src="url"
                        :max-height="mediaUrls.length === 1 ? 460 : 260"
                        cover
                        class="bg-black">
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
                        </div>
                      </template>
                      <v-overlay
                          :model-value="isHovering"
                          contained
                          scrim="black"
                          opacity="0.35"
                          class="align-center justify-center">
                        <v-icon icon="mdi-magnify-plus-outline" size="32" color="white"></v-icon>
                      </v-overlay>
                    </v-img>
                  </v-card>
                </v-hover>
              </v-col>
            </v-row>
          </div>
          <!-- 媒体图片画廊 E -->
        </div>

        <div v-else class="text-center py-10 opacity-60 text-caption">
          {{ t('news.noNews') }}
        </div>
      </v-card-text>
      <!-- 弹窗主体内容 E -->

      <v-divider></v-divider>

      <!-- 弹窗底栏操作 S -->
      <v-card-actions class="px-4 py-3 bg-surface-darken-3 d-flex align-center justify-space-between">
        <div class="d-flex align-center text-caption opacity-60">
          <span v-if="activeNews?.id">ID: {{ activeNews.id }}</span>
        </div>

        <div class="d-flex align-center ga-2">
          <v-btn
              variant="text"
              size="small"
              prepend-icon="mdi-share-variant-outline"
              @click="onCopyShareLink">
            {{ t('news.copyLink') }}
          </v-btn>
          <v-btn
              variant="tonal"
              size="small"
              @click="onClose">
            {{ t('basic.button.close') }}
          </v-btn>
        </div>
      </v-card-actions>
      <!-- 弹窗底栏操作 E -->
    </v-card>

    <!-- 弹窗内图片全屏预览 S -->
    <v-dialog v-model="previewImageDialog" max-width="960" scrollable>
      <v-card border class="overflow-hidden">
        <v-card-title class="d-flex align-center justify-space-between px-4 py-2 border-b">
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" size="small" @click="previewImageDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="d-flex justify-center pa-0 bg-black">
          <v-img :src="previewImageUrl" max-height="85vh" contain></v-img>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- 弹窗内图片全屏预览 E -->
  </v-dialog>
</template>

<style scoped lang="less">
.news-detail-dialog {
  border-color: rgba(255, 255, 255, 0.12) !important;

  .news-dialog-body {
    font-size: 0.95rem;
    line-height: 1.85;
    letter-spacing: 0.2px;
    word-break: break-word;
    white-space: pre-wrap;
    color: rgba(255, 255, 255, 0.9);

    :deep(b) {
      color: #fff;
      font-weight: 600;
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 10px 0;
    }

    :deep(a) {
      color: var(--v-theme-primary);
      text-decoration: underline;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .media-item-card {
    border-color: rgba(255, 255, 255, 0.1) !important;
  }
}
</style>

