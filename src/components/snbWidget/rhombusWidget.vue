<script lang="ts">
export default { name: 'RhombusWidget' }
</script>

<script setup lang="ts">
import { computed, useId } from 'vue';

// 快捷预设类型:
// 'none' (无 / 未插词条: 仅白色空心边框)
// 'normal' (普通: 黄色边框 + 黄色实心)
// 'normal-congenital' (普通 先天: 黄色边框 + 黄色实心 + 透明火焰)
// 'adept' (大师: 黄色角 + 黄色边框 + 黄色实心)
// 'adept-congenital' (大师 先天: 黄色角 + 黄色边框 + 黄色实心 + 透明火焰)
export type RhombusType =
  | 'none'
  | 'normal'
  | 'normal-congenital'
  | 'adept'
  | 'adept-congenital'
  | string;

export interface CommonRhombusProps {
  size?: string | number;
  activateColor?: string;
  inactiveColor?: string;
}

// 预设模式: 传 type，排斥 border/slot/adept/glow 等细分参数
export interface TypeRhombusProps extends CommonRhombusProps {
  type: RhombusType;
  border?: never;
  borderActivate?: never;
  slot?: never;
  slotActivate?: never;
  adept?: never;
  adeptActivate?: never;
  glow?: never;
}

// 细分模式: 传细分参数，排斥 type
export interface CustomRhombusProps extends CommonRhombusProps {
  type?: never;
  border?: boolean;
  borderActivate?: boolean;
  slot?: boolean;
  slotActivate?: boolean;
  adept?: boolean;
  adeptActivate?: boolean;
  glow?: boolean;
}

export type RhombusWidgetProps = TypeRhombusProps | CustomRhombusProps;

const props = withDefaults(defineProps<{
  // 模式 1: 预设类型 (有 type 时不可与细分参数混用)
  type?: RhombusType;

  // 模式 2: 细分参数 (有细分参数时不可与 type 混用)
  border?: boolean;
  borderActivate?: boolean;
  slot?: boolean;
  slotActivate?: boolean;
  adept?: boolean;
  adeptActivate?: boolean;
  glow?: boolean;

  // 通用配置
  activateColor?: string;
  inactiveColor?: string;
  size?: string | number;
}>(), {
  type: undefined,
  border: undefined,
  borderActivate: undefined,
  slot: undefined,
  slotActivate: undefined,
  adept: undefined,
  adeptActivate: undefined,
  glow: undefined,
  activateColor: '',
  inactiveColor: '',
  size: 25,
});

if (import.meta.env?.DEV) {
  if (props.type !== undefined && (
    props.border !== undefined ||
    props.borderActivate !== undefined ||
    props.slot !== undefined ||
    props.slotActivate !== undefined ||
    props.adept !== undefined ||
    props.adeptActivate !== undefined ||
    props.glow !== undefined
  )) {
    console.warn('[RhombusWidget] Cannot use `type` together with custom props (border, slot, adept, glow). `type` takes precedence.');
  }
}

const hasType = computed(() => props.type !== undefined && props.type !== null && props.type !== '');

// 1. 是否有边框
const hasBorder = computed(() => {
  if (hasType.value) {
    return true;
  }
  return props.border ?? true;
});

// 2. 边框是否激活 (黄色 vs 白色)
const isBorderActivate = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    if (t === 'none') return false;
    return t === 'normal' || t === 'normal-congenital' || t === 'adept' || t === 'adept-congenital';
  }
  return props.borderActivate ?? false;
});

// 3. 是否有角 (adept)
const hasAdept = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    return t === 'adept' || t === 'adept-congenital';
  }
  return props.adept ?? (props.adeptActivate !== undefined ? true : false);
});

// 4. 角是否激活 (黄色 vs 白色)
const isAdeptActivate = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    return t === 'adept' || t === 'adept-congenital';
  }
  return props.adeptActivate ?? (hasAdept.value ? (props.borderActivate ?? false) : false);
});

// 5. 是否有实心内芯 (slot)
const hasSlot = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    if (t === 'none') return false;
    return t === 'normal' || t === 'normal-congenital' || t === 'adept' || t === 'adept-congenital';
  }
  return props.slot ?? (props.slotActivate !== undefined ? true : false);
});

// 6. 实心内芯是否激活 (黄色 vs 白色)
const isSlotActivate = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    if (t === 'none') return false;
    return t === 'normal' || t === 'normal-congenital' || t === 'adept' || t === 'adept-congenital';
  }
  return props.slotActivate ?? false;
});

// 7. 是否发光火焰 (glow)
const isGlow = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    return t === 'normal-congenital' || t === 'adept-congenital';
  }
  return props.glow ?? false;
});

