<script setup lang="ts">
/**
 * 首页新闻资讯轮播组件
 * 样式参考 CodexOverview.vue (card-flavor, card-enlargement-mask-flavor, 悬浮变色)
 * 支持自适应屏幕分片（桌面3列、平板2列、移动端1列）、自动循环轮播与悬停暂停
 */
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useDisplay} from 'vuetify';
import {apis} from '@/assets/sripts';
import type {NewsItem} from '@/assets/sripts/api/news_service';
import Loading from '@/components/Loading.vue';

const {t} = useI18n();
const {smAndDown, mdAndDown} = useDisplay();
const newsApi = apis.newsApi();

// 数据状态
const loading = ref(true);
const newsList = ref<NewsItem[]>([]);
const pageIndex = ref(0);
const isHovering = ref(false);

// 轮播定时器标识
let cycleTimer: any = null;

// 根据当前屏幕断点动态计算单页显示张数
const chunkSize = computed(() => {
  if (smAndDown.value) return 1;
  if (mdAndDown.value) return 2;
  return 4;
});

// 将新闻列表按屏幕规格分块切片
const newsChunks = computed(() => {
  const size = chunkSize.value;
  const chunks: NewsItem[][] = [];
  for (let i = 0; i < newsList.value.length; i += size) {
    chunks.push(newsList.value.slice(i, i + size));
  }
  return chunks;
});

/**
 * 获取指定平台的显示名称
 * @param platform 平台标识
 */
const getPlatformLabel = (platform: string): string => {
  switch (platform) {
    case 'x':
      return 'X';
    case 'xiaoheihe':
      return t('news.xiaoheihe');
    default:
      return platform ? platform.toUpperCase() : 'NEWS';
  }
};

/**
 * 获取指定平台的主题色
 * @param platform 平台标识
 */
const getPlatformColor = (platform: string): string => {
  switch (platform) {
    case 'x':
      return '#1DA1F2';
    case 'xiaoheihe':
      return '#F59E0B';
    default:
      return 'amber';
  }
};

/**
 * 获取指定平台的图标
 * @param platform 平台标识
 */
const getPlatformIcon = (platform: string): string => {
  switch (platform) {
    case 'x':
      return 'mdi-twitter';
    case 'xiaoheihe':
      return 'mdi-cube-outline';
    default:
      return 'mdi-newspaper-variant-outline';
  }
};

/**
 * 格式化时间字符串为短日期时间
 * @param timeStr ISO 或通用时间字符串
 */
