<script setup lang="ts">
/**
 * 新闻资讯页面
 * 参照 /drop 页面规范设计，提供顶部 Silk 横幅、统计指标、固定吸附工具栏（平台过滤与防抖搜索）
 * 内容流采用多列瀑布流（Masonry）：>=lg 4列，md 3列，<md 1列，支持大图预览、内容一键复制与分页浏览
 */
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useHead} from '@unhead/vue';
import {apis} from '@/assets/sripts';
import type {NewsItem} from '@/assets/sripts/api/news_service';
import {useNoticeStore} from '~/stores/noticeStore';

import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import Silk from '@/components/Silk.vue';
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue';
import AffixContainerView from '@/components/AffixContainerView.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import Loading from '@/components/Loading.vue';
import TimeView from "@/components/TimeView.vue";
import NewsDetailDialog from '@/components/NewsDetailDialog.vue';

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const notice = useNoticeStore();
const newsApi = apis.newsApi();

// SEO 元数据配置
useHead({
  title: `${t('news.title')} | ${t('name')}`,
  meta: [
    {
      name: 'description',
      content: t('news.meta.description'),
    },
    {
      name: 'keywords',
      content: t('news.meta.keywords'),
    },
  ],
});

// 数据加载与分页状态
const loading = ref(true);
const refreshing = ref(false);
const list = ref<NewsItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(16);
const currentPlatform = ref('all');
const keyword = ref('');

// 搜索防抖定时器
let searchDebounceTimer: any = null;

// 详情弹窗状态与选中条目
const detailDialog = ref(false);
const selectedNews = ref<NewsItem | null>(null);
const selectedNewsId = ref<string | null>(null);

// 大图预览弹窗状态
const previewImageDialog = ref(false);
const previewImageUrl = ref('');

// 平台筛选配置列表
const platforms = computed(() => [
  {value: 'all', label: t('news.all'), icon: 'mdi-newspaper-variant-multiple-outline', color: 'primary'},
  {value: 'x', label: t('news.x'), icon: 'mdi-twitter', color: '#1DA1F2'},
  {value: 'xiaoheihe', label: t('news.xiaoheihe'), icon: 'mdi-cube-outline', color: '#F59E0B'},
]);

// 客户端关键词搜索过滤列表
const displayList = computed(() => {
  if (!keyword.value.trim()) return list.value;
  const kw = keyword.value.trim().toLowerCase();
  return list.value.filter(item => {
    const textMatch = item.content && item.content.toLowerCase().includes(kw);
    const authorMatch = item.author && item.author.toLowerCase().includes(kw);
    const idMatch = item.id && String(item.id).toLowerCase().includes(kw);
    return Boolean(textMatch || authorMatch || idMatch);
  });
});

/**
 * 获取指定平台的显示名称
 * @param platform 平台标识字符串
 */
const getPlatformLabel = (platform: string): string => {
  const p = platforms.value.find(item => item.value === platform);
  return p ? p.label : platform.toUpperCase();
};

/**
 * 获取指定平台的主题色值
 * @param platform 平台标识字符串
 */
const getPlatformColor = (platform: string): string => {
  const p = platforms.value.find(item => item.value === platform);
  return p ? p.color : 'grey';
};

/**
 * 获取指定平台的图标标识
 * @param platform 平台标识字符串
 */
const getPlatformIcon = (platform: string): string => {
  const p = platforms.value.find(item => item.value === platform);
  return p ? p.icon : 'mdi-newspaper-variant-outline';
};

/**
 * 格式化 ISO 或通用时间字符串为紧凑易读格式
 * @param timeStr 时间字符串
 */
