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
  highlightColor?: string;
  glowOpacity?: number | string;
  glowBlur?: number | string;
  flameOpacity?: number | string;
  flameBlur?: number | string;
}

// 预设模式: 传 type，排斥 border/slot/adept/glow 等细分参数
export interface TypeRhombusProps extends CommonRhombusProps {
  type: RhombusType;
  border?: never;
  borderActivate?: never;
  borderHighlightActivate?: never;
  slot?: never;
  slotActivate?: never;
  slotHighlightActivate?: never;
  adept?: never;
  adeptActivate?: never;
  adeptHighlightActivate?: never;
  glow?: never;
}

// 细分模式: 传细分参数，排斥 type
export interface CustomRhombusProps extends CommonRhombusProps {
  type?: never;
  border?: boolean;
  borderActivate?: boolean;
  borderHighlightActivate?: boolean;
  slot?: boolean;
  slotActivate?: boolean;
  slotHighlightActivate?: boolean;
  adept?: boolean;
  adeptActivate?: boolean;
  adeptHighlightActivate?: boolean;
  glow?: boolean;
}

export type RhombusWidgetProps = TypeRhombusProps | CustomRhombusProps;

const props = withDefaults(defineProps<{
  // 模式 1: 预设类型 (有 type 时不可与细分参数混用)
  type?: RhombusType;

  // 模式 2: 细分参数 (有细分参数时不可与 type 混用)
  border?: boolean;
  borderActivate?: boolean;
  borderHighlightActivate?: boolean;
  slot?: boolean;
  slotActivate?: boolean;
  slotHighlightActivate?: boolean;
  adept?: boolean;
  adeptActivate?: boolean;
  adeptHighlightActivate?: boolean;
  glow?: boolean;

  // 通用配置
  activateColor?: string;
  inactiveColor?: string;
  highlightColor?: string;
  glowOpacity?: number | string;
  glowBlur?: number | string;
  flameOpacity?: number | string;
  flameBlur?: number | string;
  size?: string | number;
}>(), {
  type: undefined,
  border: undefined,
  borderActivate: undefined,
  borderHighlightActivate: undefined,
  slot: undefined,
  slotActivate: undefined,
  slotHighlightActivate: undefined,
  adept: undefined,
  adeptActivate: undefined,
  adeptHighlightActivate: undefined,
  glow: undefined,
  activateColor: '#fed727',
  inactiveColor: 'rgb(255 255 255 / 40%)',
  highlightColor: 'rgb(246 246 162)',
  glowOpacity: .5,
  glowBlur: 5,
  flameOpacity: undefined,
  flameBlur: undefined,
  size: 25,
});

if (import.meta.env?.DEV) {
  if (props.type !== undefined && (
    props.border !== undefined ||
    props.borderActivate !== undefined ||
    props.borderHighlightActivate !== undefined ||
    props.slot !== undefined ||
    props.slotActivate !== undefined ||
    props.slotHighlightActivate !== undefined ||
    props.adept !== undefined ||
    props.adeptActivate !== undefined ||
    props.adeptHighlightActivate !== undefined ||
    props.glow !== undefined
  )) {
    console.warn('[RhombusWidget] Cannot use `type` together with custom props (border, slot, adept, glow). `type` takes precedence.');
  }
}

const hasType = computed(() => props.type !== undefined && props.type !== null && props.type !== '');

// 是否展示外层边框
const hasBorder = computed(() => {
  if (hasType.value) {
    return true;
  }
  return props.border ?? true;
});

// 边框是否为高亮状态
const isBorderHighlight = computed(() => {
  return props.borderHighlightActivate ?? false;
});

// 边框是否为激活状态
const isBorderActivate = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    if (t === 'none') return false;
    return t === 'normal' || t === 'normal-congenital' || t === 'adept' || t === 'adept-congenital';
  }
  return props.borderActivate ?? false;
});

// 是否展示特殊角标（adept）
const hasAdept = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    return t === 'adept' || t === 'adept-congenital';
  }
  return props.adept ?? (props.adeptActivate !== undefined || props.adeptHighlightActivate !== undefined ? true : false);
});

// 角标是否为高亮状态
const isAdeptHighlight = computed(() => {
  return props.adeptHighlightActivate ?? false;
});

// 角标是否为激活状态
const isAdeptActivate = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    return t === 'adept' || t === 'adept-congenital';
  }
  return props.adeptActivate ?? (hasAdept.value ? (props.borderActivate ?? false) : false);
});

