<template>
  <div
      class="scroll-container"
      :class="[
      isVertical ? 'scroll-container--vertical' : 'scroll-container--horizontal'
    ]"
      :style="containerStyle"
      ref="containerRef"
  >
    <!-- 上/左侧滚动按钮 S -->
    <v-btn
        icon
        v-if="showControls && canScrollPrev"
        :class="[
        'scroll-button',
        isVertical ? 'scroll-button--top' : 'scroll-button--left',
        'bg-amber text-black',
        {'scroll-button--sticky': isFollowScreenCenter}
      ]"
        :style="buttonPrevStyle"
        @click="scrollPrev"
        :size="btnSize"
        :aria-label="effectivePrevAriaLabel"
    >
      <slot name="prev-button">
        <slot name="left-button">
          <slot name="top-button">
            <v-icon :icon="isVertical ? 'mdi-chevron-up' : 'mdi-arrow-left-thin'"></v-icon>
          </slot>
        </slot>
      </slot>
    </v-btn>
    <!-- 上/左侧滚动按钮 E -->

    <!-- 主要滚动区域 S -->
    <div
        ref="scrollWrapper"
        class="scroll-wrapper"
        :class="{
        'scroll-wrapper--vertical': isVertical,
        'scroll-wrapper--horizontal': !isVertical,
        'scroll-wrapper--draggable': forceDraggable && canScroll,
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
          :class="{ 'scroll-content--vertical': isVertical, 'scroll-content--horizontal': !isVertical }"
          :style="contentStyle"
      >
        <slot></slot>
      </div>
    </div>
    <!-- 主要滚动区域 E -->

    <!-- 下/右侧滚动按钮 S -->
    <v-btn
        icon
        v-if="showControls && canScrollNext"
        :class="[
        'scroll-button',
        isVertical ? 'scroll-button--bottom' : 'scroll-button--right',
        'bg-amber text-black',
        {'scroll-button--sticky': isFollowScreenCenter}
      ]"
        :style="buttonNextStyle"
        @click="scrollNext"
        :size="btnSize"
        :aria-label="effectiveNextAriaLabel"
    >
      <slot name="next-button">
        <slot name="right-button">
          <slot name="bottom-button">
            <v-icon :icon="isVertical ? 'mdi-chevron-down' : 'mdi-arrow-right-thin'"></v-icon>
          </slot>
        </slot>
      </slot>
    </v-btn>
    <!-- 下/右侧滚动按钮 E -->

    <!-- 滚动指示器 S -->
    <div
        v-if="isIndicator && showScrollIndicator && maxScroll > 0"
        :class="[
        'scroll-indicator',
        isVertical ? 'scroll-indicator--vertical' : 'scroll-indicator--horizontal'
      ]"
    >
      <div
          class="scroll-track"
          :class="{ 'scroll-track--vertical': isVertical, 'scroll-track--horizontal': !isVertical }"
          @click="handleTrackClick"
      >
        <div
            class="scroll-thumb"
            :class="{ 'scroll-thumb--vertical': isVertical, 'scroll-thumb--horizontal': !isVertical }"
            :style="thumbStyle"
        ></div>
      </div>
    </div>
    <!-- 滚动指示器 E -->
  </div>
</template>