const rawId = useId();
const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
const flameMainId = `flame-main-${uid}`;
const flameSideId = `flame-side-${uid}`;
const flameAuraId = `flame-aura-${uid}`;
const flameBlurId = `flame-blur-${uid}`;

const displaySize = computed(() => {
  if (typeof props.size === 'number') {
    if (props.size <= 8) {
      return `${Math.round(props.size * 2.33)}px`;
    }
    return `${props.size}px`;
  }
  if (typeof props.size === 'string') {
    if (/^\d+(\.\d+)?$/.test(props.size)) {
      const num = Number(props.size);
      if (num <= 8) return `${Math.round(num * 2.33)}px`;
      return `${num}px`;
    }
    return props.size;
  }
  return '14px';
});

const activeColorVal = computed(() => {
  if (props.activateColor) return props.activateColor;
  return 'var(--main-color, #f5c518)';
});

const inactiveColorVal = computed(() => {
  if (props.inactiveColor) return props.inactiveColor;
  return '#ffffff';
});

const borderStrokeColor = computed(() => {
  return isBorderActivate.value ? activeColorVal.value : inactiveColorVal.value;
});

const adeptStrokeColor = computed(() => {
  return isAdeptActivate.value ? activeColorVal.value : inactiveColorVal.value;
});

const slotFillColor = computed(() => {
  return isSlotActivate.value ? (props.activateColor || '#fed727') : inactiveColorVal.value;
});
</script>

<template>
  <div class="rhombus-widget" :style="{ width: displaySize, height: displaySize }">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      class="rhombus-svg"
      :class="{ 'has-congenital': isGlow, 'is-activated': isBorderActivate || isSlotActivate || isAdeptActivate }">

      <defs>
        <!-- 透明火焰主色渐变 -->
        <linearGradient :id="flameMainId" x1="0%" y1="160%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="rgba(255, 80, 0, 0)" />
          <stop offset="25%" stop-color="rgba(255, 120, 0, 0.45)" />
          <stop offset="65%" stop-color="rgba(255, 185, 20, 0.65)" />
          <stop offset="90%" stop-color="rgba(255, 235, 120, 0.4)" />
          <stop offset="100%" stop-color="rgba(255, 255, 200, 0)" />
        </linearGradient>

        <!-- 透明火焰侧翼渐变 -->
        <linearGradient :id="flameSideId" x1="0%" y1="160%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="rgba(240, 60, 1, 0)" />
          <stop offset="30%" stop-color="rgba(255, 140, 0, 0.1)" />
          <stop offset="75%" stop-color="rgba(255, 200, 40, 0.55)" />
          <stop offset="100%" stop-color="rgba(255, 240, 100, 0)" />
        </linearGradient>

        <!-- 火焰外晕 -->
        <radialGradient :id="flameAuraId" cx="0%" cy="160%" r="0%">
          <stop offset="0%" stop-color="rgba(255, 180, 30, 0.1)" />
          <stop offset="40%" stop-color="rgba(255, 110, 0, 0.8)" />
          <stop offset="75%" stop-color="rgba(230, 60, 0, 0.52)" />
          <stop offset="100%" stop-color="rgba(200, 40, 0, 0)" />
        </radialGradient>

        <!-- 火焰柔化滤镜 -->
        <filter :id="flameBlurId" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <!-- 1背景透明火焰层 (仅在发光时渲染) -->
      <g v-if="isGlow" class="flame-layer-back">
        <!-- 火焰背光晕 -->
        <ellipse cx="24" cy="20" rx="28" ry="32" :fill="`url(#${flameAuraId})`" class="flame-aura" />

        <!-- 柔化火焰火舌 -->
        <g :filter="`url(#${flameBlurId})`">
          <!-- 左侧火舌 -->
          <path
            d="M 10,28 C 4,14 12,2 17,-8 C 22,0 18,12 16,28 Z"
            :fill="`url(#${flameSideId})`"
            class="flame-tongue-left"
          />
          <!-- 中间主火舌 -->
          <path
            d="M 16,30 C 18,10 21,-12 25,-14 C 29,-2 28,14 26,30 Z"
            :fill="`url(#${flameMainId})`"
            class="flame-tongue-center"
          />
          <!-- 右侧火舌 -->
          <path
            d="M 28,28 C 34,16 36,4 32,-6 C 36,4 38,16 34,28 Z"
            :fill="`url(#${flameSideId})`"
            class="flame-tongue-right"
          />
        </g>
      </g>

      <!-- 主体几何图形 (普通棱形 / 带角棱形) -->
      <!-- A. 普通棱形 (非带角) -->
      <g v-if="!hasAdept">
        <!-- 空心普通棱形 (无实心内芯) -->
        <polygon
          v-if="!hasSlot && hasBorder"
          points="24,6 42,24 24,42 6,24"
          fill="none"
          :stroke="borderStrokeColor"
          stroke-width="2.6"
          stroke-linejoin="miter"
        />
        <!-- 实心普通棱形 (外边框 + 深色凹槽分隔线 + 实心同色内芯) -->
        <g v-else-if="hasSlot">
          <polygon v-if="hasBorder" points="24,5 43,24 24,43 5,24" :fill="borderStrokeColor" />
          <polygon points="24,9 39,24 24,39 9,24" fill="#181e20" />
          <polygon points="24,12.5 35.5,24 24,35.5 12.5,24" :fill="slotFillColor" />
        </g>
      </g>

      <!-- 带角棱形 (四角出尖星型) -->
      <g v-else>
        <!-- 空心带角棱形 (无实心内芯) -->
        <path
          v-if="!hasSlot && hasBorder"
          d="M 24,4 L 29,12 L 37.5,10.5 L 36,19 L 44,24 L 36,29 L 37.5,37.5 L 29,36 L 24,44 L 19,36 L 10.5,37.5 L 12,29 L 4,24 L 12,19 L 10.5,10.5 L 19,12 Z"
          fill="none"
          :stroke="adeptStrokeColor"
          stroke-width="2.6"
          stroke-linejoin="miter"
        />
        <!-- 实心带角棱形 (带角外轮廓 + 深色凹槽分隔线 + 实心同色内芯) -->
        <g v-else-if="hasSlot">
          <path
            v-if="hasBorder"
            d="M 24,4 L 29,12 L 37.5,10.5 L 36,19 L 44,24 L 36,29 L 37.5,37.5 L 29,36 L 24,44 L 19,36 L 10.5,37.5 L 12,29 L 4,24 L 12,19 L 10.5,10.5 L 19,12 Z"
            :fill="adeptStrokeColor"
          />
          <polygon points="24,9 39,24 24,39 9,24" fill="#181e20" />
          <polygon points="24,12.5 35.5,24 24,35.5 12.5,24" :fill="slotFillColor" />
        </g>
      </g>

      <!-- 前景透明火焰轻覆层 (仅在发光时渲染，产生立体火焰包裹感) -->
      <g v-if="isGlow" :filter="`url(#${flameBlurId})`" class="flame-layer-front">
        <path
          d="M 15,22 C 16,10 21,-2 23,-4 C 26,6 24,16 22,24 Z"
          :fill="`url(#${flameMainId})`"
          class="flame-front"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped lang="less">