// 是否带有实心内芯（slot）
const hasSlot = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    if (t === 'none') return false;
    return t === 'normal' || t === 'normal-congenital' || t === 'adept' || t === 'adept-congenital';
  }
  return props.slot ?? (props.slotActivate !== undefined || props.slotHighlightActivate !== undefined ? true : false);
});

// 实心内芯是否为高亮状态
const isSlotHighlight = computed(() => {
  return props.slotHighlightActivate ?? false;
});

// 实心内芯是否为激活状态
const isSlotActivate = computed(() => {
  if (hasType.value) {
    const t = String(props.type);
    if (t === 'none') return false;
    return t === 'normal' || t === 'normal-congenital' || t === 'adept' || t === 'adept-congenital';
  }
  return props.slotActivate ?? false;
});

// 是否展示外发光火焰光效（glow）
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
const flameSmokeId = `flame-smoke-${uid}`;
const flameBlurId = `flame-blur-${uid}`;
const flameSoftBlurId = `flame-soft-blur-${uid}`;

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

const highlightColorVal = computed(() => {
  if (props.highlightColor) return props.highlightColor;
  return '#ffff7a';
});

const activeColorVal = computed(() => {
  if (props.activateColor) return props.activateColor;
  return '#fed727';
});

const inactiveColorVal = computed(() => {
  if (props.inactiveColor) return props.inactiveColor;
  return 'rgb(255 255 255 / 40%)';
});

const borderStrokeColor = computed(() => {
  if (isBorderHighlight.value) return highlightColorVal.value;
  return isBorderActivate.value ? activeColorVal.value : inactiveColorVal.value;
});

const adeptStrokeColor = computed(() => {
  if (isAdeptHighlight.value) return highlightColorVal.value;
  return isAdeptActivate.value ? activeColorVal.value : inactiveColorVal.value;
});

const slotFillColor = computed(() => {
  if (isSlotHighlight.value) return highlightColorVal.value;
  return isSlotActivate.value ? activeColorVal.value : inactiveColorVal.value;
});

// 火焰透明度控制 (支持 props.glowOpacity / props.flameOpacity，默认 0.75 呈现通透半透明)
const flameOpacityVal = computed(() => {
  const raw = props.glowOpacity ?? props.flameOpacity;
  if (raw !== undefined && raw !== null && raw !== '') {
    const num = Number(raw);
    if (!isNaN(num)) return Math.max(0, Math.min(1, num));
    return raw;
  }
  return 0.75;
});

// 火焰模糊度控制 (支持 props.glowBlur / props.flameBlur，默认 3.2 呈现更柔和模糊烟雾感)
const flameBlurVal = computed(() => {
  const raw = props.glowBlur ?? props.flameBlur;
  if (raw !== undefined && raw !== null && raw !== '') {
    const num = Number(raw);
    if (!isNaN(num)) return Math.max(0, num);
  }
  return 3.2;
});

// 烟雾层模糊度
const flameSmokeBlurVal = computed(() => {
  return Number((flameBlurVal.value * 1.35).toFixed(2));
});

defineOptions({
  name: 'RhombusWidget'
})
</script>