<script setup lang="ts">
import { computed, CSSProperties, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

export interface ScrollListProps {
  direction?: 'horizontal' | 'vertical'
  btnSize?: number
  isIndicator?: boolean
  gap?: number
  showControls?: boolean
  showScrollIndicator?: boolean
  hideScrollbar?: boolean
  scrollStep?: number
  prevButtonAriaLabel?: string
  nextButtonAriaLabel?: string
  leftButtonAriaLabel?: string
  rightButtonAriaLabel?: string
  wheelScroll?: boolean
  dragSensitivity?: number
  useRAF?: boolean
  useShiftKey?: boolean
  wheelSensitivity?: number
  forceDraggable?: boolean
  isFollowScreenCenter?: boolean
  followScreenSafeDistance?: number
  height?: string | number
  maxHeight?: string | number
  width?: string | number
}

export interface ScrollState {
  scrollPosition: number
  scrollLeft: number
  scrollTop: number
  canScrollPrev: boolean
  canScrollNext: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
  canScrollUp: boolean
  canScrollDown: boolean
  maxScroll: number
  canScroll: boolean
  canScrollHorizontally: boolean
  canScrollVertically: boolean
}

const props = withDefaults(defineProps<ScrollListProps>(), {
  direction: 'horizontal',
  btnSize: 45,
  isIndicator: true,
  gap: 0,
  showControls: true,
  showScrollIndicator: true,
  hideScrollbar: true,
  scrollStep: 1000,
  prevButtonAriaLabel: '',
  nextButtonAriaLabel: '',
  leftButtonAriaLabel: '',
  rightButtonAriaLabel: '',
  wheelScroll: true,
  dragSensitivity: 2,
  useRAF: true,
  useShiftKey: undefined,
  wheelSensitivity: 0.5,
  forceDraggable: true,
  isFollowScreenCenter: false,
  followScreenSafeDistance: 200,
  height: '',
  maxHeight: '',
  width: ''
})

const emit = defineEmits<{
  (e: 'scroll', payload: any): void
  (e: 'scroll-start', payload: { position: number }): void
  (e: 'scroll-end', payload: { position: number }): void
}>()

const isVertical = computed(() => props.direction === 'vertical')

const effectiveUseShiftKey = computed(() => {
  if (props.useShiftKey !== undefined) return props.useShiftKey
  return !isVertical.value
})

const effectivePrevAriaLabel = computed(() => {
  if (props.prevButtonAriaLabel) return props.prevButtonAriaLabel
  if (props.leftButtonAriaLabel) return props.leftButtonAriaLabel
  return isVertical.value ? '向上滚动' : '向左滚动'
})

const effectiveNextAriaLabel = computed(() => {
  if (props.nextButtonAriaLabel) return props.nextButtonAriaLabel
  if (props.rightButtonAriaLabel) return props.rightButtonAriaLabel
  return isVertical.value ? '向下滚动' : '向右滚动'
})

const scrollWrapper = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const startPos = ref(0)
const startScrollPos = ref(0)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)
const scrollPosition = ref(0)
const maxScroll = ref(0)
const canScroll = ref(false)
const buttonOffset = ref(0)

const rafId = ref<number | null>(null)
const lastScrollTime = ref(0)
const SCROLL_THROTTLE = 16 // ~60fps

const containerStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  if (props.maxHeight) {
    style.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  }
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  return style
})

const wrapperStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    gap: `${props.gap}px`
  }

  if (canScroll.value) {
    if (isVertical.value) {
      const topStop = canScrollPrev.value ? 'transparent 0%, black 5%' : 'black 0%'
      const bottomStop = canScrollNext.value ? 'black 95%, transparent 100%' : 'black 100%'
      const maskValue = `linear-gradient(to bottom, ${topStop}, ${bottomStop})`
      style.maskImage = maskValue
      style.WebkitMaskImage = maskValue
    } else {
      const leftStop = canScrollPrev.value ? 'transparent 0%, black 5%' : 'black 0%'
      const rightStop = canScrollNext.value ? 'black 95%, transparent 100%' : 'black 100%'
      const maskValue = `linear-gradient(to right, ${leftStop}, ${rightStop})`
      style.maskImage = maskValue
      style.WebkitMaskImage = maskValue
    }
  }

  return style
})

const contentStyle = computed<CSSProperties>(() => ({
  gap: `${props.gap}px`
}))

const thumbStyle = computed<CSSProperties>(() => {
  const pct = maxScroll.value > 0 ? (scrollPosition.value / maxScroll.value) * 100 : 0
  return isVertical.value ? { height: `${pct}%` } : { width: `${pct}%` }
})

