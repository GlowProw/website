<template>
  <div class="horizontal-scroll-container">
    <!-- 左侧滚动按钮 S -->
    <v-btn
        icon
        v-if="showControls && canScrollLeft"
        class="scroll-button scroll-button--left bg-amber text-black"
        @click="scrollLeft"
        :size="btnSize"
        :aria-label="leftButtonAriaLabel">
      <slot name="left-button">
        <v-icon>mdi-arrow-left-thin</v-icon>
      </slot>
    </v-btn>
    <!-- 左侧滚动按钮 E -->

    <!-- 主要滚动区域 S -->
    <div
        ref="scrollWrapper"
        class="scroll-wrapper"
        :class="{
        'scroll-wrapper--grabbing': isDragging,
        'scroll-wrapper--hide-scrollbar': hideScrollbar
      }"
        :style="wrapperStyle"
        @mousedown="handleMouseDown"
        @wheel.passive="handleWheel"
        @scroll="handleScroll"
    >
      <div
          class="scroll-content"
          :style="contentStyle"
      >
        <slot></slot>
      </div>
    </div>
    <!-- 主要滚动区域 E -->

    <!-- 右侧滚动按钮 S -->
    <v-btn
        icon
        v-if="showControls && canScrollRight"
        class="scroll-button scroll-button--right  bg-amber text-black"
        @click="scrollRight"
        :size="btnSize"
        :aria-label="rightButtonAriaLabel">
      <slot name="right-button">
        <v-icon>mdi-arrow-right-thin</v-icon>
      </slot>
    </v-btn>
    <!-- 右侧滚动按钮 E -->

    <!-- 滚动指示器 S -->
    <div
        v-if="isIndicator && showScrollIndicator && maxScroll > 0"
        class="scroll-indicator">
      <div
          class="scroll-track"
          @click="handleTrackClick">
        <div
            class="scroll-thumb"
            :style="thumbStyle"></div>
      </div>
    </div>
    <!-- 滚动指示器 E -->
  </div>
</template>

<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref} from 'vue'

const props = defineProps({
  btnSize: {
    type: Number,
    default: 45
  },
  isIndicator: {
    type: Boolean,
    default: true
  },
  // 滚动项间距
  gap: {
    type: Number,
    default: 16
  },
  // 是否显示控制按钮
  showControls: {
    type: Boolean,
    default: true
  },
  // 是否显示滚动指示器
  showScrollIndicator: {
    type: Boolean,
    default: true
  },
  // 是否隐藏原生滚动条
  hideScrollbar: {
    type: Boolean,
    default: true
  },
  // 滚动步长（像素）
  scrollStep: {
    type: Number,
    default: 1000
  },
  // 左侧按钮无障碍标签
  leftButtonAriaLabel: {
    type: String,
    default: '向左滚动'
  },
  // 右侧按钮无障碍标签
  rightButtonAriaLabel: {
    type: String,
    default: '向右滚动'
  },
  // 是否启用鼠标滚轮横向滚动
  wheelScroll: {
    type: Boolean,
    default: true
  },
  // 拖拽灵敏度
  dragSensitivity: {
    type: Number,
    default: 2
  },
  // 使用 requestAnimationFrame 优化
  useRAF: {
    type: Boolean,
    default: true
  },
  // 是否启用 Shift 键切换横向滚动
  useShiftKey: {
    type: Boolean,
    default: true
  },
  // 横向滚动灵敏度
  wheelSensitivity: {
    type: Number,
    default: 0.5
  },
  // 强制启用拖拽（即使没有滚动条）
  forceDraggable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['scroll', 'scroll-start', 'scroll-end'])

const scrollWrapper = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const startScrollLeft = ref(0)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const scrollPosition = ref(0)
const maxScroll = ref(0)
const canScrollHorizontally = ref(false) // 新增：是否可以水平滚动

const rafId = ref(null)
const lastScrollTime = ref(0)
const SCROLL_THROTTLE = 16 // ~60fps

const wrapperStyle = computed(() => ({
  gap: `${props.gap}px`
}))

const contentStyle = computed(() => ({
  gap: `${props.gap}px`
}))

const thumbStyle = computed(() => ({
  width: maxScroll.value > 0 ? `${(scrollPosition.value / maxScroll.value) * 100}%` : '0%'
}))


/**
 * 生命周期
 */
onMounted(() => {
  nextTick(() => {
    checkScrollability()
    window.addEventListener('resize', checkScrollability)
  })
})

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // 清理 RAF
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
  }

  window.removeEventListener('resize', checkScrollability)
})

/**
 * 检查滚动状态
 */