<template>
  <div class="rhombus-widget" :style="{ width: displaySize, height: displaySize }">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      class="rhombus-svg"
      :class="{ 'has-congenital': isGlow, 'is-activated': isBorderActivate || isSlotActivate || isAdeptActivate }">

      <defs>
        <!-- 火焰核心金黄渐变 -->
        <linearGradient :id="flameMainId" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="rgba(240, 70, 0, 0)" />
          <stop offset="20%" stop-color="rgba(255, 100, 10, 0.4)" />
          <stop offset="50%" stop-color="rgba(255, 170, 20, 0.75)" />
          <stop offset="75%" stop-color="rgba(255, 220, 80, 0.65)" />
          <stop offset="92%" stop-color="rgba(255, 255, 160, 0.3)" />
          <stop offset="100%" stop-color="rgba(255, 255, 200, 0)" />
        </linearGradient>

        <!-- 火焰侧翼与烟气渐变 -->
        <linearGradient :id="flameSideId" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="rgba(200, 40, 0, 0)" />
          <stop offset="25%" stop-color="rgba(230, 80, 10, 0.35)" />
          <stop offset="60%" stop-color="rgba(255, 140, 30, 0.6)" />
          <stop offset="85%" stop-color="rgba(255, 195, 60, 0.4)" />
          <stop offset="100%" stop-color="rgba(255, 210, 80, 0)" />
        </linearGradient>

        <!-- 烟气烟雾深色渐变 -->
        <linearGradient :id="flameSmokeId" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="rgba(140, 45, 15, 0)" />
          <stop offset="35%" stop-color="rgba(180, 60, 15, 0.3)" />
          <stop offset="70%" stop-color="rgba(215, 95, 20, 0.45)" />
          <stop offset="90%" stop-color="rgba(235, 140, 30, 0.2)" />
          <stop offset="100%" stop-color="rgba(200, 80, 15, 0)" />
        </linearGradient>

        <!-- 火焰外晕光环 -->
        <radialGradient :id="flameAuraId" cx="50%" cy="58%" r="50%">
          <stop offset="0%" stop-color="rgba(255, 210, 60, 0.6)" />
          <stop offset="30%" stop-color="rgba(255, 130, 15, 0.55)" />
          <stop offset="60%" stop-color="rgba(220, 65, 5, 0.35)" />
          <stop offset="85%" stop-color="rgba(160, 35, 0, 0.15)" />
          <stop offset="100%" stop-color="rgba(120, 20, 0, 0)" />
        </radialGradient>

        <!-- 火焰轮廓模糊滤镜 (由 props.glowBlur / props.flameBlur 控制) -->
        <filter :id="flameBlurId" x="-60%" y="-80%" width="220%" height="260%">
          <feGaussianBlur :stdDeviation="flameBlurVal" />
        </filter>

        <!-- 烟雾轻柔滤镜 -->
        <filter :id="flameSoftBlurId" x="-60%" y="-80%" width="220%" height="260%">
          <feGaussianBlur :stdDeviation="flameSmokeBlurVal" />
        </filter>
      </defs>

      <!-- 背景火焰烟气层 (仅在发光时渲染，由 props.glowOpacity / props.flameOpacity 控制透明度) -->
      <g v-if="isGlow" class="flame-layer-back" :style="{ opacity: flameOpacityVal }">
        <!-- 火焰背底主光晕 -->
        <ellipse cx="24" cy="22" rx="22" ry="24" :fill="`url(#${flameAuraId})`" class="flame-aura" />

        <!-- 烟气烟雾扩散层 -->
        <g :filter="`url(#${flameSoftBlurId})`" class="flame-smoke-group">
          <!-- 底部及周围扩散暖烟 -->
          <path
            d="M 6,26 C 3,14 10,2 17,-5 C 24,-12 28,-12 33,-4 C 40,4 47,15 42,28 C 38,38 31,44 24,44 C 17,44 10,38 6,26 Z"
            :fill="`url(#${flameSmokeId})`"
            class="flame-smoke-outer"
          />
        </g>

        <!-- 柔化多层上升火舌与焰团 -->
        <g :filter="`url(#${flameBlurId})`" class="flame-tongues-group">
          <!-- 左侧摇曳火舌 -->
          <path
            d="M 12,30 C 5,20 8,6 13,-6 C 17,-12 21,-5 19,4 C 17,13 18,22 15,32 Z"
            :fill="`url(#${flameSideId})`"
            class="flame-tongue-left"
          />
          <!-- 右侧摇曳火舌 -->
          <path
            d="M 36,30 C 43,20 40,6 35,-6 C 31,-12 27,-5 29,4 C 31,13 30,22 33,32 Z"
            :fill="`url(#${flameSideId})`"
            class="flame-tongue-right"
          />
          <!-- 中间主火舌 (腾起翻滚) -->
          <path
            d="M 15,34 C 14,18 18,2 22,-10 C 24,-15 27,-15 28,-9 C 31,0 35,16 33,34 C 29,40 19,40 15,34 Z"
            :fill="`url(#${flameMainId})`"
            class="flame-tongue-center"
          />
          <!-- 顶部轻盈焰芯 -->
          <path
            d="M 18,20 C 18,6 21,-8 24,-14 C 27,-8 30,6 30,20 C 27,24 21,24 18,20 Z"
            :fill="`url(#${flameMainId})`"
            class="flame-tongue-core"
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
        <!-- 空心带角棱形 (原正方形角不变，刺比之前长 2px) -->
        <path
          v-if="!hasSlot && hasBorder"
          d="M 24,4 L 29,12 L 39.5,8.5 L 36,19 L 44,24 L 36,29 L 39.5,39.5 L 29,36 L 24,44 L 19,36 L 8.5,39.5 L 12,29 L 4,24 L 12,19 L 8.5,8.5 L 19,12 Z"
          fill="none"
          :stroke="adeptStrokeColor"
          stroke-width="2.6"
          stroke-linejoin="miter"
        />
        <!-- 实心带角棱形 (带角外轮廓 + 深色凹槽分隔线 + 实心同色内芯) -->
        <g v-else-if="hasSlot">
          <path
            v-if="hasBorder"
            d="M 24,4 L 29,12 L 39.5,8.5 L 36,19 L 44,24 L 36,29 L 39.5,39.5 L 29,36 L 24,44 L 19,36 L 8.5,39.5 L 12,29 L 4,24 L 12,19 L 8.5,8.5 L 19,12 Z"
            :fill="adeptStrokeColor"
          />
          <polygon points="24,9 39,24 24,39 9,24" fill="#181e20" />
          <polygon points="24,12.5 35.5,24 24,35.5 12.5,24" :fill="slotFillColor" />
        </g>
      </g>

      <!-- 前景透明火焰轻覆层 (立体火焰微覆，透明度受 props 控制) -->
      <g v-if="isGlow" :filter="`url(#${flameBlurId})`" class="flame-layer-front" :style="{ opacity: flameOpacityVal }">
        <path
          d="M 18,24 C 18,14 21,3 24,0 C 27,3 29,14 28,24 C 26,28 21,28 18,24 Z"
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
  animation: flame-aura-breathe 2.4s ease-in-out infinite alternate;
  transform-origin: 24px 22px;
}