const buttonPrevStyle = computed<CSSProperties>(() => {
  if (!props.isFollowScreenCenter) return {}
  return isVertical.value ? { left: buttonOffset.value + 'px' } : { top: buttonOffset.value + 'px' }
})

const buttonNextStyle = computed<CSSProperties>(() => {
  if (!props.isFollowScreenCenter) return {}
  return isVertical.value ? { left: buttonOffset.value + 'px' } : { top: buttonOffset.value + 'px' }
})

/**
 * 生命周期
 */
onMounted(() => {
  nextTick(() => {
    checkScrollability()
    window.addEventListener('resize', checkScrollability)

    if (props.isFollowScreenCenter) {
      window.addEventListener('scroll', updateButtonPosition, { passive: true })
      window.addEventListener('resize', updateButtonPosition)
      updateButtonPosition()
    }
  })
})

watch(() => props.isFollowScreenCenter, (val) => {
  if (val) {
    window.addEventListener('scroll', updateButtonPosition, { passive: true })
    window.addEventListener('resize', updateButtonPosition)
    updateButtonPosition()
  } else {
    window.removeEventListener('scroll', updateButtonPosition)
    window.removeEventListener('resize', updateButtonPosition)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  window.removeEventListener('resize', checkScrollability)

  if (props.isFollowScreenCenter) {
    window.removeEventListener('scroll', updateButtonPosition)
    window.removeEventListener('resize', updateButtonPosition)
  }
})

/**
 * 检查滚动状态
 */
const checkScrollability = () => {
  if (!scrollWrapper.value) return

  if (isVertical.value) {
    const { scrollTop, scrollHeight, clientHeight } = scrollWrapper.value
    maxScroll.value = Math.max(0, scrollHeight - clientHeight)
    canScrollPrev.value = scrollTop > 0
    canScrollNext.value = scrollTop < maxScroll.value
    scrollPosition.value = scrollTop
    canScroll.value = scrollHeight > clientHeight
  } else {
    const { scrollLeft, scrollWidth, clientWidth } = scrollWrapper.value
    maxScroll.value = Math.max(0, scrollWidth - clientWidth)
    canScrollPrev.value = scrollLeft > 0
    canScrollNext.value = scrollLeft < maxScroll.value
    scrollPosition.value = scrollLeft
    canScroll.value = scrollWidth > clientWidth
  }

  emit('scroll', {
    scrollPosition: scrollPosition.value,
    scrollLeft: isVertical.value ? 0 : scrollPosition.value,
    scrollTop: isVertical.value ? scrollPosition.value : 0,
    maxScroll: maxScroll.value,
    canScrollPrev: canScrollPrev.value,
    canScrollNext: canScrollNext.value,
    canScrollLeft: isVertical.value ? false : canScrollPrev.value,
    canScrollRight: isVertical.value ? false : canScrollNext.value,
    canScrollUp: isVertical.value ? canScrollPrev.value : false,
    canScrollDown: isVertical.value ? canScrollNext.value : false,
    canScroll: canScroll.value,
    canScrollHorizontally: !isVertical.value && canScroll.value,
    canScrollVertically: isVertical.value && canScroll.value
  })
}

/**
 * 更新按钮在容器内的相对位置，使其跟随屏幕中心
 */
const updateButtonPosition = () => {
  if (!containerRef.value || !props.isFollowScreenCenter) return

  const rect = containerRef.value.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = window.innerWidth

  if (isVertical.value) {
    const viewportCenter = vw / 2
    let targetLeft = viewportCenter - rect.left
    const margin = props.btnSize / 2
    const minLeft = margin + props.followScreenSafeDistance
    const maxLeft = rect.width - margin - props.followScreenSafeDistance
    if (minLeft > maxLeft) {
      buttonOffset.value = rect.width / 2
    } else {
      buttonOffset.value = Math.max(minLeft, Math.min(maxLeft, targetLeft))
    }
  } else {
    const viewportCenter = vh / 2
    let targetTop = viewportCenter - rect.top
    const margin = props.btnSize / 2
    const minTop = margin + props.followScreenSafeDistance
    const maxTop = rect.height - margin - props.followScreenSafeDistance
    if (minTop > maxTop) {
      buttonOffset.value = rect.height / 2
    } else {
      buttonOffset.value = Math.max(minTop, Math.min(maxTop, targetTop))
    }
  }
}

/**
 * 滚动函数
 */
const smoothScrollTo = (position: number) => {
  if (!scrollWrapper.value) return

  const scrollProp = isVertical.value ? 'scrollTop' : 'scrollLeft'

  if (props.useRAF) {
    if (rafId.value !== null) {
      cancelAnimationFrame(rafId.value)
    }
    rafId.value = requestAnimationFrame(() => {
      if (scrollWrapper.value) {
        scrollWrapper.value[scrollProp] = position
      }
    })
  } else {
    scrollWrapper.value[scrollProp] = position
  }
}

/**
 * 鼠标拖拽功能
 */
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return // 只响应左键

  if (!props.forceDraggable && !canScroll.value) {
    return
  }

  if (!scrollWrapper.value) return

  isDragging.value = true
  startPos.value = isVertical.value ? e.clientY : e.clientX
  startScrollPos.value = isVertical.value ? scrollWrapper.value.scrollTop : scrollWrapper.value.scrollLeft
  scrollWrapper.value.style.scrollBehavior = 'auto'
  scrollWrapper.value.style.cursor = 'grabbing'

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  emit('scroll-start', { position: startScrollPos.value })
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return

  e.preventDefault()

  const now = Date.now()
  if (now - lastScrollTime.value < SCROLL_THROTTLE) {
    return
  }
  lastScrollTime.value = now

  const currentPos = isVertical.value ? e.clientY : e.clientX
  const delta = currentPos - startPos.value
  const newScrollPos = startScrollPos.value - delta * props.dragSensitivity

  let boundedScrollPos = newScrollPos

  if (canScroll.value) {
    boundedScrollPos = Math.max(0, Math.min(newScrollPos, maxScroll.value))
  } else {
    boundedScrollPos = Math.max(-50, Math.min(newScrollPos, 50))
  }

  smoothScrollTo(boundedScrollPos)
}