const checkScrollability = () => {
  if (!scrollWrapper.value) return

  const {scrollLeft, scrollWidth, clientWidth} = scrollWrapper.value
  maxScroll.value = Math.max(0, scrollWidth - clientWidth)
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < maxScroll.value
  scrollPosition.value = scrollLeft
  // 关键修复：检查是否真的可以水平滚动
  canScrollHorizontally.value = scrollWidth > clientWidth

  emit('scroll', {
    scrollLeft,
    scrollWidth,
    clientWidth,
    maxScroll: maxScroll.value,
    canScrollLeft: canScrollLeft.value,
    canScrollRight: canScrollRight.value,
    canScrollHorizontally: canScrollHorizontally.value
  })
}

/**
 * 滚动函数
 * @param position
 */
const smoothScrollTo = (position) => {
  if (!scrollWrapper.value) return

  if (props.useRAF) {
    cancelAnimationFrame(rafId.value)
    rafId.value = requestAnimationFrame(() => {
      scrollWrapper.value.scrollLeft = position
    })
  } else {
    scrollWrapper.value.scrollLeft = position
  }
}

/**
 * 鼠标拖拽功能 - 修复版本
 * @param e
 */
const handleMouseDown = (e) => {
  if (e.button !== 0) return // 只响应左键

  // 关键修复：即使没有滚动条也允许拖拽
  if (!props.forceDraggable && !canScrollHorizontally.value) {
    return // 如果强制拖拽关闭且不能水平滚动，则不处理
  }

  isDragging.value = true
  startX.value = e.clientX
  startScrollLeft.value = scrollWrapper.value.scrollLeft
  scrollWrapper.value.style.scrollBehavior = 'auto'
  scrollWrapper.value.style.cursor = 'grabbing'

  // 添加全局事件监听，避免在移动时移出容器导致事件丢失
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  emit('scroll-start', {position: startScrollLeft.value})
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return

  e.preventDefault()

  // 节流处理，避免过于频繁的更新
  const now = Date.now()
  if (now - lastScrollTime.value < SCROLL_THROTTLE) {
    return
  }
  lastScrollTime.value = now

  const deltaX = e.clientX - startX.value
  const newScrollLeft = startScrollLeft.value - deltaX * props.dragSensitivity

  // 关键修复：简化边界检查，即使没有滚动条也允许拖拽
  let boundedScrollLeft = newScrollLeft

  // 只有在真正可以水平滚动时才进行边界检查
  if (canScrollHorizontally.value) {
    boundedScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll.value))
  } else {
    // 如果没有水平滚动空间，限制拖拽范围，提供弹性效果
    boundedScrollLeft = Math.max(-50, Math.min(newScrollLeft, 50)) // 小范围弹性
  }

  smoothScrollTo(boundedScrollLeft)
}

const handleMouseUp = () => {
  if (!isDragging.value) return

  isDragging.value = false

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // 取消 RAF
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
    rafId.value = null
  }

  if (scrollWrapper.value) {
    scrollWrapper.value.style.scrollBehavior = 'smooth'
    scrollWrapper.value.style.cursor = 'grab'

    // 关键修复：如果没有水平滚动空间，恢复原位
    if (!canScrollHorizontally.value) {
      scrollWrapper.value.scrollLeft = 0
    }
  }

  emit('scroll-end', {position: scrollWrapper.value?.scrollLeft || 0})
}

/**
 * 鼠标滚轮处理
 * @param e
 */
const handleWheel = (e) => {
  // 如果禁用了滚轮横向滚动，直接返回
  if (!props.wheelScroll) return

  // 使用节流避免过于频繁的滚动
  const now = Date.now()
  if (now - lastScrollTime.value < SCROLL_THROTTLE) {
    return
  }
  lastScrollTime.value = now

  // 方案1: 只在按住 Shift 键时进行横向滚动
  if (props.useShiftKey) {
    if (e.shiftKey) {
      // 按住 Shift 键时进行横向滚动
      e.preventDefault()
      const delta = e.deltaY * props.wheelSensitivity
      const newScrollLeft = scrollWrapper.value.scrollLeft + delta
      smoothScrollTo(newScrollLeft)
    }
    // 不按 Shift 键时允许正常的垂直滚动
    return
  }

  // 方案2: 智能检测
  const canScrollVertically = scrollWrapper.value.scrollHeight > scrollWrapper.value.clientHeight

  if (!canScrollVertically || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    // 如果没有垂直滚动空间或者主要是水平滚动，进行横向滚动
    e.preventDefault()
    const delta = (e.deltaX !== 0 ? e.deltaX : e.deltaY) * props.wheelSensitivity
    const newScrollLeft = scrollWrapper.value.scrollLeft + delta
    smoothScrollTo(newScrollLeft)
  }
  // 否则允许正常的垂直滚动
}

