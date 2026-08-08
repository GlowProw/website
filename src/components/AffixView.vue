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
    style.width = `${originalPosition.value.width}px`

    if (props.direction === 'left') {
      style.left = `${originalPosition.value.left}px`
    } else {
      const left = originalPosition.value.left
      style.right = `${window.innerWidth - left - originalPosition.value.width}px`
    }
  } else if (isAbsolute.value) {
    style.position = 'absolute'
    style.bottom = `${props.offsetBottom}px`
    style.top = 'auto'
    style.width = `${originalPosition.value.width}px`

    if (props.direction === 'left') {
      style.left = '0'
    } else {
      style.right = '0'
    }
  } else {
    style.position = 'relative'
    style.top = '0'
    style.left = '0'
    style.width = '100%'
  }

  return style
})

/**
 * 获取元素的原始位置，并设置 nail-area 的宽度
 */
const getOriginalPosition = () => {
  if (!nailAreaRef.value || !nailContainerRef.value) return

  const nailContainerRect = nailContainerRef.value.getBoundingClientRect()
  const nailWidth = nailContainerRect.width

  nailAreaRef.value.style.width = `${nailWidth}px`

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

const handleScroll = () => {
  checkPosition()
}

const handleResize = () => {
  getOriginalPosition()
  checkPosition()
}

const init = () => {
  getOriginalPosition()
  checkPosition()

  window.addEventListener('scroll', handleScroll, {passive: true})
  window.addEventListener('resize', handleResize)

  setTimeout(() => {
    checkPosition()
  }, 100)
}

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