const handleMouseUp = () => {
  if (!isDragging.value) return

  isDragging.value = false

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  if (rafId.value !== null) {
    cancelAnimationFrame(rafId.value)
    rafId.value = null
  }

  if (scrollWrapper.value) {
    scrollWrapper.value.style.scrollBehavior = 'smooth'
    scrollWrapper.value.style.cursor = props.forceDraggable && canScroll.value ? 'grab' : 'default'

    if (!canScroll.value) {
      if (isVertical.value) {
        scrollWrapper.value.scrollTop = 0
      } else {
        scrollWrapper.value.scrollLeft = 0
      }
    }
  }

  emit('scroll-end', {
    position: scrollWrapper.value ? (isVertical.value ? scrollWrapper.value.scrollTop : scrollWrapper.value.scrollLeft) : 0
  })
}

/**
 * 鼠标滚轮处理
 */
const handleWheel = (e: WheelEvent) => {
  if (!props.wheelScroll || !scrollWrapper.value) return

  const now = Date.now()
  if (now - lastScrollTime.value < SCROLL_THROTTLE) {
    return
  }
  lastScrollTime.value = now

  if (isVertical.value) {
    // 垂直滚动模式
    if (canScroll.value) {
      e.preventDefault()
      const delta = e.deltaY * props.wheelSensitivity
      const newScrollTop = scrollWrapper.value.scrollTop + delta
      smoothScrollTo(newScrollTop)
    }
    return
  }

  // 水平滚动模式
  if (effectiveUseShiftKey.value) {
    if (e.shiftKey) {
      e.preventDefault()
      const delta = e.deltaY * props.wheelSensitivity
      const newScrollLeft = scrollWrapper.value.scrollLeft + delta
      smoothScrollTo(newScrollLeft)
    }
    return
  }

  const canScrollVertically = scrollWrapper.value.scrollHeight > scrollWrapper.value.clientHeight
  if (!canScrollVertically || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    e.preventDefault()
    const delta = (e.deltaX !== 0 ? e.deltaX : e.deltaY) * props.wheelSensitivity
    const newScrollLeft = scrollWrapper.value.scrollLeft + delta
    smoothScrollTo(newScrollLeft)
  }
}

