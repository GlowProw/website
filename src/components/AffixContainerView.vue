<template>
  <!-- 固钉容器外层包裹 S -->
  <div class="affix-container-wrapper" ref="wrapperRef">
    <!-- 占位探测哨兵（在正常文档流中，用于连续精准监测自然滚动位置） S -->
    <div ref="sentinelRef" class="affix-sentinel" aria-hidden="true"></div>
    <!-- 占位探测哨兵 E -->

    <div
        ref="contentRef"
        class="affix-container-content"
        :style="contentStyle">
      <slot
          :prop="props"
          :props="props"
          :isAffix="isAffix"></slot>
    </div>
  </div>
  <!-- 固钉容器外层包裹 E -->
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import type { AffixContainerViewProps } from '@/assets/types/Ui';

export type AffixContainerSlotProps = {
  prop: AffixContainerViewProps;
  props: AffixContainerViewProps;
  isAffix: boolean;
};

const props = withDefaults(defineProps<AffixContainerViewProps>(), {
  offsetTop: 10,
  offsetBottom: 0,
  disabled: false,
  affixBottom: false,
  scrollable: true,
});

const emit = defineEmits<{
  (e: 'change', isAffix: boolean): void;
}>();

defineSlots<{
  default?: (scope: AffixContainerSlotProps) => any;
}>();

// 容器包裹、内部内容与原位哨兵节点引用
const wrapperRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const sentinelRef = ref<HTMLElement | null>(null);

// 当前是否处于固钉/吸顶/吸底状态
const isAffix = ref(false);

// 动画帧请求 ID
let rafId: number | null = null;

// 元素尺寸变化观察器
let resizeObserver: ResizeObserver | null = null;

// 绑定的滚动容器缓存
let currentScrollParent: HTMLElement | Window | null = null;

/**
 * 寻找元素最近的具备可垂直滚动的祖先节点
 *
 * @param el 目标 DOM 节点
 * @returns 滚动祖先元素，若无则返回 window
 */
const getScrollContainer = (el: HTMLElement | null): HTMLElement | Window => {
  if (typeof window === 'undefined' || !el) return window;
  let parent = el.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
};

/**
 * 获取视口顶部固定顶栏的实际占用高度
 * 优先读取全局固定 Header 节点，若不存在或处于未固定状态则返回 0
 *
 * @returns 顶栏高度像素值
 */
const getGlobalHeaderHeight = (): number => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;

  const headerEl = document.querySelector('.v-app-bar.header, header .v-app-bar, .v-app-bar') as HTMLElement | null;
  if (headerEl) {
    const style = window.getComputedStyle(headerEl);
    if (style.position === 'fixed' || style.position === 'sticky') {
      const rect = headerEl.getBoundingClientRect();
      if (rect.top <= 0 && rect.bottom > 0) {
        return rect.height || 56;
      }
    }
  }

  const appWrap = document.querySelector('.v-application__wrap') as HTMLElement | null;
  if (appWrap) {
    const layoutTop = window.getComputedStyle(appWrap).getPropertyValue('--v-layout-top');
    const parsed = parseFloat(layoutTop);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 0;
};

// 规范化的数值型 offsetTop
const numericOffsetTop = computed(() => {
  const val = Number(props.offsetTop);
  return isNaN(val) ? 80 : val;
});

// 规范化的数值型 offsetBottom
const numericOffsetBottom = computed(() => {
  const val = Number(props.offsetBottom);
  return isNaN(val) ? 0 : val;
});

/**
 * 计算实际吸顶生效的像素偏移阈值：
 * 当处于普通视口滚动且存在固定全局 Header 时，若传入 offsetTop 小于 Header 高度，自动加上 Header 高度避免被遮挡；
 * 当处于局部滚动容器内部或已包含 Header 高度时，保持原值。
 */
const effectiveOffsetTop = computed(() => {
  const offset = numericOffsetTop.value;
  if (props.affixBottom || props.disabled) return offset;

  const isWindow = !contentRef.value || getScrollContainer(contentRef.value) === window;
  if (!isWindow) {
    return offset;
  }

  const headerH = getGlobalHeaderHeight();
  if (headerH > 0 && offset < headerH) {
    return headerH + offset;
  }

  return offset;
});

/**
 * 钉住节点样式：
 * 顶部模式用 sticky top，并限制视口内最大高度；
 * 当 scrollable 为 false（嵌套 VerticalScrollList 等自定义滚动容器）时，提供确切视口高度且外层不产生多余滚动条。
 */
const contentStyle = computed(() => {
  if (props.disabled) {
    return {
      position: 'relative' as const,
      width: '100%',
    };
  }

  if (props.affixBottom) {
    return {
      position: 'sticky' as const,
      bottom: `${numericOffsetBottom.value}px`,
      zIndex: 90,
    };
  }

  const targetTop = effectiveOffsetTop.value;
  const viewportHeight = `calc(100vh - ${targetTop}px - 16px)`;

  if (!props.scrollable) {
    return {
      position: 'sticky' as const,
      top: `${targetTop}px`,
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column' as const,
      height: viewportHeight,
      maxHeight: viewportHeight,
      overflow: 'hidden' as const,
      '--affix-offset-top': `${targetTop}px`,
    };
  }

  return {
    position: 'sticky' as const,
    top: `${targetTop}px`,
    zIndex: 90,
    maxHeight: viewportHeight,
    overflowY: 'auto' as const,
    '--affix-offset-top': `${targetTop}px`,
  };
});