.rhombus-widget {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  vertical-align: middle;
  flex-shrink: 0;
}

.rhombus-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  display: block;
}

/* 火焰动画关键帧 */
.flame-aura {
  animation: flame-pulse 2s ease-in-out infinite alternate;
  transform-origin: 24px 20px;
}

.flame-tongue-left {
  animation: flame-sway-left 2.4s ease-in-out infinite alternate;
  transform-origin: 16px 28px;
}

.flame-tongue-center {
  animation: flame-rise-center 1.8s ease-in-out infinite alternate;
  transform-origin: 24px 30px;
}

.flame-tongue-right {
  animation: flame-sway-right 2.1s ease-in-out infinite alternate;
  transform-origin: 32px 28px;
}

.flame-front {
  animation: flame-flicker-front 1.5s ease-in-out infinite alternate;
  transform-origin: 20px 24px;
}

@keyframes flame-pulse {
  0% {
    transform: scale(0.92);
    opacity: 0.65;
  }
  100% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@keyframes flame-sway-left {
  0% {
    transform: rotate(-3deg) scaleY(0.95);
    opacity: 0.75;
  }
  50% {
    transform: rotate(2deg) scaleY(1.08);
    opacity: 0.95;
  }
  100% {
    transform: rotate(-4deg) scaleY(1.02);
    opacity: 0.8;
  }
}

@keyframes flame-rise-center {
  0% {
    transform: scaleY(0.92) translateY(1px);
    opacity: 0.8;
  }
  50% {
    transform: scaleY(1.14) translateY(-2px);
    opacity: 1;
  }
  100% {
    transform: scaleY(0.98) translateY(0px);
    opacity: 0.85;
  }
}

@keyframes flame-sway-right {
  0% {
    transform: rotate(3deg) scaleY(1.05);
    opacity: 0.85;
  }
  50% {
    transform: rotate(-2deg) scaleY(0.92);
    opacity: 0.7;
  }
  100% {
    transform: rotate(4deg) scaleY(1.1);
    opacity: 0.9;
  }
}

@keyframes flame-flicker-front {
  0% {
    opacity: 0.35;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.65;
    transform: scale(1.05) translateY(-1px);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.98);
  }
}
</style>