/**
 * 按钮滚动功能
 */
const scrollPrev = () => {
  if (!scrollWrapper.value || !canScroll.value) return
  if (isVertical.value) {
    const newScrollTop = Math.max(0, scrollWrapper.value.scrollTop - props.scrollStep)
    scrollWrapper.value.scrollTo({ top: newScrollTop, behavior: 'smooth' })
  } else {
    const newScrollLeft = Math.max(0, scrollWrapper.value.scrollLeft - props.scrollStep)
    scrollWrapper.value.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
  }
}

const scrollNext = () => {
  if (!scrollWrapper.value || !canScroll.value) return
  if (isVertical.value) {
    const newScrollTop = Math.min(maxScroll.value, scrollWrapper.value.scrollTop + props.scrollStep)
    scrollWrapper.value.scrollTo({ top: newScrollTop, behavior: 'smooth' })
  } else {
    const newScrollLeft = Math.min(maxScroll.value, scrollWrapper.value.scrollLeft + props.scrollStep)
    scrollWrapper.value.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
  }
}

const scrollLeft = scrollPrev
const scrollRight = scrollNext
const scrollUp = scrollPrev
const scrollDown = scrollNext

/**
 * 滚动指示器点击
 */
const handleTrackClick = (e: MouseEvent) => {
  if (!scrollWrapper.value || maxScroll.value <= 0) return

  const track = e.currentTarget as HTMLElement
  if (isVertical.value) {
    const clickY = e.offsetY
    const trackHeight = track.offsetHeight
    const newPosition = (clickY / trackHeight) * maxScroll.value
    scrollWrapper.value.scrollTo({ top: newPosition, behavior: 'smooth' })
  } else {
    const clickX = e.offsetX
    const trackWidth = track.offsetWidth
    const newPosition = (clickX / trackWidth) * maxScroll.value
    scrollWrapper.value.scrollTo({ left: newPosition, behavior: 'smooth' })
  }
}

/**
 * 处理滚动事件
 */
const handleScroll = () => {
  checkScrollability()
}

/**
 * 公共方法
 */
const scrollTo = (position: number, behavior: ScrollBehavior = 'smooth') => {
  if (!scrollWrapper.value) return
  if (isVertical.value) {
    scrollWrapper.value.scrollTo({ top: position, behavior })
  } else {
    scrollWrapper.value.scrollTo({ left: position, behavior })
  }
}

const scrollToItem = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!scrollWrapper.value) return

  nextTick(() => {
    if (!scrollWrapper.value) return
    const items = scrollWrapper.value.querySelectorAll<HTMLElement>('.scroll-content > *')
    if (items[index]) {
      const item = items[index]
      if (isVertical.value) {
        const scrollTop = item.offsetTop - scrollWrapper.value.offsetTop
        scrollWrapper.value.scrollTo({ top: scrollTop, behavior })
      } else {
        const scrollLeft = item.offsetLeft - scrollWrapper.value.offsetLeft
        scrollWrapper.value.scrollTo({ left: scrollLeft, behavior })
      }
    }
  })
}

const getScrollState = (): ScrollState => ({
  scrollPosition: scrollPosition.value,
  scrollLeft: isVertical.value ? 0 : scrollPosition.value,
  scrollTop: isVertical.value ? scrollPosition.value : 0,
  canScrollPrev: canScrollPrev.value,
  canScrollNext: canScrollNext.value,
  canScrollLeft: isVertical.value ? false : canScrollPrev.value,
  canScrollRight: isVertical.value ? false : canScrollNext.value,
  canScrollUp: isVertical.value ? canScrollPrev.value : false,
  canScrollDown: isVertical.value ? canScrollNext.value : false,
  maxScroll: maxScroll.value,
  canScroll: canScroll.value,
  canScrollHorizontally: !isVertical.value && canScroll.value,
  canScrollVertically: isVertical.value && canScroll.value
})

