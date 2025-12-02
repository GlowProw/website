<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'

interface Props {
  scale?: number
  lensSize?: number
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  zoomViewBorder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  scale: 2,
  lensSize: 200,
  position: 'bottom-right',
  zoomViewBorder: true
})

const emit = defineEmits<{
  zoomStart: []
  zoomEnd: []
}>()

const containerRef = ref<HTMLElement>()
const lensRef = ref<HTMLElement>()
const zoomViewRef = ref<HTMLElement>()
const isActive = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)
const isTouchDevice = ref(false)
const containerRect = ref<DOMRect>()

// 缓存DOM元素
const viewportRef = ref<HTMLElement>()
const cloneRef = ref<HTMLElement>()
let rafId: number | null = null

// 计算放大镜位置
const lensStyle = computed(() => {
  if (!isActive.value) return { display: 'none' }

  const lensRadius = props.lensSize / 2
  let left = mouseX.value - lensRadius
  let top = mouseY.value - lensRadius

  // 边界检查
  if (containerRect.value) {
    left = Math.max(0, Math.min(left, containerRect.value.width - props.lensSize))
    top = Math.max(0, Math.min(top, containerRect.value.height - props.lensSize))
  }

  return {
    display: 'block',
    width: `${props.lensSize}px`,
    height: `${props.lensSize}px`,
    left: `${left}px`,
    top: `${top}px`
  }
})

// 计算放大视图位置
const zoomViewStyle = computed(() => {
  const baseStyle = {
    width: `${props.lensSize}px`,
    height: `${props.lensSize}px`,
    border: props.zoomViewBorder ? '2px solid #333' : 'none'
  }

  if (!isActive.value) {
    return { ...baseStyle, display: 'none' }
  }

  const positionStyles = {
    'top-right': { top: '0', right: '0' },
    'bottom-right': { bottom: '0', right: '0' },
    'top-left': { top: '0', left: '0' },
    'bottom-left': { bottom: '0', left: '0' }
  }

  return {
    ...baseStyle,
    display: 'block',
    ...positionStyles[props.position]
  }
})

// 事件监听器管理
let observer: MutationObserver | null = null

watch(() => props.scale, () => {
  if (isActive.value) {
    initZoomView()
  }
})

// 监听鼠标位置变化 - 使用防抖
watch([mouseX, mouseY], () => {
  if (isActive.value) {
    // 使用 requestAnimationFrame 避免频繁更新
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    rafId = requestAnimationFrame(() => {
      updateZoomViewPosition()
    })
  }
})

