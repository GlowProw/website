<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {inferMediaType, type MediaSourceInput, type MediaViewerItem, useMediaViewerStore} from '~/stores/mediaViewerStore';

const props = defineProps({
  /**
   * 是否显示（支持 v-model）
   */
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  /**
   * 媒体源列表（支持地址字符串或对象数组）
   */
  items: {
    type: Array as () => Array<MediaSourceInput>,
    default: undefined,
  },
  /**
   * 初始选中的媒体索引
   */
  initialIndex: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', index: number): void;
  (e: 'close'): void;
}>();

const {t} = useI18n();
const store = useMediaViewerStore();

// 内部独立状态（当作为普通受控组件使用时生效）
const internalVisible = ref(false);
const internalItems = ref<MediaViewerItem[]>([]);
const internalIndex = ref(0);

// 缩放、平移与旋转状态
const scale = ref(1.0);
const translateX = ref(0);
const translateY = ref(0);
const rotate = ref(0);
const isDragging = ref(false);
const isImageLoading = ref(false);

// 浮空栏显隐及悬停交互状态
const controlsVisible = ref(true);
const isHoveringControls = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// 视口与图片元素引用
const viewportRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

// 拖拽起始坐标记录
let startPointerX = 0;
let startPointerY = 0;
let startTranslateX = 0;
let startTranslateY = 0;

// 是否工作在独立受控模式下
const isControlled = computed(() => props.modelValue !== undefined);

// 最终生效的可见性
const isOpen = computed(() => {
  return isControlled.value ? Boolean(props.modelValue) : store.visible;
});

// 最终生效的媒体列表
const currentItems = computed<MediaViewerItem[]>(() => {
  if (isControlled.value) {
    const raw = props.items || [];
    return raw.map((item) => {
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
    }).filter((i) => Boolean(i.src));
  }
  return store.items;
});

// 最终生效的激活索引
const activeIndex = computed({
  get: () => (isControlled.value ? internalIndex.value : store.currentIndex),
  set: (val: number) => {
    if (isControlled.value) {
      internalIndex.value = val;
      emit('change', val);
    } else {
      store.setIndex(val);
    }
  },
});

// 当前激活的媒体条目
const currentItem = computed<MediaViewerItem | null>(() => {
  const list = currentItems.value;
  if (list.length === 0) return null;
  const idx = Math.max(0, Math.min(activeIndex.value, list.length - 1));
  return list[idx] || null;
});

// 媒体总数
const totalCount = computed(() => currentItems.value.length);

// 是否存在多张媒体
const hasMultiple = computed(() => totalCount.value > 1);

// 变换样式绑定
const transformStyle = computed(() => {
  return {
    transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0px) scale(${scale.value}) rotate(${rotate.value}deg)`,
    transition: isDragging.value ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0, 0.2, 1)',
  };
});

/**
 * 清除浮空控制栏自动隐藏计时器
 */
const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
};

/**
 * 重置浮空控制栏计时器，无交互静止时自动滑出隐藏
 */
const resetHideTimer = () => {
  clearHideTimer();
  controlsVisible.value = true;
  if (!isOpen.value || isHoveringControls.value || isDragging.value) return;

  hideTimer = setTimeout(() => {
    if (isOpen.value && !isHoveringControls.value && !isDragging.value) {
      controlsVisible.value = false;
    }
  }, 3500);
};

/**
 * 鼠标在视口区域移动时唤醒浮空控制栏
 */
const onMouseMove = () => {
  if (!isDragging.value) {
    resetHideTimer();
  }
};

/**
 * 鼠标悬停在浮空控制栏上时保持常驻显示
 */
const onControlMouseEnter = () => {
  isHoveringControls.value = true;
  clearHideTimer();
  controlsVisible.value = true;
};

/**
 * 鼠标离开浮空控制栏恢复倒计时隐藏
 */
const onControlMouseLeave = () => {
  isHoveringControls.value = false;
  resetHideTimer();
};

/**
 * 点击空白遮罩切换浮空栏显隐状态
 *
 * @param e 鼠标点击事件
 */
const onBackdropClick = (e: MouseEvent) => {
  if (isDragging.value) return;
  controlsVisible.value = !controlsVisible.value;
  if (controlsVisible.value) {
    resetHideTimer();
  } else {
    clearHideTimer();
  }
};

/**
 * 依据视口和图片当前布局尺寸计算位移边界，严格确保图片边缘不超出可见边界
 *
 * @param targetX 目标 X 轴位移
 * @param targetY 目标 Y 轴位移
 * @param currentScale 当前缩放比例
 */
const clampPosition = (targetX: number, targetY: number, currentScale: number) => {
  if (!imageRef.value || !viewportRef.value) {
    return {x: 0, y: 0};
  }

  const vw = viewportRef.value.clientWidth;
  const vh = viewportRef.value.clientHeight;

  // 旋转 90 或 270 度时宽高互换
  const isRotated90 = (Math.abs(rotate.value) % 180) !== 0;
  const imgW = isRotated90 ? imageRef.value.offsetHeight : imageRef.value.offsetWidth;
  const imgH = isRotated90 ? imageRef.value.offsetWidth : imageRef.value.offsetHeight;

  const scaledW = imgW * currentScale;
  const scaledH = imgH * currentScale;

  // 水平边界计算：若缩放后宽度未超出视口，居中且不允许横向位移；若超出，则位移幅度被限制在两侧对齐之间
  let maxX = 0;
  let minX = 0;
  if (scaledW > vw) {
    maxX = (scaledW - vw) / 2;
    minX = -maxX;
  }

  // 垂直边界计算：若缩放后高度未超出视口，居中且不允许纵向位移；若超出，则位移幅度被限制在上下对齐之间
  let maxY = 0;
  let minY = 0;
  if (scaledH > vh) {
    maxY = (scaledH - vh) / 2;
    minY = -maxY;
  }

  const clampedX = Math.min(maxX, Math.max(minX, targetX));
  const clampedY = Math.min(maxY, Math.max(minY, targetY));

  return {x: clampedX, y: clampedY};
};

/**
 * 重置变换状态至初始默认尺寸与居中位置
 */
const resetTransform = () => {
  scale.value = 1.0;
  translateX.value = 0;
  translateY.value = 0;
  rotate.value = 0;
  isDragging.value = false;
};

/**
 * 监听图片加载完毕，重置缩放和定位
 */
const onImageLoad = () => {
  isImageLoading.value = false;
  resetTransform();
};

/**
 * 关闭媒体查看器
 */
const onClose = () => {
  clearHideTimer();
  resetTransform();
  if (isControlled.value) {
    emit('update:modelValue', false);
    emit('close');
  } else {
    store.close();
  }
};

/**
 * 切换至上一张媒体
 */
const onPrev = () => {
  if (!hasMultiple.value) return;
  resetTransform();
  resetHideTimer();
  if (isControlled.value) {
    const nextIdx = activeIndex.value > 0 ? activeIndex.value - 1 : totalCount.value - 1;
    activeIndex.value = nextIdx;
  } else {
    store.prev();
  }
};

/**
 * 切换至下一张媒体
 */
const onNext = () => {
  if (!hasMultiple.value) return;
  resetTransform();
  resetHideTimer();
  if (isControlled.value) {
    const nextIdx = activeIndex.value < totalCount.value - 1 ? activeIndex.value + 1 : 0;
    activeIndex.value = nextIdx;
  } else {
    store.next();
  }
};

/**
 * 双击图片放大或还原至默认大小
 *
 * @param e 鼠标双击事件
 */
const onDoubleClick = (e: MouseEvent) => {
  if (currentItem.value?.type !== 'image') return;

  // 若当前已处于放大状态，再次双击还原默认大小
  if (scale.value > 1.05) {
    resetTransform();
    resetHideTimer();
    return;
  }

  // 默认双击放大倍率为 2.5
  const targetScale = 2.5;

  if (!viewportRef.value || !imageRef.value) {
    scale.value = targetScale;
    resetHideTimer();
    return;
  }

  const rect = viewportRef.value.getBoundingClientRect();
  const clickX = e.clientX - (rect.left + rect.width / 2);
  const clickY = e.clientY - (rect.top + rect.height / 2);

  // 以点击坐标为锚点进行缩放，并应用严格边界限制
  const targetX = -clickX * (targetScale - 1);
  const targetY = -clickY * (targetScale - 1);

  const clamped = clampPosition(targetX, targetY, targetScale);
  scale.value = targetScale;
  translateX.value = clamped.x;
  translateY.value = clamped.y;
  resetHideTimer();
};

/**
 * 鼠标按下或触摸开始，记录位移初值并启动拖拽
 *
 * @param e 指针事件
 */
const onPointerDown = (e: PointerEvent) => {
  if (e.button !== 0) return;
  if (currentItem.value?.type !== 'image') return;

  // 仅在放大状态下允许拖拽移动图片
  if (scale.value <= 1.0) return;

  isDragging.value = true;
  controlsVisible.value = false;
  clearHideTimer();

  startPointerX = e.clientX;
  startPointerY = e.clientY;
  startTranslateX = translateX.value;
  startTranslateY = translateY.value;

  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {
    // 忽略异常
  }
};

/**
 * 指针移动处理，实时计算并限制拖拽边界
 *
 * @param e 指针事件
 */
const onPointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return;

  const dx = e.clientX - startPointerX;
  const dy = e.clientY - startPointerY;

  const targetX = startTranslateX + dx;
  const targetY = startTranslateY + dy;

  const clamped = clampPosition(targetX, targetY, scale.value);
  translateX.value = clamped.x;
  translateY.value = clamped.y;
};

/**
 * 指针松开或被取消，结束拖拽
 *
 * @param e 指针事件
 */
const onPointerUp = (e: PointerEvent) => {
  if (!isDragging.value) return;
  isDragging.value = false;
  resetHideTimer();
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    // 忽略异常
  }
};

/**
 * 鼠标滚轮缩放图片并动态约束边界
 *
 * @param e 滚轮事件
 */
const onWheel = (e: WheelEvent) => {
  if (currentItem.value?.type !== 'image') return;
  e.preventDefault();

  const step = e.deltaY < 0 ? 0.25 : -0.25;
  const newScale = Math.min(5.0, Math.max(1.0, Number((scale.value + step).toFixed(2))));

  if (newScale === scale.value) return;

  scale.value = newScale;
  if (newScale <= 1.0) {
    scale.value = 1.0;
    translateX.value = 0;
    translateY.value = 0;
  } else {
    const clamped = clampPosition(translateX.value, translateY.value, newScale);
    translateX.value = clamped.x;
    translateY.value = clamped.y;
  }
  resetHideTimer();
};

/**
 * 点击放大一级
 */
const onZoomIn = () => {
  const newScale = Math.min(5.0, Number((scale.value + 0.5).toFixed(2)));
  scale.value = newScale;
  const clamped = clampPosition(translateX.value, translateY.value, newScale);
  translateX.value = clamped.x;
  translateY.value = clamped.y;
  resetHideTimer();
};

/**
 * 点击缩小一级
 */
const onZoomOut = () => {
  const newScale = Math.max(1.0, Number((scale.value - 0.5).toFixed(2)));
  scale.value = newScale;
  if (newScale <= 1.0) {
    scale.value = 1.0;
    translateX.value = 0;
    translateY.value = 0;
  } else {
    const clamped = clampPosition(translateX.value, translateY.value, newScale);
    translateX.value = clamped.x;
    translateY.value = clamped.y;
  }
  resetHideTimer();
};

/**
 * 顺时针旋转 90 度
 */
const onRotate = () => {
  rotate.value = (rotate.value + 90) % 360;
  nextTick(() => {
    const clamped = clampPosition(translateX.value, translateY.value, scale.value);
    translateX.value = clamped.x;
    translateY.value = clamped.y;
  });
  resetHideTimer();
};

/**
 * 全局键盘事件监听
 *
 * @param e 键盘事件
 */
const onKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    onClose();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    onPrev();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    onNext();
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    onZoomIn();
  } else if (e.key === '-') {
    e.preventDefault();
    onZoomOut();
  } else if (e.key === '0') {
    e.preventDefault();
    resetTransform();
  }
};

// 监听弹窗显示与隐藏，控制页面滚动与按键监听
watch(isOpen, (val) => {
  if (val) {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeydown);
    }
    resetTransform();
    isImageLoading.value = true;
    controlsVisible.value = true;
    resetHideTimer();
  } else {
    clearHideTimer();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeydown);
    }
  }
});

// 监听媒体项切换，重置变换
watch(() => currentItem.value?.src, () => {
  if (isOpen.value) {
    resetTransform();
    isImageLoading.value = true;
    controlsVisible.value = true;
    resetHideTimer();
  }
});

// 监听受控初始索引变化
watch(() => props.initialIndex, (val) => {
  if (val !== undefined && isControlled.value) {
    internalIndex.value = val;
  }
});

onMounted(() => {
  if (props.initialIndex !== undefined) {
    internalIndex.value = props.initialIndex;
  }
});

onBeforeUnmount(() => {
  clearHideTimer();
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKeydown);
  }
});
</script>

<template>
  <teleport to="body">
    <transition name="media-viewer-fade">
      <div
          v-if="isOpen"
          class="media-viewer-root v-theme--dark"
          tabindex="-1"
          @mousemove="onMouseMove">
        <!-- 背景遮罩 S -->
        <div class="media-viewer-backdrop" @click="onBackdropClick"></div>
        <!-- 背景遮罩 E -->

        <!-- 顶栏浮空操作栏 S -->
        <div
            class="media-viewer-header d-flex align-center justify-space-between px-4 py-3"
            :class="{'is-hidden': !controlsVisible}"
            @mouseenter="onControlMouseEnter"
            @mouseleave="onControlMouseLeave">
          <!-- 媒体位置与标题信息 S -->
          <div class="d-flex align-center ga-3 header-info">
            <v-chip
                v-if="hasMultiple"
                size="small"
                variant="tonal"
                color="amber"
                class="font-weight-bold">
              {{ t('mediaViewer.counter', {current: activeIndex + 1, total: totalCount}) }}
            </v-chip>

            <span v-if="currentItem?.title" class="text-subtitle-2 font-weight-bold text-white text-truncate max-w-sm">
              {{ currentItem.title }}
            </span>

            <v-chip
                v-if="currentItem?.type === 'image' && scale > 1.05"
                size="x-small"
                variant="text"
                color="grey-lighten-1">
              {{ Math.round(scale * 100) }}%
            </v-chip>
          </div>
          <!-- 媒体位置与标题信息 E -->

          <!-- 顶栏右侧操作按钮组 S -->
          <div class="d-flex align-center ga-1 header-actions">
            <!-- 顺时针旋转按钮 S -->
            <v-btn
                v-if="currentItem?.type === 'image'"
                icon="mdi-rotate-right"
                variant="text"
                density="comfortable"
                color="grey-lighten-2"
                :title="t('mediaViewer.rotate')"
                @click="onRotate">
            </v-btn>
            <!-- 顺时针旋转按钮 E -->

            <!-- 还原尺寸按钮 S -->
            <v-btn
                v-if="currentItem?.type === 'image'"
                icon="mdi-refresh"
                variant="text"
                density="comfortable"
                color="grey-lighten-2"
                :title="t('mediaViewer.reset')"
                @click="resetTransform">
            </v-btn>
            <!-- 还原尺寸按钮 E -->

            <!-- 原图外链直达 S -->
            <v-btn
                v-if="currentItem?.src"
                icon="mdi-open-in-new"
                variant="text"
                density="comfortable"
                color="grey-lighten-2"
                :title="t('mediaViewer.original')"
                :href="currentItem.src"
                target="_blank"
                rel="noopener noreferrer">
            </v-btn>
            <!-- 原图外链直达 E -->

            <!-- 右上角取消关闭按钮 S -->
            <v-icon-btn
                variant="tonal"
                color="grey-lighten-3"
                icon="mdi-close"
                density="comfortable"
                class="media-close-btn ml-2"
                @click="onClose">
            </v-icon-btn>
            <!-- 右上角取消关闭按钮 E -->
          </div>
          <!-- 顶栏右侧操作按钮组 E -->
        </div>
        <!-- 顶栏浮空操作栏 E -->

        <!-- 媒体展示主体视口 S -->
        <div
            ref="viewportRef"
            class="media-viewer-viewport img img-wrap"
            :class="{
              'is-zoomed': scale > 1.05,
              'is-dragging': isDragging,
            }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @wheel.passive="false"
            @wheel="onWheel">
          <!-- 图片加载中状态 S -->
          <div v-if="isImageLoading && currentItem?.type === 'image'" class="media-viewer-loading">
            <v-progress-circular indeterminate color="amber" size="48"></v-progress-circular>
          </div>
          <!-- 图片加载中状态 E -->

          <!-- 图片类型媒体渲染 S -->
          <div
              v-if="currentItem?.type === 'image'"
              class="media-transform-layer"
              :style="transformStyle"
              @dblclick="onDoubleClick">
            <img
                ref="imageRef"
                :src="currentItem.src"
                class="media-image"
                draggable="false"
                @load="onImageLoad"/>
          </div>
          <!-- 图片类型媒体渲染 E -->

          <!-- 视频类型媒体渲染 S -->
          <div v-else-if="currentItem?.type === 'video'" class="media-video-container">
            <video
                :src="currentItem.src"
                controls
                autoplay
                playsinline
                class="media-video-element">
            </video>
          </div>
          <!-- 视频类型媒体渲染 E -->

          <!-- PDF 文档类型媒体渲染 S -->
          <div v-else-if="currentItem?.type === 'pdf'" class="media-pdf-container">
            <iframe
                :src="currentItem.src"
                class="media-pdf-iframe"
                title="PDF Document">
            </iframe>
          </div>
          <!-- PDF 文档类型媒体渲染 E -->

          <!-- iframe 通用嵌入渲染 S -->
          <div v-else-if="currentItem?.type === 'iframe'" class="media-iframe-container">
            <iframe
                :src="currentItem.src"
                class="media-iframe-element"
                allow="fullscreen; picture-in-picture"
                allowfullscreen>
            </iframe>
          </div>
          <!-- iframe 通用嵌入渲染 E -->
        </div>
        <!-- 媒体展示主体视口 E -->

        <!-- 上一张侧边导航按钮 S -->
        <v-btn
            v-if="hasMultiple"
            icon="mdi-chevron-left"
            variant="tonal"
            size="large"
            color="white"
            class="media-nav-btn media-nav-btn-prev"
            :class="{'is-hidden': !controlsVisible}"
            :title="t('mediaViewer.prev')"
            @mouseenter="onControlMouseEnter"
            @mouseleave="onControlMouseLeave"
            @click.stop="onPrev">
        </v-btn>
        <!-- 上一张侧边导航按钮 E -->

        <!-- 下一张侧边导航按钮 S -->
        <v-btn
            v-if="hasMultiple"
            icon="mdi-chevron-right"
            variant="tonal"
            size="large"
            color="white"
            class="media-nav-btn media-nav-btn-next"
            :class="{'is-hidden': !controlsVisible}"
            :title="t('mediaViewer.next')"
            @mouseenter="onControlMouseEnter"
            @mouseleave="onControlMouseLeave"
            @click.stop="onNext">
        </v-btn>
        <!-- 下一张侧边导航按钮 E -->

        <!-- 底部浮空控制栏 S -->
        <div
            class="media-viewer-bottom-bar"
            :class="{'is-hidden': !controlsVisible}"
            @mouseenter="onControlMouseEnter"
            @mouseleave="onControlMouseLeave">
          <div class="bottom-bar-inner d-flex align-center ga-1 px-3 py-1">
            <!-- 上一张按钮 S -->
            <v-btn
                v-if="hasMultiple"
                icon="mdi-chevron-left"
                variant="text"
                density="compact"
                color="grey-lighten-2"
                :title="t('mediaViewer.prev')"
                @click.stop="onPrev">
            </v-btn>
            <!-- 上一张按钮 E -->

            <!-- 缩小按钮 S -->
            <v-btn
                v-if="currentItem?.type === 'image'"
                icon="mdi-magnify-minus-outline"
                variant="text"
                density="compact"
                color="grey-lighten-2"
                :disabled="scale <= 1.0"
                :title="t('mediaViewer.zoomOut')"
                @click.stop="onZoomOut">
            </v-btn>
            <!-- 缩小按钮 E -->

            <!-- 缩放指示与重置 S -->
            <span
                v-if="currentItem?.type === 'image'"
                class="text-caption font-weight-bold px-2 user-select-none cursor-pointer zoom-indicator"
                :title="t('mediaViewer.reset')"
                @click.stop="resetTransform">
              {{ Math.round(scale * 100) }}%
            </span>
            <!-- 缩放指示与重置 E -->

            <!-- 放大按钮 S -->
            <v-btn
                v-if="currentItem?.type === 'image'"
                icon="mdi-magnify-plus-outline"
                variant="text"
                density="compact"
                color="grey-lighten-2"
                :disabled="scale >= 5.0"
                :title="t('mediaViewer.zoomIn')"
                @click.stop="onZoomIn">
            </v-btn>
            <!-- 放大按钮 E -->

            <!-- 下一张按钮 S -->
            <v-btn
                v-if="hasMultiple"
                icon="mdi-chevron-right"
                variant="text"
                density="compact"
                color="grey-lighten-2"
                :title="t('mediaViewer.next')"
                @click.stop="onNext">
            </v-btn>
            <!-- 下一张按钮 E -->
          </div>
        </div>
        <!-- 底部浮空控制栏 E -->
      </div>
    </transition>
  </teleport>
</template>

<style scoped lang="less">
@import "@/assets/styles/img";

.media-viewer-root {
  position: fixed;
  inset: 0;
  z-index: 99999;
  overflow: hidden;
  user-select: none;
  touch-action: none;

  .media-viewer-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(8, 8, 10, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    z-index: 1;
  }

  .media-viewer-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 20;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 65%, rgba(0, 0, 0, 0) 100%);
    pointer-events: auto;
    transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.34s ease;
    transform: translateY(0);
    opacity: 1;

    &.is-hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }

    .header-info {
      min-width: 0;

      .max-w-sm {
        max-width: 360px;
      }
    }

    .media-close-btn {
      font-weight: 600;
      letter-spacing: 0.5px;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    }
  }

  .media-viewer-viewport {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: zoom-in;

    &.is-zoomed {
      cursor: grab;
    }

    &.is-dragging {
      cursor: grabbing;
    }

    .media-viewer-loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      pointer-events: none;
    }

    .media-transform-layer {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      max-height: 100%;
      will-change: transform;
      transform-origin: center center;

      .media-image {
        display: block;
        max-width: 100vw;
        max-height: 100vh;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        pointer-events: auto;
      }
    }

    .media-video-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 24px;

      .media-video-element {
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        outline: none;
        background: #000;
      }
    }

    .media-pdf-container {
      width: calc(100vw - 80px);
      height: calc(100vh - 80px);
      background: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);

      .media-pdf-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    }

    .media-iframe-container {
      width: calc(100vw - 80px);
      height: calc(100vh - 80px);
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);

      .media-iframe-element {
        width: 100%;
        height: 100%;
        border: none;
      }
    }
  }

  .media-nav-btn {
    position: absolute;
    top: 50%;
    z-index: 20;
    background: rgba(20, 20, 24, 0.65) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, background 0.2s ease, border-color 0.2s ease;
    transform: translateY(-50%) scale(1);
    opacity: 1;

    &.is-hidden {
      transform: translateY(-50%) scale(0.85);
      opacity: 0;
      pointer-events: none;
    }

    &.is-hidden {
      transform: translateY(-50%) scale(0.85);
      opacity: 0;
      pointer-events: none;
    }

    &.media-nav-btn-prev {
      left: 20px;
    }

    &.media-nav-btn-next {
      right: 20px;
    }
  }

  .media-viewer-bottom-bar {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    z-index: 20;
    display: flex;
    justify-content: center;
    pointer-events: none;
    transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.34s ease;
    transform: translateY(0);
    opacity: 1;

    &.is-hidden {
      transform: translateY(calc(100% + 32px));
      opacity: 0;
      pointer-events: none;
    }

    .bottom-bar-inner {
      pointer-events: auto;
      background: rgba(18, 18, 22, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 32px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 42px rgba(0, 0, 0, 0.75), 0 0 16px rgba(251, 191, 33, 0.22);
        border-color: rgba(251, 191, 33, 0.45);
      }

      .zoom-indicator {
        min-width: 48px;
        text-align: center;
        color: rgba(255, 255, 255, 0.85);

        &:hover {
          color: #fbbf21;
        }
      }
    }
  }
}

.media-viewer-fade-enter-active,
.media-viewer-fade-leave-active {
  transition: opacity 0.24s cubic-bezier(0.2, 0, 0.2, 1);
}

.media-viewer-fade-enter-from,
.media-viewer-fade-leave-to {
  opacity: 0;
}
</style>