defineOptions({
  name: 'BaseScrollList'
})

defineExpose({
  scrollTo,
  scrollToItem,
  scrollPrev,
  scrollNext,
  scrollLeft,
  scrollRight,
  scrollUp,
  scrollDown,
  checkScrollability,
  getScrollState
})
</script>

<style scoped lang="less">
.scroll-container {
  position: relative;
  transform: translateZ(0);
  will-change: transform;

  &--horizontal {
    width: 100%;
  }

  &--vertical {
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.scroll-wrapper {
  scroll-behavior: smooth;
  user-select: none;
  -webkit-overflow-scrolling: touch;
  backface-visibility: hidden;
  perspective: 1000;

  &--draggable {
    cursor: grab;
  }

  &--horizontal {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 0;
  }

  &--vertical {
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 0 0px;
    flex: 1;
  }
}

.scroll-wrapper--grabbing {
  cursor: grabbing !important;
  scroll-behavior: auto;
  overscroll-behavior: contain;
}

.scroll-wrapper--hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.scroll-content {
  display: flex;
  transform: translateZ(0);
  will-change: transform;

  &--horizontal {
    flex-direction: row;
    flex-wrap: nowrap;
    min-width: min-content;
  }

  &--vertical {
    flex-direction: column;
    flex-wrap: nowrap;
    min-height: min-content;
  }
}

.scroll-button {
  position: absolute;
  background: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
  transition: transform 0.3s ease, background 0.3s ease, opacity 0.3s ease;
  color: #333;

  &--left {
    top: 50%;
    left: 20px;
    transform: translateY(-50%) translateZ(0);
  }

  &--right {
    top: 50%;
    right: 20px;
    transform: translateY(-50%) translateZ(0);
  }

  &--top {
    left: 50%;
    top: 10px;
    transform: translateX(-50%) translateZ(0);
  }

  &--bottom {
    left: 50%;
    bottom: 10px;
    transform: translateX(-50%) translateZ(0);
  }

  &--sticky {
    transition: transform 0.3s ease, background 0.3s ease, opacity 0.3s ease, top 0s, left 0s !important;
  }

  &:hover {
    background: #f0f0f0;
  }

  &--left:hover, &--right:hover {
    transform: translateY(-50%) scale(1.05);
  }

  &--top:hover, &--bottom:hover {
    transform: translateX(-50%) scale(1.05);
  }

  &--left:active, &--right:active {
    transform: translateY(-50%) scale(0.95);
  }

  &--top:active, &--bottom:active {
    transform: translateX(-50%) scale(0.95);
  }
}

.scroll-indicator {
  display: flex;
  justify-content: center;
  align-items: center;

  &--horizontal {
    margin-top: 12px;
    margin-bottom: 20px;
    width: 100%;
  }

  &--vertical {
    position: absolute;
    right: 4px;
    top: 10%;
    height: 80%;
    width: 12px;
    pointer-events: auto;
  }
}

.scroll-track {
  background: #e0e0e0;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease;

  &--horizontal {
    width: 80%;
    height: 4px;
  }

  &--vertical {
    height: 100%;
    width: 4px;
  }

  &:hover {
    background: #d0d0d0;
  }
}

.scroll-thumb {
  background: var(--main-color, #1976D2);
  border-radius: 2px;

  &--horizontal {
    height: 100%;
    transition: width 0.1s ease;
  }

  &--vertical {
    width: 100%;
    transition: height 0.1s ease;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .scroll-button {
    display: none;
  }

  .scroll-track--horizontal {
    width: 100%;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .scroll-button {
    background: #333;
    color: white;

    &:hover {
      background: #444;
    }
  }

  .scroll-track {
    background: #444;

    &:hover {
      background: #555;
    }
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
