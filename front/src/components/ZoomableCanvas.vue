<template>
  <div class="canvas-container overlapping-circles" ref="container">
    <div class="canvas-container overlapping-pattern">
      <v-container class="position-relative" v-if="isShowTool">
        <ZoomableTool @event-center="resetView"
                      @event-minus="onScaleMinus"
                      @event-plus="onScalePlus"></ZoomableTool>
      </v-container>

      <div
          class="canvas"
          ref="canvas"
          :style="{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            width: `${canvasWidth}px`,
            height: `${contentHeight}px`,
            'pointer-events': isDragging ? 'none' : 'auto'
          }"
          @wheel="handleWheel"
          @mousedown="startDrag"
          @touchstart="startTouchDrag"
          @touchmove.prevent="handleTouchDrag"
          @touchend="stopDrag">
        <div class="content-wrapper content-layer"
             :style="{ pointerEvents: 'auto' }"
             ref="contentWrapper">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue'
import {useDisplay} from "vuetify/framework";
import ZoomableTool from "@/components/ZoomableTool.vue";

const {mobile} = useDisplay()
const props = defineProps({
  canvasWidth: {
    type: Number,
    default: 1200
  },
  canvasHeight: {
    type: Number,
    default: 600
  },
  isShowTool: {
    type: Boolean,
    default: false
  },
  defaultScale: {
    type: Number,
    default: 1
  },
  minScale: {
    type: Number,
    default: 0.1
  },
  maxScale: {
    type: Number,
    default: 3
  }
})
const scale = ref(1)
const position = ref({x: 0, y: 0})
const contentHeight = ref(props.canvasHeight || 600) // Initial height, will be updated
const isDragging = ref(false)
const startPos = ref({x: 0, y: 0})
const resizeObserver = ref(null)
const touchIdentifier = ref(null)
const container = ref(null)
const canvas = ref(null)
const contentWrapper = ref(null)

const initCanvas = () => {
  centerCanvas()

  nextTick(() => {
    updateContentHeight()
    setupResizeObserver()
  })
}

/**
 * 放大
 */
const onScalePlus = () => {
  if (scale.value >= props.maxScale)
    return

  scale.value += .1
}

/**
 * 缩小
 */
const onScaleMinus = () => {
  if (scale.value <= props.minScale)
    return

  scale.value -= .1
}

/**
 * 触摸开始
 * @param e
 */
const startTouchDrag = (e) => {
  if (e.touches.length !== 1) return // Only handle single touch

  const touch = e.touches[0]
  touchIdentifier.value = touch.identifier
  isDragging.value = true
  startPos.value = {
    x: touch.clientX - position.value.x,
    y: touch.clientY - position.value.y
  }
  canvas.value.style.cursor = 'grabbing'
}

/**
 * 处理拖拽
 * @param e
 */
const handleTouchDrag = (e) => {
  if (!isDragging.value || e.touches.length !== 1) return

  // Find the corresponding touch point
  const touch = Array.from(e.touches).find(t => t.identifier === touchIdentifier.value)
  if (!touch) return

  position.value.x = touch.clientX - startPos.value.x
  position.value.y = touch.clientY - startPos.value.y

  updateBackgroundPosition((-position.value.x + 100) * .5, (-position.value.y + 100) * .5)
}

/**
 * 监听内容高度的变化
 */
const setupResizeObserver = () => {
  if (typeof ResizeObserver === 'undefined') return

  resizeObserver.value = new ResizeObserver(entries => {
    for (let entry of entries) {
      contentHeight.value = entry.contentRect.height
    }
  })

  resizeObserver.value.observe(contentWrapper.value)
}

/**
 * 更新高度
 */
const updateContentHeight = () => {
  if (contentWrapper.value) {
    contentHeight.value = contentWrapper.value.offsetHeight
  }
}

/**
 * 初始画布
 */
const centerCanvas = () => {
  if (!container.value) return

  const containerWidth = container.value.clientWidth
  const containerHeight = container.value.clientHeight

  position.value = {
    x: (containerWidth - props.canvasWidth * scale.value) / 2 / scale.value,
    y: (containerHeight - (props.canvasHeight || contentHeight.value) * scale.value) / 2 / scale.value
  }
}

/**
 * 开始拖拽
 * @param e
 */
