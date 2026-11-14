<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useI18n} from "vue-i18n";

interface Props {
  /**
   * 触发显示的向下滚动阈值深度（像素）
   */
  threshold?: number;
  /**
   * 距离视口右侧偏移量（像素或自定义单位）
   */
  right?: number | string;
  /**
   * 距离视口底部偏移量（像素或自定义单位）
   */
  bottom?: number | string;
  /**
   * 堆叠层级数值
   */
  zIndex?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 400,
  right: '28px',
  bottom: '28px',
  zIndex: 'var(--z-scroll-up, 800)'
});

const {t} = useI18n();

// 是否已达到深滚阈值并显示按钮
const isVisible = ref(false);

// 动画帧请求句柄，用于滚动节流降频
let rafId: number | null = null;

const buttonStyle = computed(() => {
  const rightVal = typeof props.right === 'number' ? `${props.right}px` : props.right;
  const bottomVal = typeof props.bottom === 'number' ? `${props.bottom}px` : props.bottom;
  const zIndexVal = typeof props.zIndex === 'number' ? `${props.zIndex}` : props.zIndex;

  return {
    right: `calc(${rightVal} + env(safe-area-inset-right, 0px))`,
    bottom: `calc(${bottomVal} + env(safe-area-inset-bottom, 0px))`,
    zIndex: zIndexVal
  };
});

/**
 * 执行滚动位置检测，根据当前视口滚动深度决定按钮显隐
 */
const checkScrollPosition = () => {
  if (typeof window === 'undefined') return;
  const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  isVisible.value = currentScrollY > props.threshold;
};

/**
 * 滚动事件处理函数，采用 requestAnimationFrame 进行节流降频
 */
const handleScroll = () => {
  if (rafId !== null) return;
  rafId = window.requestAnimationFrame(() => {
    checkScrollPosition();
    rafId = null;
  });
};

/**
 * 平滑滚动回到视口最顶部
 */
const scrollToTop = () => {
  if (typeof window === 'undefined') return;
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  checkScrollPosition();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll);
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
});

defineOptions({
  name: 'ScrollUpBtn'
});
</script>

<template>
  <transition name="scroll-up-transition">
    <v-btn
        v-show="isVisible"
        icon
        variant="flat"
        density="default"
        class="scroll-up-btn position-fixed"
        :style="buttonStyle"
        :aria-label="t('common.scrollToTop')"
        :title="t('common.scrollToTop')"
        @click="scrollToTop">
      <v-icon
          icon="mdi-chevron-up"
          size="26"
          class="scroll-up-icon">
      </v-icon>
    </v-btn>
  </transition>
</template>

<style scoped lang="less">
.scroll-up-btn {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  border-radius: 50% !important;
  background: rgba(18, 18, 22, 0.78) !important;
  backdrop-filter: blur(12px) saturate(1.2);
  color: var(--main-color, #fbbf21) !important;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5), 0 0 10px rgba(251, 191, 33, 0.12);
  cursor: pointer;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              background 0.22s ease,
              border-color 0.22s ease,
              box-shadow 0.22s ease,
              opacity 0.28s ease !important;

  &:active {
    transform: translateY(0) scale(0.96);
  }

  .scroll-up-icon {
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.scroll-up-transition-enter-active,
.scroll-up-transition-leave-active {
  transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.scroll-up-transition-enter-from,
.scroll-up-transition-leave-to {
  opacity: 0 !important;
  transform: translateY(16px) scale(0.8) !important;
  pointer-events: none !important;
}
</style>