.flame-smoke-outer {
  animation: flame-smoke-drift 3.2s ease-in-out infinite alternate;
  transform-origin: 24px 24px;
}

.flame-tongue-left {
  animation: flame-sway-left 2.2s ease-in-out infinite alternate;
  transform-origin: 15px 30px;
}

.flame-tongue-center {
  animation: flame-rise-center 1.7s ease-in-out infinite alternate;
  transform-origin: 24px 34px;
}

.flame-tongue-core {
  animation: flame-pulse-core 1.3s ease-in-out infinite alternate;
  transform-origin: 24px 10px;
}

.flame-tongue-right {
  animation: flame-sway-right 2s ease-in-out infinite alternate;
  transform-origin: 33px 30px;
}

.flame-front {
  animation: flame-flicker-front 1.5s ease-in-out infinite alternate;
  transform-origin: 24px 20px;
}

@keyframes flame-aura-breathe {
  0% {
    transform: scale(0.94);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.04) translateY(-1px);
    opacity: 0.95;
  }
  100% {
    transform: scale(1.08) translateY(-2px);
    opacity: 0.85;
  }
}

@keyframes flame-smoke-drift {
  0% {
    transform: scale(0.96) rotate(-1deg);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.05) translateY(-2px) rotate(1deg);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.02) translateY(-1px) rotate(-1.5deg);
    opacity: 0.75;
  }
}

@keyframes flame-sway-left {
  0% {
    transform: rotate(-3deg) scaleY(0.96);
    opacity: 0.8;
  }
  50% {
    transform: rotate(2deg) scaleY(1.06) translateY(-2px);
    opacity: 0.95;
  }
  100% {
    transform: rotate(-4deg) scaleY(1.01) translateY(-1px);
    opacity: 0.85;
  }
}

@keyframes flame-rise-center {
  0% {
    transform: scaleY(0.94) translateY(1px);
    opacity: 0.85;
  }
  50% {
    transform: scaleY(1.1) translateY(-2px);
    opacity: 1;
  }
  100% {
    transform: scaleY(1.02) translateY(-1px);
    opacity: 0.9;
  }
}

@keyframes flame-pulse-core {
  0% {
    transform: scale(0.9) translateY(0px);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.12) translateY(-3px);
    opacity: 1;
  }
  100% {
    transform: scale(0.98) translateY(-1px);
    opacity: 0.8;
  }
}

@keyframes flame-sway-right {
  0% {
    transform: rotate(3deg) scaleY(1.02);
    opacity: 0.85;
  }
  50% {
    transform: rotate(-2deg) scaleY(0.95) translateY(-2px);
    opacity: 0.75;
  }
  100% {
    transform: rotate(4deg) scaleY(1.08) translateY(-1px);
    opacity: 0.95;
  }
}

@keyframes flame-flicker-front {
  0% {
    opacity: 0.35;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.08) translateY(-1.5px);
  }
  100% {
    opacity: 0.45;
    transform: scale(1);
  }
}
</style>