onMounted(() => {
  updateContainerRect()
  window.addEventListener('resize', handleResize)

  // 监听容器内容变化
  if (containerRef.value) {
    observer = new MutationObserver(() => {
      updateContainerRect()
      // 内容变化时重新初始化放大视图
      if (isActive.value) {
        initZoomView()
      }
    })
    observer.observe(containerRef.value, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  window.removeEventListener('resize', handleResize)
})

/**
 * 更新容器尺寸
 */
const updateContainerRect = () => {
  if (containerRef.value) {
    containerRect.value = containerRef.value.getBoundingClientRect()
  }
}

/**
 * 初始化放大视图
 */
const initZoomView = () => {
  if (!zoomViewRef.value || !containerRef.value || !containerRect.value) return

  nextTick(() => {
    // 清除原有内容
    zoomViewRef.value!.innerHTML = ''

    // 创建视口容器
    const viewport = document.createElement('div')
    viewport.style.width = `${props.lensSize}px`
    viewport.style.height = `${props.lensSize}px`
    viewport.style.overflow = 'hidden'
    viewport.style.position = 'relative'
    viewportRef.value = viewport

    // 创建容器内容的克隆
    const clone = containerRef.value!.cloneNode(true) as HTMLElement

    // 移除克隆中的放大镜镜头和其他不需要的元素
    const clonedLens = clone.querySelector('.magnifier-lens')
    if (clonedLens) {
      clonedLens.remove()
    }

    // 设置克隆样式
    clone.style.width = `${containerRect.value!.width}px`
    clone.style.height = `${containerRect.value!.height}px`
    clone.style.transform = `scale(${props.scale})`
    clone.style.transformOrigin = '0 0'
    clone.style.position = 'absolute'
    clone.style.top = '0'
    clone.style.left = '0'
    cloneRef.value = clone

    viewport.appendChild(clone)
    zoomViewRef.value!.appendChild(viewport)

    // 初始位置更新
    updateZoomViewPosition()
  })
}

/**
 * 只更新放大视图位置，不重新创建DOM
 */
const updateZoomViewPosition = () => {
  if (!cloneRef.value || !containerRect.value) return

  // 计算在放大后的坐标系中，鼠标位置对应的点
  const scaledMouseX = mouseX.value * props.scale
  const scaledMouseY = mouseY.value * props.scale

  // 计算偏移量，让放大视图中心显示鼠标位置的内容
  const offsetX = -scaledMouseX + (props.lensSize / 2)
  const offsetY = -scaledMouseY + (props.lensSize / 2)

  cloneRef.value.style.left = `${offsetX}px`
  cloneRef.value.style.top = `${offsetY}px`
}

/**
 * 鼠标事件处理
 */
const handleMouseEnter = () => {
  updateContainerRect()
  isActive.value = true
  emit('zoomStart')
  // 初始化放大视图
  initZoomView()
}

const handleMouseLeave = () => {
  isActive.value = false
  emit('zoomEnd')
  // 清理资源
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!containerRef.value || !containerRect.value) return

  const rect = containerRect.value
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

/**
 * 触摸事件处理
 */
const handleTouchStart = (e: TouchEvent) => {
  updateContainerRect()
  isActive.value = true
  isTouchDevice.value = true
  emit('zoomStart')
  // 初始化放大视图
  initZoomView()
  handleTouchMove(e)
}

const handleTouchEnd = () => {
  isActive.value = false
  emit('zoomEnd')
  // 清理资源
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!containerRef.value || !containerRect.value || !isActive.value) return

  e.preventDefault()
  const touch = e.touches[0]
  const rect = containerRect.value
  mouseX.value = touch.clientX - rect.left
  mouseY.value = touch.clientY - rect.top
}

/**
 * 监听窗口大小变化
 */
const handleResize = () => {
  updateContainerRect()
  if (isActive.value) {
    initZoomView()
  }
}
</script>

<template>
  <div class="magnifier-container">
    <div
        ref="containerRef"
        class="magnifier-content"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousemove="handleMouseMove"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @touchmove="handleTouchMove"
        @touchcancel="handleTouchEnd">
      <div
          ref="lensRef"
          class="magnifier-lens"
          :style="lensStyle"
      ></div>

      <slot></slot>
    </div>

    <!-- 放大视图窗口 -->
    <div
        ref="zoomViewRef"
        class="magnifier-zoom-view"
        :style="zoomViewStyle">
    </div>
  </div>
</template>

<style scoped lang="less">
.magnifier-container {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
}

.magnifier-content {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  overflow: hidden;

  // 设备优化
  :deep(*) {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}

.magnifier-lens {
  position: absolute;
  border: 2px solid var(--main-color);
  border-radius: 50%;
  background: hsl(from var(--main-color) h s l / .1);
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(1px);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 2px;
    background: var(--main-color);
    transform: translate(-50%, -50%);
    border-radius: 50%;
  }
}

.magnifier-zoom-view {
  position: absolute;
  background: #000000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  overflow: hidden;
  border-radius: 4px;
  pointer-events: none;

  &[style*="top"] {
    margin-top: 10px;
  }

  &[style*="bottom"] {
    margin-bottom: 10px;
  }

  &[style*="left"] {
    margin-left: 10px;
  }

  &[style*="right"] {
    margin-right: 10px;
  }
}

@media (max-width: 768px) {
  .magnifier-lens {
    border-width: 1px;
  }

  .magnifier-zoom-view {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
}

// 动画效果
.magnifier-lens {
  transition: all 0.1s ease;
}

.magnifier-zoom-view {
  transition: opacity 0.3s ease;

  &:not([style*="display: none"]) {
    animation: zoomIn 0.3s ease;
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
