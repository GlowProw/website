<script setup lang="ts">
import { computed, useAttrs } from 'vue'

export interface LoadingProps {
  size?: number | string
  minSize?: number | string
  maxSize?: number | string
  'min-size'?: number | string
  'max-size'?: number | string
  class?: string
}

const props = withDefaults(defineProps<LoadingProps>(), {
  size: '20px',
  minSize: undefined,
  maxSize: undefined,
  'min-size': undefined,
  'max-size': undefined,
  class: ''
})

const attrs = useAttrs()

/**
 * 提取纯像素数值（用于 clamp 计算与原生属性映射）
 *
 * @param val 尺寸输入
 * @returns 纯像素数值或 undefined
 */
const parsePixelValue = (val?: number | string): number | undefined => {
  if (val === undefined || val === null || val === '') return undefined
  if (typeof val === 'number') return val
  const str = String(val).trim()
  if (!str || str === 'auto' || str.endsWith('%')) return undefined
  const match = str.match(/^(-?\d+(\.\d+)?)(px)?$/)
  if (match) {
    const num = parseFloat(match[1])
    return isNaN(num) ? undefined : num
  }
  return undefined
}

/**
 * 格式化尺寸值为合法的 CSS 尺寸字符串
 *
 * @param val 尺寸输入
 * @returns 规范化的 CSS 尺寸字符串或 undefined
 */
const formatCssSize = (val?: number | string): string | undefined => {
  if (val === undefined || val === null || val === '') return undefined
  if (typeof val === 'number') {
    return `${val}px`
  }
  const str = String(val).trim()
  if (!str) return undefined
  if (str === 'auto') return 'auto'
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return `${str}px`
  }
  return str
}

// 兼容 camelCase 与 kebab-case 格式的尺寸限制，同时兜底 attrs
const resolvedMinSize = computed(() => props.minSize ?? props['min-size'] ?? (attrs['min-size'] as any) ?? (attrs.minSize as any))
const resolvedMaxSize = computed(() => props.maxSize ?? props['max-size'] ?? (attrs['max-size'] as any) ?? (attrs.maxSize as any))

// 当前是否启用自适应容器尺寸
const isAutoSize = computed(() => props.size === 'auto')

// 像素数值解析与 clamp 夹紧计算
const minPx = computed(() => parsePixelValue(resolvedMinSize.value))
const maxPx = computed(() => parsePixelValue(resolvedMaxSize.value))
const basePx = computed(() => parsePixelValue(props.size))

// 计算经过 min/max 夹紧限制后的有效像素值
const clampedPx = computed<number | undefined>(() => {
  if (isAutoSize.value || basePx.value === undefined) return undefined
  let val = basePx.value
  if (minPx.value !== undefined) {
    val = Math.max(val, minPx.value)
  }
  if (maxPx.value !== undefined) {
    val = Math.min(val, maxPx.value)
  }
  return val
})

// 原生 HTML 属性采用夹紧后的数值像素
const numericSize = computed<number | undefined>(() => {
  if (isAutoSize.value) return undefined
  return clampedPx.value ?? basePx.value
})

// 规范化后的尺寸 CSS 字符串
const formattedMin = computed(() => formatCssSize(resolvedMinSize.value))
const formattedMax = computed(() => formatCssSize(resolvedMaxSize.value))
const effectiveSizeCss = computed(() => {
  if (clampedPx.value !== undefined) {
    return `${clampedPx.value}px`
  }
  return formatCssSize(props.size)
})

// 组合强制内联样式，避免外部与父级样式干扰
const inlineStyle = computed<string>(() => {
  const parts: string[] = ['object-fit: contain !important;']

  if (isAutoSize.value) {
    parts.push('width: 100% !important;', 'height: 100% !important;')
  } else if (effectiveSizeCss.value) {
    parts.push(`width: ${effectiveSizeCss.value} !important;`, `height: ${effectiveSizeCss.value} !important;`)
  }

  if (formattedMin.value) {
    parts.push(`min-width: ${formattedMin.value} !important;`, `min-height: ${formattedMin.value} !important;`)
  }

  if (formattedMax.value) {
    parts.push(`max-width: ${formattedMax.value} !important;`, `max-height: ${formattedMax.value} !important;`)
  }

  return parts.join(' ')
})

defineOptions({
  name: 'Loading'
})
</script>

<template>
  <img
      src="@/assets/images/loading.gif"
      class="loading-img"
      :class="{ 'loading-img-auto': isAutoSize }"
      :style="inlineStyle"
      :width="numericSize"
      :height="numericSize"
      alt="loading"/>
</template>

<style scoped>
.loading-img {
  display: inline-block !important;
  vertical-align: middle;
  object-fit: contain !important;
  flex-shrink: 0 !important;
  box-sizing: content-box;
}

.loading-img-auto {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
}
</style>
