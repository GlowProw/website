<template>
  <div class="nail-widget" :class="[directionClass]">
    <div class="main-content pl-5" ref="mainContentRef"
         :style="`width: ${mainContentRef?.offsetWidth - mainContentRef?.offsetWidth};`">
      <slot></slot>
    </div>

    <div class="nail-area" :class="`nail-${direction} ${props?.affixBgClass}`" ref="nailAreaRef">
      <div
          class="nail-container"
          ref="nailContainerRef"
          :class="{ 'is-fixed': isFixed, 'is-absolute': isAbsolute }"
          :style="nailStyle">
        <div class="nail-content">
          <slot name="nail"></slot>
        </div>
      </div>

      <div class="nail-footer" :style="nailStyle">
        <slot name="nail-footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'

interface Props {
  direction?: 'left' | 'right'
  offsetTop?: number | string
  offsetBottom?: number | string
  affixBgClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'left',
  offsetTop: 80,
  offsetBottom: 0,
  affixBgClass: ''
})

const mainContentRef = ref<HTMLElement>()
const nailAreaRef = ref<HTMLElement>()
const nailContainerRef = ref<HTMLElement>()

const isFixed = ref(false)
const isAbsolute = ref(false)
const originalPosition = ref({top: 0, left: 0, width: 0})

const directionClass = computed(() => `direction-${props.direction}`)
const nailStyle = computed(() => {
  const style: any = {}

  if (isFixed.value) {
    style.position = 'fixed'
    style.top = `${props.offsetTop}px`
    style.width = `${originalPosition.value.width}px` // 使用 originalPosition 存储的宽度

    if (props.direction === 'left') {
      style.left = `${originalPosition.value.left}px`
    } else {
      // 对于右侧，计算相对于窗口右侧的位置
      const left = originalPosition.value.left
      style.right = `${window.innerWidth - left - originalPosition.value.width}px`
    }
  } else if (isAbsolute.value) {
    style.position = 'absolute'
    style.bottom = `${props.offsetBottom}px`
    style.top = 'auto'
    style.width = `${originalPosition.value.width}px` // 使用 originalPosition 存储的宽度

    if (props.direction === 'left') {
      style.left = '0'
    } else {
      style.right = '0'
    }
  } else {
    style.position = 'relative'
    style.top = '0'
    style.left = '0'
    style.width = '100%' // 非固定/绝对定位时使用 100% 宽度
  }

  return style
})

/**
 * 获取元素的原始位置，并设置 nail-area 的宽度
 */
const getOriginalPosition = () => {
  if (!nailAreaRef.value || !nailContainerRef.value) return

  // 1. 获取钉子内容（nail-container）的实际宽度
  const nailContainerRect = nailContainerRef.value.getBoundingClientRect()
  const nailWidth = nailContainerRect.width

  // 2. 将此宽度应用给父容器 nail-area，避免宽度坍塌
  nailAreaRef.value.style.width = `${nailWidth}px`

  // 3. 获取 nail-area 的原始位置（相对于文档）
  const rect = nailAreaRef.value.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  originalPosition.value = {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    width: rect.width
  }
}

/**
 * 检查是否需要固定
 */
const checkPosition = () => {
  if (!mainContentRef.value || !nailAreaRef.value || !nailContainerRef.value) return

  const mainRect = mainContentRef.value.getBoundingClientRect()
  // const nailRect = nailAreaRef.value.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  // 1. 获取关键尺寸和位置
  const nailOriginalTop = originalPosition.value.top
  const nailHeight = nailContainerRef.value.offsetHeight * 1.9 // 钉子内容高度

  // 主内容区底部 (文档坐标)
  const mainContentBottom = mainRect.bottom + scrollTop

  // 2. 计算触发点

  // 固定触发点：滚动条位置超过 fixedTriggerPoint 时，开始固定
  const fixedTriggerPoint = nailOriginalTop - props.offsetTop

  // 绝对定位触发点：滚动条位置超过 absoluteTriggerPoint 时，切换到绝对定位
  // 确保 nail-container 的底部在 mainContent 底部上方留出 offsetBottom 的空间
  const absoluteTriggerPoint = mainContentBottom - nailHeight - props.offsetBottom

  // 当前滚动位置
  const currentScroll = scrollTop

  // 3. 判断逻辑
  if (currentScroll >= fixedTriggerPoint) {
    // 滚动超过了固定触发点
    if (currentScroll < absoluteTriggerPoint) {
      // 还没有到达绝对定位点，应该固定
      isFixed.value = true
      isAbsolute.value = false
    } else {
      // 超过或达到了绝对定位点，应该绝对定位在底部
      isFixed.value = false
      isAbsolute.value = true
    }
  } else {
    // 还没有达到固定触发点，正常位置 (relative)
    isFixed.value = false
    isAbsolute.value = false
  }
}

/**
 * 处理滚动
 */
const handleScroll = () => {
  // scrollY.value = window.pageYOffset || document.documentElement.scrollTop // 移除未使用的状态更新
  checkPosition()
}

/**
 * 处理窗口大小变化
 */
const handleResize = () => {
  getOriginalPosition()
  checkPosition()
}

/**
 * 初始化
 */
const init = () => {
  getOriginalPosition()
  checkPosition()

  window.addEventListener('scroll', handleScroll, {passive: true})
  window.addEventListener('resize', handleResize)

  // 初始化完成后再次检查，确保 DOM 渲染完成和宽度计算准确
  setTimeout(() => {
    checkPosition()
  }, 100)
}

/**
 * 清理
 */
const cleanup = () => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
}

watch(() => [props.direction, props.offsetTop, props.offsetBottom], () => {
  nextTick(() => {
    getOriginalPosition()
    checkPosition()
  })
}, {deep: true})

onMounted(() => {
  nextTick(() => {
    init()
  })
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.nail-widget {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 200px;
}

.nail-widget.direction-left {
  flex-direction: row;
}

.nail-widget.direction-right {
  flex-direction: row-reverse;
}

.main-content {
  flex: 1;
}

.nail-area {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-content: space-between;
}

.nail-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100px;
}

.nail-container {
  z-index: 40;
  width: 100%;
}

.nail-container.is-fixed {
  position: fixed !important;
}

.nail-container.is-absolute {
  position: absolute !important;
}
</style>