const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}`;
    }
  } catch {
    // 忽略异常，降级显示原始字符串
  }
  return timeStr;
};

/**
 * 解析以逗号分隔的多张媒体图片链接
 * @param mediaUrl 媒体链接字符串
 */
const parseMediaUrls = (mediaUrl?: string | null): string[] => {
  if (!mediaUrl) return [];
  return mediaUrl.split(',').map(u => u.trim()).filter(Boolean);
};

/**
 * 打开图片预览弹窗
 * @param url 图片原始链接
 */
const onPreviewImage = (url: string) => {
  previewImageUrl.value = url;
  previewImageDialog.value = true;
};

/**
 * 复制新闻文字正文至系统剪贴板
 * @param content 富文本正文字符串
 */
const onCopyContent = async (content: string) => {
  try {
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    await navigator.clipboard.writeText(plainText);
    notice.success(t('news.copySuccess') || t('basic.tips.copySuccess'), {mode: 'minimal'});
  } catch {
    notice.error(t('basic.tips.copyFailed') || '复制失败');
  }
};

/**
 * 加载新闻列表数据
 * @param isRefresh 是否为用户主动触发刷新
 */
const fetchNews = async (isRefresh = false) => {
  if (isRefresh) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  try {
    const res: any = await newsApi.getNews({
      page: page.value,
      limit: pageSize.value,
      platform: currentPlatform.value === 'all' ? undefined : currentPlatform.value,
    });

    const payload = res?.data?.data || res?.data || res;
    if (payload) {
      list.value = payload.list || [];
      total.value = Number(payload.total || 0);
      checkRouteNewsId();
    }

    if (isRefresh) {
      notice.success(t('news.refreshSuccess'), {mode: 'minimal'});
    }
  } catch (err: any) {
    notice.error(err?.message || '获取新闻列表失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

/**
 * 用户主动点击全局刷新按钮处理
 */
const onRefresh = async () => {
  await fetchNews(true);
};

/**
 * 打开新闻详情弹窗并同步路由参数
 * @param item 新闻数据条目
 */
const onOpenDetail = (item: NewsItem) => {
  selectedNews.value = item;
  selectedNewsId.value = item.id;
  detailDialog.value = true;
  router.replace({
    query: {
      ...route.query,
      id: item.id,
    },
  });
};

/**
 * 关闭新闻详情弹窗并清理路由查询参数
 */
const onCloseDetail = () => {
  detailDialog.value = false;
  selectedNews.value = null;
  selectedNewsId.value = null;
  if (route.query.id) {
    const q = {...route.query};
    delete q.id;
    router.replace({query: q});
  }
};

/**
 * 依据当前路由参数中的 id 自动激活详情弹窗
 */
const checkRouteNewsId = () => {
  const qId = route.query.id;
  if (qId && typeof qId === 'string') {
    const found = list.value.find(item => String(item.id) === String(qId));
    if (found) {
      selectedNews.value = found;
      selectedNewsId.value = found.id;
    } else {
      selectedNews.value = null;
      selectedNewsId.value = qId;
    }
    detailDialog.value = true;
  }
};

/**
 * 监听路由中的新闻 id 参数变动
 */
watch(() => route.query.id, () => {
  checkRouteNewsId();
});

/**
 * 监听平台筛选与分页变化，重新请求数据
 */
watch([page, currentPlatform], () => {
  fetchNews();
});

/**
 * 监听搜索关键词变化，防抖重置页码至第一页
 */
watch(keyword, () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    // 客户端实时过滤，若关键词变化重置回到第一页
    page.value = 1;
  }, 300);
});

/**
 * 页面挂载时初始化请求新闻数据并检查路由深链
 */
onMounted(() => {
  fetchNews();
  checkRouteNewsId();
});
</script>

<template>
  <v-app id="news-page" class="news-page-root">
    <Header></Header>

    <v-main class="pb-16">
      <!-- 顶部 S -->
      <v-card height="200px">
        <template v-slot:image>
          <Silk
              :speed="3"
              :scale=".7"
              :color="'#1c1c1c'"
              :noise-intensity="0.1"
              :rotation="-.6"
              class="bg-black">
          </Silk>
        </template>
        <template v-slot:default>
          <v-breadcrumbs density="compact" class="ma-0 pa-0">
            <v-container>
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
              <v-breadcrumbs-item>
                {{ t('news.heroTitle') }}
              </v-breadcrumbs-item>
            </v-container>
          </v-breadcrumbs>
          <v-divider opacity=".01"></v-divider>

          <v-container class="position-relative">
            <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
              <v-icon icon="mdi-newspaper-variant-outline" size="120"></v-icon>
            </div>
          </v-container>
        </template>
      </v-card>
      <v-divider opacity=".06"></v-divider>
      <!-- 顶部 E -->

      <!-- 概览指标与刷新条 S -->
      <div class="bg-black">
        <v-container>
          <v-row class="text-center" align="center">
            <v-col>
              <v-row density="compact" no-gutters>
                <v-col cols="12" sm="4">
                  <div class="rounded-xl d-flex align-center">
                    <div>
                      <div class="text-caption text-medium-emphasis">
                        {{ t('news.statsTotal') }}
                      </div>
                      <div class="text-h5 font-weight-bold text-white">
                        {{ total }} {{ t('news.statsUnit') }}
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="auto">
                  <v-divider vertical inset></v-divider>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="rounded-xl d-flex align-center">
                    <div>
                      <div class="text-caption text-medium-emphasis">
                        {{ t('news.currentPlatform') }}
                      </div>
                      <div class="text-h5 font-weight-bold text-white">
                        {{ getPlatformLabel(currentPlatform) }}
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <div class="d-flex flex-column flex-sm-row align-center justify-space-between ga-4">
                <div class="d-flex flex-wrap align-center ga-3 mt-4 mt-sm-0">
                  <v-btn
                      variant="flat"
                      prepend-icon="mdi-refresh"
                      :loading="refreshing"
                      @click="onRefresh"
                      class="font-weight-bold">
                    {{ t('news.refresh') }}
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <!-- 概览指标与刷新条 E -->

      <!-- 主体内容区域 S -->
      <v-container class="position-relative z-index-1 max-w-1280 pt-6 pt-sm-10">
        <AffixBoxHasTitleView class="news-section">
          <!-- 筛选与搜索吸附栏 S -->
          <AffixContainerView>
            <v-card class="px-2 py-2 section-title-wrap d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-4">
              <div class="d-flex align-center ga-3">
                <v-btn-toggle
                    v-model="currentPlatform"
                    mandatory
                    density="comfortable"
                    color="amber"
                    variant="outlined">
                  <v-btn
                      v-for="plat in platforms"
                      :key="plat.value"
                      :value="plat.value"
                      size="small">
                    {{ plat.label }}
                  </v-btn>
                </v-btn-toggle>
              </div>

              <div class="d-flex flex-wrap align-center ga-3">
                <v-text-field
                    v-model="keyword"
                    density="compact"
                    variant="outlined"
                    :placeholder="t('news.searchPlaceholder')"
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    min-width="220"
                    clearable
                    rounded="lg"
                    class="search-input">
                </v-text-field>
              </div>
            </v-card>
          </AffixContainerView>
          <!-- 筛选与搜索吸附栏 E -->

          <!-- 加载中状态 S -->
          <div v-if="loading" class="d-flex flex-column justify-center py-16 ga-4">
            <Loading size="45"></Loading>
          </div>
          <!-- 加载中状态 E -->

          <!-- 瀑布流新闻列表 S -->
          <div v-else-if="displayList.length > 0" class="news-stream-container mt-4">
            <!-- 瀑布流容器：>=lg 4列，md 3列，<md 1列 -->
            <div class="news-masonry">
              <div
                  v-for="item in displayList"
                  :key="item.id"
                  class="news-masonry-item">
                <v-card
                    variant="text"
                    class="news-card pa-2 transition-swing cursor-pointer"
                    @click="onOpenDetail(item)">
                  <!-- 卡片头部标签与发布信息 S -->
                  <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
                    <div class="d-flex align-center ga-2 flex-wrap">
                      <v-chip
                          size="x-small"
                          variant="tonal"
                          :color="getPlatformColor(item.platform)"
                          :prepend-icon="getPlatformIcon(item.platform)"
                          class="font-weight-bold">
                        {{ getPlatformLabel(item.platform) }}
                      </v-chip>

                      <span v-if="item.author" class="text-caption font-weight-medium text-white d-flex align-center ga-1">
                        <v-icon icon="mdi-account-circle-outline" size="14" class="opacity-60"></v-icon>
                        {{ item.author }}
                      </span>
                    </div>

                    <div class="text-caption text-medium-emphasis d-flex align-center ga-1">
                      <TimeView :time="item.createdTime || (item as any).created_at" />
                    </div>
                  </div>
                  <!-- 卡片头部标签与发布信息 E -->

                  <!-- 卡片新闻正文 S -->
                  <div class="news-body text-body-2 text-high-emphasis mb-3" v-html="item.content"></div>
                  <!-- 卡片新闻正文 E -->

                  <!-- 媒体图片预览 S -->
                  <div v-if="parseMediaUrls(item.mediaUrl || (item as any).media_url).length > 0" class="news-media-grid">
                    <v-row density="compact">
                      <v-col
                          v-for="(url, idx) in parseMediaUrls(item.mediaUrl || (item as any).media_url)"
                          :key="idx"
                          :cols="parseMediaUrls(item.mediaUrl || (item as any).media_url).length === 1 ? 12 : 6">
                        <v-hover v-slot="{ isHovering, props }">
                          <v-card
                              border
                              v-bind="props"
                              variant="tonal"
                              class="media-preview-card rounded-lg overflow-hidden cursor-pointer">
                            <v-img
                                :src="url"
                                max-height="220"
                                cover
                                class="bg-grey-darken-4">
                              <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                  <v-progress-circular indeterminate color="primary" size="20"></v-progress-circular>
                                </div>
                              </template>
                            </v-img>
                          </v-card>
                        </v-hover>
                      </v-col>
                    </v-row>
                  </div>
                  <!-- 媒体图片预览 E -->
                </v-card>
              </div>
            </div>

            <!-- 分页控制器 S -->
            <PaginationBar
                v-model:page="page"
                :total="total"
                :page-size="pageSize"
                :total-visible="5"
                density="default"
                class="mt-8">
            </PaginationBar>
            <!-- 分页控制器 E -->
          </div>
          <!-- 瀑布流新闻列表 E -->

          <!-- 列表空数据状态 S -->
          <v-card v-else class="empty-card py-16 text-center" variant="text">
            <v-icon icon="mdi-newspaper-variant-multiple-outline" size="48" color="grey" class="mb-3"></v-icon>
            <div class="text-h6 font-weight-bold text-white mb-1">
              {{ t('news.noNews') }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ t('news.noNewsDesc') }}
            </div>
          </v-card>
          <!-- 列表空数据状态 E -->

          <template v-slot:title>
            {{ t('news.title') }}
          </template>
        </AffixBoxHasTitleView>
      </v-container>
      <!-- 主体内容区域 E -->
    </v-main>

    <!-- 图片大图预览弹窗 S -->
    <v-dialog v-model="previewImageDialog" max-width="960" scrollable>
      <v-card border class="overflow-hidden">
        <v-card-title class="d-flex align-center justify-space-between px-4 py-2 border-b">
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" size="small" @click="previewImageDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="d-flex justify-center pa-0">
          <v-img :src="previewImageUrl" max-height="80vh" contain></v-img>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- 图片大图预览弹窗 E -->

    <!-- 新闻详情弹窗 S -->
    <NewsDetailDialog
        v-model="detailDialog"
        :news-item="selectedNews"
        :news-id="selectedNewsId"
        @close="onCloseDetail">
    </NewsDetailDialog>
    <!-- 新闻详情弹窗 E -->

    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">
.news-page-root {
  .news-card {
    cursor: pointer;
  }

  .news-body {
    line-height: 1.65;
    word-break: break-word;
    white-space: pre-wrap;

    :deep(b) {
      color: #fff;
      font-weight: 600;
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 8px 0;
    }

    :deep(a) {
      color: var(--v-theme-primary);
      text-decoration: underline;
    }
  }

  .media-preview-card {
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .news-masonry {
    column-count: 4;
    column-gap: 16px;
    width: 100%;

    @media (max-width: 1264px) {
      column-count: 3;
    }

    @media (max-width: 960px) {
      column-count: 1;
    }
  }

  .news-masonry-item {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
    display: inline-block;
    width: 100%;
    margin-bottom: 16px;
  }

  .max-w-120 {
    max-width: 120px;
  }
}
</style>
