import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

export interface MediaViewerItem {
  /**
   * 媒体文件直链或访问地址
   */
  src: string;
  /**
   * 媒体格式类型，支持图片、视频、PDF 及 iframe 嵌入
   */
  type?: 'image' | 'video' | 'pdf' | 'iframe';
  /**
   * 媒体标题，展示在弹窗顶栏
   */
  title?: string;
  /**
   * 媒体附加说明
   */
  description?: string;
  /**
   * 媒体缩略图地址
   */
  thumbnail?: string;
  /**
   * 备选下载地址
   */
  downloadUrl?: string;
}

export type MediaSourceInput = string | MediaViewerItem;

/**
 * 依据文件扩展名或路径推断媒体格式类型
 *
 * @param url 媒体目标地址
 */
export function inferMediaType(url: string): 'image' | 'video' | 'pdf' | 'iframe' {
  if (!url) return 'image';
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v')
  ) {
    return 'video';
  }
  return 'image';
}

/**
 * 全局全屏媒体查看器状态存储
 */
export const useMediaViewerStore = defineStore('mediaViewer', () => {
  // 弹窗可见性开关
  const visible = ref(false);

  // 媒体列表
  const items = ref<MediaViewerItem[]>([]);

  // 当前选中索引
  const currentIndex = ref(0);

  // 当前选中的媒体项目
  const currentItem = computed<MediaViewerItem | null>(() => {
    if (items.value.length === 0) return null;
    const idx = Math.max(0, Math.min(currentIndex.value, items.value.length - 1));
    return items.value[idx] || null;
  });

  // 媒体总数
  const total = computed(() => items.value.length);

  // 是否存在上一项
  const hasPrev = computed(() => items.value.length > 1);

  // 是否存在下一项
  const hasNext = computed(() => items.value.length > 1);

  /**
   * 开启媒体查看器并载入媒体列表
   *
   * @param sources 单个或多个媒体地址或媒体项目
   * @param initialIndex 初始定位的媒体索引
   */
  const open = (sources: MediaSourceInput | MediaSourceInput[], initialIndex: number = 0) => {
    const rawList = Array.isArray(sources) ? sources : [sources];
    const normalized: MediaViewerItem[] = rawList
      .map((item) => {
        if (typeof item === 'string') {
          return {
            src: item,
            type: inferMediaType(item),
          };
        }
        return {
          ...item,
          type: item.type || inferMediaType(item.src),
        };
      })
      .filter((i) => Boolean(i.src));

    if (normalized.length === 0) return;

    items.value = normalized;
    const clampedIndex = Math.max(0, Math.min(initialIndex, normalized.length - 1));
    currentIndex.value = clampedIndex;
    visible.value = true;
  };

  /**
   * 关闭媒体查看器
   */
  const close = () => {
    visible.value = false;
  };

  /**
   * 切换至上一张媒体
   */
  const prev = () => {
    if (items.value.length <= 1) return;
    if (currentIndex.value > 0) {
      currentIndex.value -= 1;
    } else {
      currentIndex.value = items.value.length - 1;
    }
  };

  /**
   * 切换至下一张媒体
   */
  const next = () => {
    if (items.value.length <= 1) return;
    if (currentIndex.value < items.value.length - 1) {
      currentIndex.value += 1;
    } else {
      currentIndex.value = 0;
    }
  };

  /**
   * 跳转至指定索引位置
   *
   * @param index 目标媒体索引
   */
  const setIndex = (index: number) => {
    if (index >= 0 && index < items.value.length) {
      currentIndex.value = index;
    }
  };

  return {
    visible,
    items,
    currentIndex,
    currentItem,
    total,
    hasPrev,
    hasNext,
    open,
    close,
    prev,
    next,
    setIndex,
  };
});

