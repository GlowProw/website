<template>
  <div
      ref="wrapperRef"
      class="affix-container-wrapper"
      :style="wrapperStyle">
    <!-- 实际包含内容的钉住节点 S -->
    <div
        ref="affixRef"
        class="affix-container-content"
        :class="{ 'is-fixed': isFixed, 'is-absolute': isAbsolute }"
        :style="affixStyle">
      <slot></slot>
    </div>
    <!-- 实际包含内容的钉住节点 E -->
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  offsetTop?: number
  offsetBottom?: number
  target?: string | HTMLElement | null
}

const props = withDefaults(defineProps<Props>(), {
  offsetTop: 80,
  offsetBottom: 0,
  target: null
})

const wrapperRef = ref<HTMLElement>()
const affixRef = ref<HTMLElement>()

const isFixed = ref(false)
const isAbsolute = ref(false)
const affixWidth = ref(0)
const affixRealHeight = ref(0)
const fixedLeft = ref(0)
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800)

// 视口在吸顶时给内容预留的最大可用高度
const maxViewportHeight = computed(() => {
  return Math.max(150, windowHeight.value - props.offsetTop - 16)
})

// 外层占位包裹容器样式 (保持未截断前的物理完整高度，绝对防止跳动)
const wrapperStyle = computed(() => {
  if (isFixed.value || isAbsolute.value) {
    return {
      position: 'relative' as const,
      width: '100%',
      minHeight: affixRealHeight.value ? `${affixRealHeight.value}px` : 'auto'
    }
  }
  return {
    position: 'relative' as const,
    width: '100%'
  }
})

/**
 * 脱离文档流的 fixed / absolute 样式
 * 当高度超出窗口剩余高度时自动开启垂直滚动
 */
const affixStyle = computed(() => {
  if (isFixed.value) {
    return {
      position: 'fixed' as const,
      top: `${props.offsetTop}px`,
      left: `${fixedLeft.value}px`,
      width: `${affixWidth.value}px`,
      maxHeight: `${maxViewportHeight.value}px`,
      overflowY: 'auto' as const,
      zIndex: 90
    }
  }
  if (isAbsolute.value) {
    return {
      position: 'absolute' as const,
      bottom: `${props.offsetBottom}px`,
      top: 'auto',
      left: '0px',
      width: `${affixWidth.value}px`,
      maxHeight: `calc(100% - ${props.offsetBottom}px)`,
      overflowY: 'auto' as const,
      zIndex: 90
    }
  }
  return {
    position: 'relative' as const,
    width: '100%'
  }
})

/**
 * 核心位置与边界判定
 */
const checkPosition = () => {
  if (!wrapperRef.value || !affixRef.value) return

  // 更新窗口真实高度
  if (typeof window !== 'undefined') {
    windowHeight.value = window.innerHeight
  }

  // 获取宿主/目标边界容器
  let parentEl: HTMLElement | null = null
  if (typeof props.target === 'string') {
    parentEl = document.querySelector(props.target) as HTMLElement
  } else if (props.target instanceof HTMLElement) {
    parentEl = props.target
  }

  if (!parentEl) {
    parentEl = wrapperRef.value.parentElement
  }
  if (!parentEl) return

  // 确保父容器具备 relative 定位
  const parentStyle = window.getComputedStyle(parentEl)
  if (parentStyle.position === 'static') {
    parentEl.style.position = 'relative'
  }

  // 测量内容的物理真实展开高度 (scrollHeight 获取被垂直滚动遮挡前的全部真实高度)
  const currentScrollHeight = affixRef.value.scrollHeight
  if (currentScrollHeight > 0) {
    affixRealHeight.value = currentScrollHeight
  }

  // 测量外层占位容器的物理属性
  const wrapperRect = wrapperRef.value.getBoundingClientRect()
  const parentRect = parentEl.getBoundingClientRect()

  const measuredWidth = wrapperRef.value.offsetWidth
  if (measuredWidth > 0) {
    affixWidth.value = measuredWidth
  }
  fixedLeft.value = wrapperRect.left

  // 吸顶触发判断
  const shouldFixed = wrapperRect.top <= props.offsetTop

  if (!shouldFixed) {
    isFixed.value = false
    isAbsolute.value = false
    return
  }

  // 判断是否到达父容器末尾底部 (使用完整的真实物理高度 affixRealHeight)
  const parentBottomLimit = parentRect.bottom
  const affixBottomLimit = props.offsetTop + affixRealHeight.value + props.offsetBottom

  if (parentBottomLimit <= affixBottomLimit) {
    // 触及父容器末尾，绝对定位在父容器底端
    isFixed.value = false
    isAbsolute.value = true
  } else {
    // 还在父容器范围内，保持 fixed 吸顶随窗口滚动
    isFixed.value = true
    isAbsolute.value = false
  }
}

let animationFrameId: number | null = null
const handleScrollOrResize = () => {
  if (animationFrameId !== null) return
  animationFrameId = requestAnimationFrame(() => {
    checkPosition()
    animationFrameId = null
  })
}

watch(() => [props.offsetTop, props.offsetBottom, props.target], () => {
  nextTick(() => {
    checkPosition()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    checkPosition()
    window.addEventListener('scroll', handleScrollOrResize, { passive: true })
    window.addEventListener('resize', handleScrollOrResize)

    setTimeout(() => { checkPosition() }, 100)
    setTimeout(() => { checkPosition() }, 300)
  })
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('scroll', handleScrollOrResize)
  window.removeEventListener('resize', handleScrollOrResize)
})

defineOptions({ name: 'AffixContainerView' })
</script>

<style scoped lang="less">
.affix-container-wrapper {
  position: relative;
  width: 100%;
}

.affix-container-content {
  box-sizing: border-box;
  scrollbar-width: thin;
}

.affix-container-content::-webkit-scrollbar {
  width: 4px;
}

.affix-container-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
