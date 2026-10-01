<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {useDisplay} from "vuetify/framework";
import ZoomableTool from "@/components/ZoomableTool.vue";
import StylizedLineBackground from "@/components/StylizedLineBackground.vue";

const {mobile} = useDisplay();

const props = withDefaults(defineProps<{
  disabled?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  isShowTool?: boolean;
  defaultScale?: number;
  minScale?: number;
  maxScale?: number;
  boundary?: { left?: number; right?: number; top?: number; bottom?: number } | null;
}>(), {
  disabled: false,
  canvasWidth: 1200,
  canvasHeight: 600,
  isShowTool: false,
  defaultScale: 1,
  minScale: 0.1,
  maxScale: 3,
  boundary: null
});

const scale = ref(props.defaultScale || 1);
const position = ref({x: 0, y: 0});
const contentHeight = ref(props.canvasHeight || 600);
const isDragging = ref(false);

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLElement | null>(null);
const contentWrapper = ref<HTMLElement | null>(null);
const resizeObserver = ref<ResizeObserver | null>(null);

let isMouseDown = false;
let hasDragged = false;
let dragStartMousePos = {x: 0, y: 0};
let dragStartCanvasPos = {x: 0, y: 0};

let isTouching = false;
let touchStartPos = {x: 0, y: 0};
let touchStartCanvasPos = {x: 0, y: 0};
let touchStartDistance = 0;
let touchStartScale = 1;
let touchCenter = {x: 0, y: 0};

/**
 * 放大
 */
const onScalePlus = () => {
  const oldScale = scale.value;
  const newScale = Math.min(props.maxScale, oldScale + 0.1);
  if (newScale === oldScale) return;
  zoomAroundCenter(newScale);
};

/**
 * 缩小
 */
const onScaleMinus = () => {
  const oldScale = scale.value;
  const newScale = Math.max(props.minScale, oldScale - 0.1);
  if (newScale === oldScale) return;
  zoomAroundCenter(newScale);
};

/**
 * 以视口中心为基准进行缩放
 */
const zoomAroundCenter = (newScale: number) => {
  if (!container.value) {
    scale.value = newScale;
    return;
  }
  const oldScale = scale.value;
  const containerWidth = container.value.clientWidth || 0;
  const containerHeight = container.value.clientHeight || 0;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  position.value = {
    x: centerX - (centerX - position.value.x) * (newScale / oldScale),
    y: centerY - (centerY - position.value.y) * (newScale / oldScale)
  };
  scale.value = newScale;
};

/**
 * 触摸开始
 */
const startTouchDrag = (e: TouchEvent) => {
  if (props.disabled) return;
  if ((e.target as Element)?.closest?.('.prohibit-drag')) return;

  if (e.touches.length === 1) {
    isTouching = true;
    hasDragged = false;
    const touch = e.touches[0];
    touchStartPos = {x: touch.clientX, y: touch.clientY};
    touchStartCanvasPos = {...position.value};
  } else if (e.touches.length === 2) {
    isTouching = true;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    touchStartDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    touchStartScale = scale.value;
    touchCenter = {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }
};

/**
 * 处理触摸拖拽与捏合缩放
 */
const handleTouchDrag = (e: TouchEvent) => {
  if (!isTouching) return;

  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.x;
    const dy = touch.clientY - touchStartPos.y;

    if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      hasDragged = true;
      isDragging.value = true;
    }

    if (hasDragged) {
      let newX = touchStartCanvasPos.x + dx;
      let newY = touchStartCanvasPos.y + dy;

      if (props.boundary) {
        if (typeof props.boundary.left === 'number') newX = Math.max(props.boundary.left, newX);
        if (typeof props.boundary.right === 'number') newX = Math.min(props.boundary.right, newX);
        if (typeof props.boundary.top === 'number') newY = Math.max(props.boundary.top, newY);
        if (typeof props.boundary.bottom === 'number') newY = Math.min(props.boundary.bottom, newY);
      }

      position.value = {x: newX, y: newY};
    }
  } else if (e.touches.length === 2 && touchStartDistance > 0 && container.value) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const factor = currentDistance / touchStartDistance;
    const newScale = Math.max(props.minScale, Math.min(props.maxScale, touchStartScale * factor));
    const oldScale = scale.value;

    if (newScale !== oldScale) {
      const rect = container.value.getBoundingClientRect();
      const cx = touchCenter.x - rect.left;
      const cy = touchCenter.y - rect.top;

      position.value = {
        x: cx - (cx - position.value.x) * (newScale / oldScale),
        y: cy - (cy - position.value.y) * (newScale / oldScale)
      };
      scale.value = newScale;
    }
  }
};

/**
 * 触摸结束
 */
const stopTouchDrag = () => {
  isTouching = false;
  isDragging.value = false;
  touchStartDistance = 0;
};

/**
 * 监听内容高度的变化
 */
const setupResizeObserver = () => {
  if (typeof ResizeObserver === 'undefined' || !contentWrapper.value) return;

  resizeObserver.value = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      contentHeight.value = entry.contentRect.height;
    }
  });

  resizeObserver.value.observe(contentWrapper.value);
};

/**
 * 更新高度
 */
const updateContentHeight = () => {
  if (contentWrapper.value) {
    contentHeight.value = contentWrapper.value.offsetHeight;
  }
};