const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${m}-${day} ${hh}:${mm}`;
    }
  } catch {
    // 忽略异常，降级显示
  }
  return timeStr;
};

/**
 * 解析并提取第一张媒体图片链接
 * @param mediaUrl 媒体链接（数组或逗号分隔多图）
 */
const getFirstImageUrl = (mediaUrl?: string[] | string | null): string => {
  if (!mediaUrl) return '';
  const urls: string[] = Array.isArray(mediaUrl)
    ? mediaUrl.map(u => String(u).trim()).filter(Boolean)
    : String(mediaUrl).split(',').map(u => u.trim()).filter(Boolean);
  if (urls.length === 0) return '';
  const firstImg = urls.find(u => !/\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(u) && !u.includes('/video/'));
  return firstImg || urls[0] || '';
};

/**
 * 提取精简标题展示
 * @param item 新闻数据项
 */
const getNewsTitle = (item: NewsItem): string => {
  if (!item.content) return t('news.title');
  const boldMatch = item.content.match(/<b>(.*?)<\/b>/i);
  if (boldMatch && boldMatch[1]) {
    const raw = boldMatch[1].replace(/<[^>]+>/g, '').trim();
    if (raw) return raw;
  }
  const plain = item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= 26) return plain;
  return plain.slice(0, 26) + '...';
};

/**
 * 提取正文纯文本摘要
 * @param item 新闻数据项
 */
const getNewsSnippet = (item: NewsItem): string => {
  if (!item.content) return '';
  const plain = item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= 60) return plain;
  return plain.slice(0, 60) + '...';
};

/**
 * 切换至上一页轮播
 */
const onPrev = () => {
  if (newsChunks.value.length === 0) return;
  pageIndex.value = (pageIndex.value - 1 + newsChunks.value.length) % newsChunks.value.length;
};

/**
 * 切换至下一页轮播
 */
const onNext = () => {
  if (newsChunks.value.length === 0) return;
  pageIndex.value = (pageIndex.value + 1) % newsChunks.value.length;
};

/**
 * 启动自动轮播计时器
 */
const startTimer = () => {
  stopTimer();
  cycleTimer = setInterval(() => {
    if (!isHovering.value && newsChunks.value.length > 1) {
      pageIndex.value = (pageIndex.value + 1) % newsChunks.value.length;
    }
  }, 20000);
};

/**
 * 停止自动轮播计时器
 */
const stopTimer = () => {
  if (cycleTimer) {
    clearInterval(cycleTimer);
    cycleTimer = null;
  }
};

/**
 * 鼠标进入悬停区域
 */
const onMouseEnter = () => {
  isHovering.value = true;
};

/**
 * 鼠标离开悬停区域
 */
const onMouseLeave = () => {
  isHovering.value = false;
};

/**
 * 加载最新新闻资讯数据
 */
const fetchLatestNews = async () => {
  loading.value = true;
  try {
    const res: any = await newsApi.getNews({
      page: 1,
      limit: 8,
    });
    const payload = res?.data?.data || res?.data || res;
    if (payload && Array.isArray(payload.list)) {
      newsList.value = payload.list;
    }
  } catch (err) {
    console.warn('获取首页新闻资讯轮播失败:', err);
  } finally {
    loading.value = false;
  }
};

// 监听屏幕断点变化调整页码防止越界
watch(newsChunks, (chunks) => {
  if (pageIndex.value >= chunks.length && chunks.length > 0) {
    pageIndex.value = chunks.length - 1;
  }
});

onMounted(() => {
  fetchLatestNews();
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <v-container
      class="news-carousel-widget position-relative"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave">
    <!-- 轮播顶栏标题与控制操作 S -->
    <div class="d-flex align-center justify-space-between mb-2">
      <!-- 分页圆点指示器 -->
      <div class="d-flex align-center ga-1 mr-2" v-if="newsChunks.length > 1">
          <span
              v-for="(_, idx) in newsChunks"
              :key="idx"
              class="carousel-indicator"
              :class="{ active: pageIndex === idx }"
              @click="pageIndex = idx">
          </span>
      </div>

      <v-spacer></v-spacer>

      <div class="d-flex align-center ga-2">
        <!-- 左右翻页控制器 -->
        <v-btn
            icon="mdi-chevron-left"
            size="x-small"
            variant="tonal"
            density="comfortable"
            :disabled="newsChunks.length <= 1"
            class="control-btn"
            @click="onPrev">
        </v-btn>
        <v-btn
            icon="mdi-chevron-right"
            size="x-small"
            variant="tonal"
            density="comfortable"
            :disabled="newsChunks.length <= 1"
            class="control-btn"
            @click="onNext">
        </v-btn>

        <!-- 查看更多链接 -->
        <router-link
            to="/news"
            class="more-link text-caption text-amber d-flex align-center ga-1 ml-2 font-weight-bold">
          <span>{{ t('codex.more') || '更多' }}</span>
          <v-icon icon="mdi-arrow-right" size="14"></v-icon>
        </router-link>
      </div>
    </div>
    <!-- 轮播顶栏标题与控制操作 E -->

    <!-- 数据加载骨架状态 S -->
    <div v-if="loading" class="d-flex align-center justify-center py-10">
      <Loading size="36"></Loading>
    </div>
    <!-- 数据加载骨架状态 E -->

    <!-- 轮播主体滑块 S -->
    <div v-else-if="newsChunks.length > 0" class="carousel-body">
      <v-window v-model="pageIndex" class="news-window overflow-visible">
        <v-window-item
            v-for="(chunk, cIdx) in newsChunks"
            :key="cIdx">
          <v-row class="mx-lg-n5 mx-md-n3 mx-n2">
            <v-col
                v-for="item in chunk"
                :key="item.id"
                cols="12"
                :sm="12 / Math.min(chunk.length, 2)"
                :md="12 / Math.min(chunk.length, 4)">
              <router-link :to="{ path: '/news', query: { id: item.id } }" class="codex-overview-item news-overview-item">
                <div class="card-enlargement-flavor pa-0">
                  <v-card class="card-enlargement-mask-flavor card px-5 py-4 d-flex flex-column justify-space-between">
                    <!-- 卡片顶部信息与标签 -->
                    <div class="d-flex align-center justify-space-between w-100">
                      {{ getPlatformLabel(item.platform) }}

                      <span class="text-caption text-white opacity-60 d-flex align-center ga-1">
                        {{ formatTime(item.createdTime || (item as any).created_at) }}
                      </span>
                    </div>

                    <!-- 卡片视觉封面或纯文本摘要展示 -->
                    <div class="card-body-preview my-3 d-flex align-center justify-center overflow-hidden rounded">
                      <v-img
                          v-if="getFirstImageUrl(item.mediaUrl || (item as any).media_url)"
                          :src="getFirstImageUrl(item.mediaUrl || (item as any).media_url)"
                          height="150px"
                          cover
                          class="rounded bg-black w-100">
                      </v-img>
                      <p v-else class="text-caption text-white opacity-80 line-clamp-2 mb-0 px-1 text-start">
                        {{ getNewsSnippet(item) }}
                      </p>
                    </div>

                    <!-- 卡片底部作者标识 -->
                    <div class="d-flex align-center justify-space-between opacity-60 text-white">
                      {{ item.author || getPlatformLabel(item.platform) }}
                    </div>
                  </v-card>
                </div>
                <div class="mt-2 text-center name text-truncate px-1">
                  {{ getNewsTitle(item) }}
                </div>
              </router-link>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </div>
    <!-- 轮播主体滑块 E -->

    <!-- 空数据兜底 S -->
    <v-card v-else class="empty-box py-8 text-center" variant="text">
      <span class="text-caption opacity-60 text-white">{{ t('news.noNews') }}</span>
    </v-card>
    <!-- 空数据兜底 E -->
  </v-container>
</template>

<style scoped lang="less">
.news-carousel-widget {
  max-width: 100%;

  .carousel-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.25s ease;

    &.active {
      width: 16px;
      border-radius: 4px;
      background-color: var(--main-color, #e5a93c);
    }
  }

  .control-btn {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  .more-link {
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }

  .news-overview-item {
    display: block;
    text-decoration: none;
    color: inherit;

    .card {
      background-size: calc(100% - 12px) calc(100% - 8px);
      background-position: center;
      transition: background-color 0.25s ease, transform 0.25s ease;
    }

    &:hover .card {
      background-color: var(--main-color, #e5a93c);
    }

    .name {
      color: #fff;
      transition: color 0.2s ease;
    }

    &:hover .name {
      color: var(--main-color, #e5a93c);
    }
  }

  .max-w-140 {
    max-width: 140px;
  }
}
</style>
