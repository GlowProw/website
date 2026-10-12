<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from "vue";
import type {SwipeDrawerProps} from "@/assets/types/Ui";

const props = withDefaults(defineProps<SwipeDrawerProps>(), {
    side: 'right',
    width: '90vw',
    maxWidth: '1024px',
    closeOnOverlay: true,
    lockScroll: true,
    edgeWidth: 24,
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>();

// 进入/离开动画时长，需要与样式 transition 保持一致
const ANIMATION_MS = 300;
// 拖动超过面板宽度该比例即收起
const CLOSE_RATIO = 0.25;
// 快速甩动速度阈值（px/ms），取手势末段速度判定
const FLING_VELOCITY = 0.5;
// 超过该位移才判定为横向手势，避免误触
const GESTURE_SLOP = 6;
// 纵向位移明显占优（超过横向 1.5 倍）才让给内容滚动，避免略带斜度的横拖被误杀
const VERTICAL_DOMINANCE = 1.5;

// 面板与遮罩是否已挂载（离开动画结束后再真正卸载，保证动画完整）
const rendered = ref(props.modelValue);
// 是否处于展开状态（驱动进出场 class）
const shown = ref(props.modelValue);
// 已确认的水平拖拽中（只用于切换 sd-dragging class，高频位移不走响应式）
const dragging = ref(false);

const edgeEl = ref<HTMLElement | null>(null);

// 面板可能是原生元素也可能是 v-card（组件 ref 拿不到 DOM），统一在按下时从真实 DOM 树解析
let panelDom: HTMLElement | null = null;
let overlayDom: HTMLElement | null = null;

let leaveTimer: ReturnType<typeof setTimeout> | null = null;
let locked = false;

// 手势进行中的一次性状态
let pointerId: number | null = null;
let startX = 0;
let startY = 0;
let gestureConfirmed = false;
// 当前沿关闭方向的位移（钳制在 [0, panelWidth]）
let currentDelta = 0;
let panelWidth = 0;
// 末段甩动速度采样
let lastSampleTime = 0;
let lastSampleDelta = 0;
let lastVelocity = 0;
// rAF 合并写入，保证一帧只写一次样式
let rafId: number | null = null;

const panelStyle = computed<Record<string, string>>(() => ({
    width: props.width,
    maxWidth: props.maxWidth,
}));

const edgeStyle = computed(() => ({
    width: `${props.edgeWidth}px`,
}));

/**
 * 收起抽屉
 */
const requestClose = (): void => {
    if (props.modelValue) emit('update:modelValue', false);
};

/**
 * 锁定/恢复背景滚动
 */
const lockBody = (lock: boolean): void => {
    if (typeof document === 'undefined') return;
    if (lock && props.lockScroll && !locked) {
        document.body.style.overflow = 'hidden';
        locked = true;
    } else if (!lock && locked) {
        document.body.style.overflow = '';
        locked = false;
    }
};

const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') requestClose();
};

watch(() => props.lockScroll, (shouldLock) => {
    if (props.modelValue) {
        lockBody(shouldLock);
    }
});

watch(() => props.modelValue, (open) => {
    if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
    }
    if (open) {
        rendered.value = true;
        lockBody(true);
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', onKeydown);
            // 下一帧切换展开态以触发进场动画
            let revealed = false;
            const reveal = () => {
                if (revealed || !rendered.value) return;
                revealed = true;
                shown.value = true;
            };
            requestAnimationFrame(reveal);
            setTimeout(reveal, 32);
        }
    } else {
        shown.value = false;
        lockBody(false);
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', onKeydown);
        }
        leaveTimer = setTimeout(() => {
            rendered.value = false;
        }, ANIMATION_MS);
    }
}, {immediate: true});

onBeforeUnmount(() => {
    if (leaveTimer) clearTimeout(leaveTimer);
    if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId);
    teardownWindowListeners();
    lockBody(false);
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeydown);
    }
});

/**
 * 直接把当前位移写进 DOM：面板跟随手指、遮罩随位移淡出
 * 拖动期间绕开 Vue 响应式，避免异步 patch 造成的跟手延迟
 */
const applyVisual = (): void => {
    rafId = null;
    const sign = props.side === 'right' ? 1 : -1;
    if (panelDom) {
        panelDom.style.transform = `translateX(${sign * currentDelta}px)`;
    }
    if (overlayDom) {
        overlayDom.style.opacity = String(Math.max(0, 1 - currentDelta / Math.max(1, panelWidth)));
    }
};

const scheduleVisual = (): void => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(applyVisual);
};

/**
 * 手势结束后把手感交还给 CSS 过渡：
 * 先保持当前内联位置并恢复 transition，下一帧再清空内联样式，
 * 由 sd-show class 决定滑回原位还是继续滑出
 */
const settle = (willClose: boolean): void => {
    if (willClose) shown.value = false;
    dragging.value = false;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (panelDom) panelDom.style.transform = '';
            if (overlayDom) overlayDom.style.opacity = '';
            panelDom = null;
            overlayDom = null;
        });
    });
};

const onWindowPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!gestureConfirmed) {
        if (Math.abs(dx) < GESTURE_SLOP && Math.abs(dy) < GESTURE_SLOP) return;
        // 纵向明显占优时让给内部内容滚动，本次按下不再触发抽屉手势
        if (Math.abs(dy) > GESTURE_SLOP && Math.abs(dy) > Math.abs(dx) * VERTICAL_DOMINANCE) {
            teardownWindowListeners();
            pointerId = null;
            return;
        }
        gestureConfirmed = true;
        dragging.value = true;
    }

    e.preventDefault();

    const directed = props.side === 'right' ? dx : -dx;
    // 钳制在 [0, panelWidth]：拖到头后面板停住但手势不中断，往回拉仍然跟手
    currentDelta = Math.min(panelWidth, Math.max(0, directed));

    // 末段瞬时速度用于甩动判定
    const now = Date.now();
    const dt = now - lastSampleTime;
    if (dt >= 8) {
        lastVelocity = (currentDelta - lastSampleDelta) / dt;
        lastSampleTime = now;
        lastSampleDelta = currentDelta;
    }

    scheduleVisual();
};

const finishGesture = (): void => {
    const wasConfirmed = gestureConfirmed;
    const delta = currentDelta;
    const velocity = lastVelocity;
    teardownWindowListeners();
    pointerId = null;

    if (!wasConfirmed) {
        panelDom = null;
        overlayDom = null;
        return;
    }
    const shouldClose = delta / Math.max(1, panelWidth) > CLOSE_RATIO || velocity > FLING_VELOCITY;
    if (shouldClose) {
        requestClose();
    }
    // DOM 引用在 settle 的过渡帧结束后释放
    settle(shouldClose);
};

const onWindowPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    finishGesture();
};

const onWindowPointerCancel = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    teardownWindowListeners();
    pointerId = null;
    if (gestureConfirmed) {
        // DOM 引用在 settle 的过渡帧结束后释放
        settle(false);
    } else {
        panelDom = null;
        overlayDom = null;
    }
    gestureConfirmed = false;
    currentDelta = 0;
};

/**
 * 拖动全程在 window 上监听手势，指针离开边缘热区、滑过内部内容都不会中断
 */
const setupWindowListeners = (): void => {
    if (typeof window === 'undefined') return;
    window.addEventListener('pointermove', onWindowPointerMove, {passive: false});
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerCancel);
};

/**
 * 移除全局指针手势监听
 */
const teardownWindowListeners = (): void => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointermove', onWindowPointerMove);
    window.removeEventListener('pointerup', onWindowPointerUp);
    window.removeEventListener('pointercancel', onWindowPointerCancel);
};

/**
 * 在边缘热区按下：只负责记录手势起点，后续交给 window 监听
 */
const onPointerDown = (e: PointerEvent): void => {
    if (!props.modelValue) return;
    // 鼠标只响应主键
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();

    // 面板可能渲染成 v-card，组件 ref 拿不到 DOM，沿热区向上找根节点再查询
    const root = edgeEl.value?.closest('.sd-root');
    panelDom = root?.querySelector<HTMLElement>('.sd-panel') ?? null;
    overlayDom = root?.querySelector<HTMLElement>('.sd-overlay') ?? null;
    if (!panelDom) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastSampleTime = Date.now();
    lastSampleDelta = 0;
    lastVelocity = 0;
    currentDelta = 0;
    gestureConfirmed = false;
    panelWidth = panelDom.getBoundingClientRect().width || 0;

    setupWindowListeners();
};

const onOverlayClick = (): void => {
    if (props.closeOnOverlay) requestClose();
};

defineOptions({
  name: 'SwipeDrawer'
});
</script>

<template>
  <Teleport to="body">
    <div v-if="rendered"
         class="sd-root"
         :class="[`sd-${side}`, {'sd-show': shown, 'sd-dragging': dragging}]">
      <!-- 遮罩 -->
      <div class="sd-overlay" @click="onOverlayClick"></div>

      <!-- 面板 -->
      <v-card
          class="sd-panel"
          :style="panelStyle"
          role="dialog"
          aria-modal="true">
        <!-- 边缘拖拽热区：鼠标按住或触摸后向关闭方向滑动即可收起 -->
        <div
            ref="edgeEl"
            class="sd-edge"
            :style="edgeStyle"
            @pointerdown="onPointerDown">
          <span class="sd-edge-pill"></span>
        </div>

        <div class="sd-content">
          <slot></slot>
        </div>
      </v-card>
    </div>
  </Teleport>
</template>

<style scoped>
.sd-root {
  position: fixed;
  inset: 0;
  z-index: 1900;
}

.sd-overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 300ms ease;
}

.sd-show .sd-overlay {
  opacity: 1;
}

.sd-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgb(0 0 0 / 28%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.sd-right .sd-panel {
  right: 0;
  transform: translateX(100%);
}

.sd-left .sd-panel {
  left: 0;
  transform: translateX(-100%);
}

.sd-show .sd-panel {
  transform: translateX(0);
}

.sd-dragging .sd-panel {
  transition: none;
}

.sd-dragging {
  user-select: none;
  -webkit-user-select: none;
}

.sd-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sd-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  cursor: ew-resize;
}

.sd-right .sd-edge {
  left: 0;
}

.sd-left .sd-edge {
  right: 0;
}

.sd-edge-pill {
  width: 4px;
  height: 56px;
  border-radius: 2px;
  background: rgb(var(--v-theme-on-surface) / 25%);
  pointer-events: none;
}

/* 移动设备占满宽度 */
@media (max-width: 1024px) {
  .sd-panel {
    width: 100vw !important;
    max-width: none !important;
  }
}
</style>