/**
 * 居中画布
 */
const centerCanvas = () => {
  if (!container.value) return;

  const containerWidth = container.value.clientWidth || 0;
  const containerHeight = container.value.clientHeight || 0;

  if (!containerWidth || !containerHeight) return;

  const renderedWidth = props.canvasWidth * scale.value;
  const currentContentH = contentHeight.value || props.canvasHeight || 600;
  const renderedHeight = currentContentH * scale.value;

  position.value = {
    x: (containerWidth - renderedWidth) / 2,
    y: containerHeight > renderedHeight ? (containerHeight - renderedHeight) / 2 : 20
  };
};

/**
 * 鼠标开始拖拽
 */
const startDrag = (e: MouseEvent) => {
  if (props.disabled || e.button !== 0) return;
  if ((e.target as Element)?.closest?.('.prohibit-drag')) return;

  isMouseDown = true;
  hasDragged = false;
  dragStartMousePos = {x: e.clientX, y: e.clientY};
  dragStartCanvasPos = {...position.value};
};

/**
 * 鼠标移动处理拖拽
 */
const handleDrag = (e: MouseEvent) => {
  if (!isMouseDown) return;

  const dx = e.clientX - dragStartMousePos.x;
  const dy = e.clientY - dragStartMousePos.y;

  if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    hasDragged = true;
    isDragging.value = true;
  }

  if (hasDragged) {
    let newX = dragStartCanvasPos.x + dx;
    let newY = dragStartCanvasPos.y + dy;

    if (props.boundary) {
      if (typeof props.boundary.left === 'number') newX = Math.max(props.boundary.left, newX);
      if (typeof props.boundary.right === 'number') newX = Math.min(props.boundary.right, newX);
      if (typeof props.boundary.top === 'number') newY = Math.max(props.boundary.top, newY);
      if (typeof props.boundary.bottom === 'number') newY = Math.min(props.boundary.bottom, newY);
    }

    position.value = {x: newX, y: newY};
  }
};

/**
 * 鼠标停止拖拽
 */
const stopDrag = () => {
  isMouseDown = false;
  isDragging.value = false;
};

/**
 * 拖拽发生时拦截内部子元素的点击事件，避免拖拽触发跳转
 */
const handleWindowClickCapture = (e: MouseEvent) => {
  if (hasDragged) {
    e.preventDefault();
    e.stopPropagation();
    hasDragged = false;
  }
};

/**
 * 鼠标滚轮缩放
 */
const handleWheel = (e: WheelEvent) => {
  if (props.disabled || !container.value) return;

  const delta = -e.deltaY;
  const scaleFactor = 0.001;
  const oldScale = scale.value;
  const newScale = Math.max(
      props.minScale,
      Math.min(props.maxScale, oldScale * (1 + delta * scaleFactor))
  );

  if (newScale === oldScale) return;

  const rect = container.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  position.value = {
    x: mouseX - (mouseX - position.value.x) * (newScale / oldScale),
    y: mouseY - (mouseY - position.value.y) * (newScale / oldScale)
  };
  scale.value = newScale;
};

/**
 * 重置视图
 */
const resetView = () => {
  scale.value = props.defaultScale || 1;
  centerCanvas();
};

const initCanvas = () => {
  scale.value = props.defaultScale || 1;
  centerCanvas();

  nextTick(() => {
    updateContentHeight();
    centerCanvas();
    setupResizeObserver();
  });
};

onMounted(() => {
  initCanvas();

  window.addEventListener('mousemove', handleDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('click', handleWindowClickCapture, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('click', handleWindowClickCapture, true);

  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
});

defineOptions({name: 'ZoomableCanvas'});

defineExpose({
  centerCanvas,
  resetView,
  position,
  scale
});
</script>

<template>
  <div
      class="canvas-viewport"
      ref="container"
      @wheel.passive="handleWheel"
      @mousedown="startDrag"
      @touchstart.passive="startTouchDrag"
      @touchmove.passive="handleTouchDrag"
      @touchend.passive="stopTouchDrag"
      @touchcancel.passive="stopTouchDrag">
    <StylizedLineBackground
        class="canvas-bg"
        :offset-x="position.x"
        :offset-y="position.y">
      <v-container class="position-relative tool-container" v-if="isShowTool && !disabled">
        <ZoomableTool
            @event-center="resetView"
            @event-minus="onScaleMinus"
            @event-plus="onScalePlus"/>
      </v-container>

      <div
          class="canvas"
          ref="canvas"
          :class="{'is-dragging': isDragging}"
          :style="{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            width: `${canvasWidth}px`,
            minHeight: `${contentHeight}px`
          }">
        <div class="content-wrapper content-layer" ref="contentWrapper">
          <slot></slot>
        </div>
      </div>
    </StylizedLineBackground>
  </div>
</template>

<style scoped lang="less">
.canvas-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  user-select: none;
}

.canvas-bg {
  width: 100%;
  height: 100%;
  position: relative;
}

.tool-container {
  z-index: 2;
  pointer-events: auto;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  cursor: grab;
  user-select: none;

  &.is-dragging,
  &:active {
    cursor: grabbing;
  }
}

.content-wrapper {
  width: 100%;
  display: block;
}

.content-layer {
  pointer-events: auto;
}
</style>