/**
 * 按钮滚动功能
 */
const scrollLeft = () => {
  if (!scrollWrapper.value || !canScrollHorizontally.value) return
  const newScrollLeft = Math.max(0, scrollWrapper.value.scrollLeft - props.scrollStep)
  scrollWrapper.value.scrollTo({
    left: newScrollLeft,
    behavior: 'smooth'
  })
}

const scrollRight = () => {
  if (!scrollWrapper.value || !canScrollHorizontally.value) return
  const newScrollLeft = Math.min(maxScroll.value, scrollWrapper.value.scrollLeft + props.scrollStep)
  scrollWrapper.value.scrollTo({
    left: newScrollLeft,
    behavior: 'smooth'
  })
}

/**
 * 滚动指示器点击
 * @param e
 */
const handleTrackClick = (e) => {
  if (!scrollWrapper.value || maxScroll.value <= 0) return

  const track = e.currentTarget
  const clickX = e.offsetX
  const trackWidth = track.offsetWidth
  const newPosition = (clickX / trackWidth) * maxScroll.value

  scrollWrapper.value.scrollTo({
    left: newPosition,
    behavior: 'smooth'
  })
}

/**
 * 处理滚动事件
 */
const handleScroll = () => {
  checkScrollability()
}

/**
 * 公共方法
 * @param position
 * @param behavior
 */
const scrollTo = (position, behavior = 'smooth') => {
  if (!scrollWrapper.value) return
  scrollWrapper.value.scrollTo({
    left: position,
    behavior
  })
}

/**
 * 滚到对应容器
 * @param index
 * @param behavior
 */
const scrollToItem = (index, behavior = 'smooth') => {
  if (!scrollWrapper.value) return

  nextTick(() => {
    const items = scrollWrapper.value.querySelectorAll('.scroll-content > *')
    if (items[index]) {
      const item = items[index]
      const scrollLeft = item.offsetLeft - scrollWrapper.value.offsetLeft
      scrollWrapper.value.scrollTo({
        left: scrollLeft,
        behavior
      })
    }
  })
}

defineExpose({
  scrollTo,
  scrollToItem,
  scrollLeft,
  scrollRight,
  checkScrollability,
  getScrollState: () => ({
    scrollLeft: scrollPosition.value,
    canScrollLeft: canScrollLeft.value,
    canScrollRight: canScrollRight.value,
    maxScroll: maxScroll.value,
    canScrollHorizontally: canScrollHorizontally.value
  })
})
</script>

<style scoped lang="less">
.horizontal-scroll-container {
  position: relative;
  width: 100%;
  transform: translateZ(0);
  will-change: transform;
}

.scroll-wrapper {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  cursor: grab;
  user-select: none;
  padding: 8px 0;
  -webkit-overflow-scrolling: touch;
  backface-visibility: hidden;
  perspective: 1000;
}

.scroll-wrapper--grabbing {
  cursor: grabbing;
  scroll-behavior: auto;
  overscroll-behavior: contain;
}

.scroll-wrapper--hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-wrapper--hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.scroll-content {
  display: flex;
  flex-wrap: nowrap;
  min-width: min-content;
  transform: translateZ(0);
  will-change: transform;
}

.scroll-button {
  position: absolute;
  top: 50%;
  background: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  color: #333;
  transform: translateY(-50%) translateZ(0);
}

.scroll-button:hover {
  background: #f0f0f0;
  transform: translateY(-50%) scale(1.05);
}

.scroll-button:active {
  transform: translateY(-50%) scale(0.95);
}

.scroll-button--left {
  left: 20px;
}

.scroll-button--right {
  right: 20px;
}

.scroll-indicator {
  margin-top: 12px;
  margin-bottom: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.scroll-track {
  width: 80%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease;
}

.scroll-track:hover {
  background: #d0d0d0;
}

.scroll-thumb {
  height: 100%;
  background: var(--main-color);
  border-radius: 2px;
  transition: width 0.1s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .scroll-button {
    display: none;
  }

  .scroll-track {
    width: 100%;
  }

  .scroll-wrapper {
    -webkit-overflow-scrolling: touch;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .scroll-button {
    background: #333;
    color: white;
  }

  .scroll-button:hover {
    background: #444;
  }

  .scroll-track {
    background: #444;
  }

  .scroll-track:hover {
    background: #555;
  }
}

.scroll-wrapper--performance {
  transform: translateZ(0);
  will-change: scroll-position;
}

.scroll-content--performance {
  transform: translateZ(0);
  will-change: transform;
}
</style>