/**
 * 更新固钉容器当前吸附状态
 */
const updateAffixStatus = () => {
  if (props.disabled) {
    if (isAffix.value) {
      isAffix.value = false;
      emit('change', false);
    }
    return;
  }

  const el = contentRef.value;
  const sentinel = sentinelRef.value;
  if (!el) return;

  const scrollContainer = getScrollContainer(el);

  if (props.affixBottom) {
    const bottomOffset = numericOffsetBottom.value;
    const contentRect = el.getBoundingClientRect();

    if (scrollContainer === window) {
      const containerBottom = window.innerHeight;
      const stuck = contentRect.bottom >= (containerBottom - bottomOffset - 1);
      if (isAffix.value !== stuck) {
        isAffix.value = stuck;
        emit('change', stuck);
      }
    } else {
      const containerRect = (scrollContainer as HTMLElement).getBoundingClientRect();
      const relativeBottom = contentRect.bottom - containerRect.top;
      const targetBottom = containerRect.height - bottomOffset;
      const stuck = relativeBottom >= targetBottom - 1;
      if (isAffix.value !== stuck) {
        isAffix.value = stuck;
        emit('change', stuck);
      }
    }
    return;
  }

  const targetTop = effectiveOffsetTop.value;
  const measureEl = sentinel || el;
  const measureRect = measureEl.getBoundingClientRect();
  const contentRect = el.getBoundingClientRect();

  let currentTop = 0;
  let currentBottom = 0;

  if (scrollContainer === window) {
    currentTop = measureRect.top;
    currentBottom = contentRect.bottom;
  } else {
    const containerRect = (scrollContainer as HTMLElement).getBoundingClientRect();
    currentTop = measureRect.top - containerRect.top;
    currentBottom = contentRect.bottom - containerRect.top;
  }

  // 哨兵越过或达到吸顶线，且内容节点底部尚未完全移出吸附线，即视为正处于固钉吸附状态
  const stuck = currentTop <= (targetTop + 1) && currentBottom > targetTop;

  if (isAffix.value !== stuck) {
    isAffix.value = stuck;
    emit('change', stuck);
  }
};

/**
 * 节流调度吸附状态检测
 */
const handleScrollOrResize = () => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    updateAffixStatus();
  });
};

/**
 * 绑定或更新所属滚动容器的事件监听
 */
const bindScrollListener = () => {
  const container = getScrollContainer(contentRef.value);
  if (currentScrollParent && currentScrollParent !== container) {
    currentScrollParent.removeEventListener('scroll', handleScrollOrResize as EventListener);
  }
  currentScrollParent = container;
  if (container) {
    container.addEventListener('scroll', handleScrollOrResize as EventListener, { passive: true });
  }
};

/**
 * 解绑滚动容器的事件监听
 */
const unbindScrollListener = () => {
  if (currentScrollParent) {
    currentScrollParent.removeEventListener('scroll', handleScrollOrResize as EventListener);
    currentScrollParent = null;
  }
};

watch(
  () => [props.disabled, props.offsetTop, props.offsetBottom, props.affixBottom],
  () => {
    updateAffixStatus();
  }
);

onMounted(() => {
  updateAffixStatus();
  bindScrollListener();

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    document.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
  }

  if (typeof ResizeObserver !== 'undefined' && contentRef.value) {
    resizeObserver = new ResizeObserver(() => {
      handleScrollOrResize();
    });
    resizeObserver.observe(contentRef.value);
  }
});

onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  unbindScrollListener();

  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScrollOrResize);
    window.removeEventListener('resize', handleScrollOrResize);
    document.removeEventListener('scroll', handleScrollOrResize, { capture: true });
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

defineOptions({ name: 'AffixContainerView' });
</script>

<style scoped lang="less">
.affix-container-wrapper {
  display: contents;
}

.affix-sentinel {
  height: 0;
  width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  visibility: hidden;
  pointer-events: none;
}

.affix-container-content {
  box-sizing: border-box;
  scrollbar-width: thin;

  // 关键兼容：当内部嵌套滚动容器时，自动隐藏外层原生滚动条并限制视口最大高度，内容不足时自适应高度
  &:has(.scroll-container) {
    overflow: hidden !important;
    display: flex;
    flex-direction: column;
    height: fit-content;
    max-height: calc(100vh - var(--affix-offset-top, 80px) - 16px);
  }

  :deep(.scroll-container) {
    height: 100%;
    min-height: 0;
  }
}

.affix-container-content::-webkit-scrollbar {
  width: 4px;
}

.affix-container-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