const startDrag = (e) => {
  if (e.button !== 0 && !!Array.from(e.target.classList).findLast(i => i == 'prohibit-drag')) return
  isDragging.value = true
  startPos.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  canvas.value.style.cursor = 'grabbing'
}

/**
 * 拖拽事件
 * @param e
 */
const handleDrag = (e) => {
  if (!isDragging.value) return

  position.value.x = e.clientX - startPos.value.x
  position.value.y = e.clientY - startPos.value.y

  updateBackgroundPosition((-position.value.x + 100) * .5, (-position.value.y + 100) * .5)
}

/**
 * 停止
 */
const stopDrag = () => {
  isDragging.value = false
  if (canvas.value && canvas.value.style.cursor)
    canvas.value.style.cursor = 'grab'
}

/**
 * 处理缩放
 * @param e
 */
const handleWheel = (e) => {
  if (!mobile.value)
    return;

  const delta = -e.deltaY
  const scaleFactor = 0.001
  const newScale = scale.value * (1 + delta * scaleFactor)

  scale.value = Math.max(
      props.minScale,
      Math.min(props.maxScale, newScale)
  )

  const rect = container.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  position.value.x = mouseX / scale.value - (mouseX - position.value.x * scale.value) / scale.value
  position.value.y = mouseY / scale.value - (mouseY - position.value.y * scale.value) / scale.value
}

/**
 * 重置视图
 */
const resetView = () => {
  scale.value =  props.defaultScale || 1
  centerCanvas()
}

const updateBackgroundPosition = (x, y) => {
  const elementCircles = document.querySelector('.overlapping-circles')

  elementCircles.style.transition = '--offset-x 0.3s ease, --offset-y 0.3s ease'
  elementCircles.style.setProperty('--offset-x', `${x}px`)
  elementCircles.style.setProperty('--offset-y', `${y}px`)
}

onMounted(() => {
  scale.value = props.defaultScale;

  initCanvas()

  window.addEventListener('mousemove', handleDrag)
  window.addEventListener('mouseup', stopDrag)

  if (mobile) {
    window.addEventListener('touchmove', handleTouchDrag, {passive: false})
    window.addEventListener('touchend', stopDrag)
  }

  // 禁止缩放
  const originalViewport = document.querySelector('meta[name="viewport"]');
  const originalContent = originalViewport?.content || '';

  // 设置不允许缩放
  originalViewport?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');

  // 页面卸载时恢复原始 viewport（可选）
  onBeforeUnmount(() => {
    if (originalViewport) {
      originalViewport.setAttribute('content', originalContent);
    }
  });
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleDrag)
  window.removeEventListener('mouseup', stopDrag)

  if (window.innerWidth <= 768) {
    window.removeEventListener('touchmove', handleTouchDrag)
    window.removeEventListener('touchend', stopDrag)
  }

  if (resizeObserver.value) resizeObserver.value.disconnect()
})

defineExpose({
  centerCanvas
})
</script>

<style scoped lang="less">
.canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  cursor: grab;
  pointer-events: none;
}

.canvas:active {
  cursor: grabbing;
}

.content-wrapper {
  width: 100%;
  display: inline-block;
}

.content-layer {
  pointer-events: auto;
}

.overlapping-pattern {
  --offset-x: 0px;
  --offset-y: 0px;
  --size: 100px;
  --color: rgba(255, 255, 255, 0.05);

  background-image: linear-gradient(to right,
  transparent calc(var(--size) + 0px),
  var(--color) calc(var(--size) + 1px),
  var(--color) calc(var(--size) + 2px),
  transparent calc(var(--size) + 3px)),
  linear-gradient(to bottom,
  transparent calc(var(--size) + 0px),
  var(--color) calc(var(--size) + 1px),
  var(--color) calc(var(--size) + 2px),
  transparent calc(var(--size) + 3px));

  background-size: 236px 236px;
  background-repeat: repeat;
  background-position: var(--offset-x) var(--offset-y);
}

.overlapping-circles {
  --offset-x: 0px;
  --offset-y: 0px;
  --size: 212px;
  --color: rgba(255, 216, 2, 0.1);

  background-image: radial-gradient(circle at calc(50%) calc(50%),
  transparent calc(var(--size) + 0px),
  var(--color) calc(var(--size) + 1px),
  transparent calc(var(--size) + 3px));

  background-size: calc(var(--size) + 210px) calc(var(--size) + 210px);
  background-repeat: repeat;
  background-position: var(--offset-x) var(--offset-y);
}
</style>
