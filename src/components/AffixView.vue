<template>
  <div class="nail-widget" :class="[directionClass]">
    <div class="main-content pl-5" ref="mainContentRef">
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
  offsetTop?: number
  offsetBottom?: number
  affixBgClass?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'left',
  offsetTop: 80,
  offsetBottom: 0,
  affixBgClass: '',
  disabled: false
})

const mainContentRef = ref<HTMLElement>()
const nailAreaRef = ref<HTMLElement>()
const nailContainerRef = ref<HTMLElement>()

const isFixed = ref(false)
const isAbsolute = ref(false)
const originalPosition = ref({top: 0, left: 0, width: 0})
const fixedLeft = ref(0)

const directionClass = computed(() => `direction-${props.direction}`)

const nailStyle = computed(() => {
  const style: any = {}

  if (!props.disabled) {
    if (isFixed.value) {
      style.position = 'fixed'
      style.top = `${props.offsetTop}px`
      style.left = `${fixedLeft.value}px`
      style.width = `${originalPosition.value.width}px`
      return style
    }
    if (isAbsolute.value) {
      style.position = 'absolute'
      style.bottom = `${props.offsetBottom}px`
      style.top = 'auto'
      style.left = '0'
      style.width = `${originalPosition.value.width}px`
      return style
    }
  }

  style.position = 'relative'
  style.top = '0'
  style.left = '0'
  style.width = '100%'
  return style
})

/**
 * 获取元素的原始位置，并设置 nail-area 的宽度
 */
const getOriginalPosition = () => {
  if (!nailAreaRef.value || !nailContainerRef.value) return

  const rect = nailAreaRef.value.getBoundingClientRect()
  // 关键：若元素处于隐藏状态（例如祖先元素使用 v-show / display: none），尺寸均为 0
  // 不记录虚假零坐标，否则会导致 fixedTriggerPoint 算错，误触发固定定位导致标题错位
  if (rect.width === 0 && rect.height === 0) {
    return
  }

  // 仅在未处于固定/绝对定位时锁定 nailArea 的物理宽度，避免脱离文档流后宽度塌陷
  if (!isFixed.value && !isAbsolute.value) {
    const nailContainerRect = nailContainerRef.value.getBoundingClientRect()
    const nailWidth = nailContainerRect.width
    if (nailWidth > 0) {
      nailAreaRef.value.style.width = `${nailWidth}px`
      originalPosition.value.width = nailWidth
    }
  }

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  if (!isFixed.value && !isAbsolute.value) {
    originalPosition.value.top = rect.top + scrollTop
    originalPosition.value.left = rect.left + scrollLeft
    if (rect.width > 0) {
      originalPosition.value.width = rect.width
    }
  }
  fixedLeft.value = rect.left
}

/**
 * 检查是否需要固定
 */
const checkPosition = () => {
  if (props.disabled) {
    isFixed.value = false
    isAbsolute.value = false
    return
  }

  if (!mainContentRef.value || !nailAreaRef.value || !nailContainerRef.value) return

  const areaRect = nailAreaRef.value.getBoundingClientRect()
  // 隐藏状态下直接重置并返回，不参与吸顶定位计算
  if (areaRect.width === 0 && areaRect.height === 0) {
    isFixed.value = false
    isAbsolute.value = false
    return
  }

  // 实时更新占位容器 nailAreaRef 在视口中的当前 X 坐标，完全避免 Windows 滚动条等造成的水平偏移
  fixedLeft.value = areaRect.left

  if (originalPosition.value.top === 0 || originalPosition.value.width === 0) {
    getOriginalPosition()
  }

  // 若仍无法取得有效真实物理坐标（如初始隐藏未完全展示），暂不激活吸顶
  if (originalPosition.value.top === 0) {
    isFixed.value = false
    isAbsolute.value = false
    return
  }

  const mainRect = mainContentRef.value.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  const nailOriginalTop = originalPosition.value.top
  const nailHeight = nailContainerRef.value.offsetHeight * 1.2

  const mainContentBottom = mainRect.bottom + scrollTop

  const fixedTriggerPoint = nailOriginalTop - props.offsetTop
  const absoluteTriggerPoint = mainContentBottom - nailHeight - props.offsetBottom

  const currentScroll = scrollTop

  if (currentScroll >= fixedTriggerPoint) {
    if (currentScroll < absoluteTriggerPoint) {
      isFixed.value = true
      isAbsolute.value = false
    } else {
      isFixed.value = false
      isAbsolute.value = true
    }
  } else {
    isFixed.value = false
    isAbsolute.value = false
  }
}

let animationFrameId: number | null = null
const requestCheck = () => {
  if (animationFrameId !== null) return
  animationFrameId = requestAnimationFrame(() => {
    checkPosition()
    animationFrameId = null
  })
}

const handleScroll = () => {
  requestCheck()
}

const handleResize = () => {
  getOriginalPosition()
  requestCheck()
}

let intersectionObserver: IntersectionObserver | null = null

const init = () => {
  getOriginalPosition()
  checkPosition()

  window.addEventListener('scroll', handleScroll, {passive: true})
  window.addEventListener('resize', handleResize)

  // 监听元素可见性变动（例如上层 v-show 切换、Tab 切换）
  if (typeof IntersectionObserver !== 'undefined' && nailAreaRef.value) {
    intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          getOriginalPosition()
          checkPosition()
        }
      }
    })
    intersectionObserver.observe(nailAreaRef.value)
  }

  setTimeout(() => {
    getOriginalPosition()
    checkPosition()
  }, 100)
  setTimeout(() => {
    getOriginalPosition()
    checkPosition()
  }, 300)
}

const cleanup = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
}

watch(() => [props.direction, props.offsetTop, props.offsetBottom, props.disabled], () => {
  if (props.disabled) {
    isFixed.value = false
    isAbsolute.value = false
  } else {
    nextTick(() => {
      getOriginalPosition()
      checkPosition()
    })
  }
}, {deep: true})

onMounted(() => {
  nextTick(() => {
    init()
  })
})

onUnmounted(() => {
  cleanup()
})

defineOptions({ name: 'AffixView' })
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
