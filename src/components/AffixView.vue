<template>
  <!-- 固钉基础部件容器 S -->
  <div class="nail-widget" :class="[directionClass]" ref="widgetRef">
    <!-- 主内容区域 S -->
    <div class="main-content pl-5">
      <slot
          :prop="props"
          :props="props"
          :isAffix="isAffix"></slot>
    </div>
    <!-- 主内容区域 E -->

    <!-- 侧边固钉区域 S -->
    <div class="nail-area" :class="[`nail-${props.direction}`, props?.affixBgClass || '']">
      <div
          class="nail-container"
          :style="nailStyle">
        <div class="nail-content">
          <slot
              name="nail"
              :prop="props"
              :props="props"
              :isAffix="isAffix"></slot>
        </div>
      </div>

      <div class="nail-footer" v-if="slots['nail-footer']">
        <slot
            name="nail-footer"
            :prop="props"
            :props="props"
            :isAffix="isAffix"></slot>
      </div>
    </div>
    <!-- 侧边固钉区域 E -->
  </div>
  <!-- 固钉基础部件容器 E -->
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import type { AffixViewProps } from '@/assets/types/Ui';

export type AffixViewSlotProps = {
  prop: AffixViewProps;
  props: AffixViewProps;
  isAffix: boolean;
};

const props = withDefaults(defineProps<AffixViewProps>(), {
  direction: 'left',
  offsetTop: 80,
  offsetBottom: 0,
  affixBgClass: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'change', isAffix: boolean): void;
}>();

const slots = defineSlots<{
  default?: (scope: AffixViewSlotProps) => any;
  nail?: (scope: AffixViewSlotProps) => any;
  'nail-footer'?: (scope: AffixViewSlotProps) => any;
}>();

// 固钉根元素引用
const widgetRef = ref<HTMLElement | null>(null);

// 当前是否处于吸顶固钉状态
const isAffix = ref(false);

// 动画帧请求 ID
let rafId: number | null = null;

// 元素尺寸变化观察器
let resizeObserver: ResizeObserver | null = null;

// 绑定的滚动容器缓存
let currentScrollParent: HTMLElement | Window | null = null;

// 排版方向样式类名
const directionClass = computed(() => `direction-${props.direction}`);

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

/**
 * 计算实际吸顶生效的像素偏移阈值：
 * 当处于普通视口滚动且存在固定全局 Header 时，若传入 offsetTop 小于 Header 高度，自动加上 Header 高度避免被遮挡；
 * 当处于局部滚动容器内部或已包含 Header 高度时，保持原值。
 */
const effectiveOffsetTop = computed(() => {
  const offset = numericOffsetTop.value;
  if (props.disabled) return offset;

  const isWindow = !widgetRef.value || getScrollContainer(widgetRef.value) === window;
  if (!isWindow) {
    return offset;
  }

  const headerH = getGlobalHeaderHeight();
  if (headerH > 0 && offset < headerH) {
    return headerH + offset;
  }

  return offset;
});

// 侧边钉住容器定位样式
const nailStyle = computed(() => {
  if (props.disabled) {
    return {
      position: 'relative' as const,
      top: '0px',
      zIndex: 1,
      width: '100%',
    };
  }

  return {
    position: 'sticky' as const,
    top: `${effectiveOffsetTop.value}px`,
    zIndex: 5,
    width: '100%',
  };
});

/**
 * 更新当前吸附固钉状态
 */
const updateAffixStatus = () => {
  if (props.disabled) {
    if (isAffix.value) {
      isAffix.value = false;
      emit('change', false);
    }
    return;
  }

  const widget = widgetRef.value;
  if (!widget) return;

  const scrollContainer = getScrollContainer(widget);
  const targetTop = effectiveOffsetTop.value;
  const rect = widget.getBoundingClientRect();

  let currentTop = 0;
  let currentBottom = 0;

  if (scrollContainer === window) {
    currentTop = rect.top;
    currentBottom = rect.bottom;
  } else {
    const containerRect = (scrollContainer as HTMLElement).getBoundingClientRect();
    currentTop = rect.top - containerRect.top;
    currentBottom = rect.bottom - containerRect.top;
  }

  // 部件顶部达到吸顶线，且部件底部仍在吸顶线之下（未完全滚出视口或容器）
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
  const container = getScrollContainer(widgetRef.value);
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
  () => [props.disabled, props.offsetTop, props.offsetBottom],
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

  if (typeof ResizeObserver !== 'undefined' && widgetRef.value) {
    resizeObserver = new ResizeObserver(() => {
      handleScrollOrResize();
    });
    resizeObserver.observe(widgetRef.value);
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

defineOptions({ name: 'AffixView' });
</script>

<style scoped>
.nail-widget {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 40px;
}

.nail-widget.direction-left {
  flex-direction: row;
}

.nail-widget.direction-right {
  flex-direction: row-reverse;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.nail-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  flex-shrink: 0;
}

.nail-container {
  width: 100%;
}

.nail-footer {
  margin-top: auto;
}
</style>
