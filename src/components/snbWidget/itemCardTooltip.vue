<script setup lang="ts">
import {computed, inject, onBeforeUnmount, provide, ref, useAttrs} from "vue";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";

/**
 * 图标提示卡片容器
 * 负责悬浮定位、进入卡片与移出后的延迟关闭，并兼容触屏长按查看
 */
const props = withDefaults(defineProps<{
  // 关闭提示卡片的显示
  disabled?: boolean,
  // 卡片最小宽度
  minWidth?: number | string,
  // 卡片最大宽度
  maxWidth?: number | string,
  // 相对鼠标的偏移量
  offset?: [number, number],
  // 卡片内容区域的附加类名
  contentClass?: string
}>(), {
  disabled: false,
  minWidth: 450,
  maxWidth: 450,
  offset: () => [40, 0],
  contentClass: "pa-0 bg-transparent",
});

// 悬停超过该时长后，鼠标移出不会立即关闭
const HOLD_THRESHOLD = 3000;
// 移出后许可的移动距离，超出即正常关闭
const ESCAPE_DISTANCE = 100;
// 触屏长按打开卡片
const LONG_PRESS_DELAY = 500;

const {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();

// 根节点是 v-if/v-else 片段，Vue 无法自动继承属性；
// 这里关闭自动继承，改由激活元素承接，避免外层透传属性时出现 Extraneous non-props attributes 警告
const attrs = useAttrs();

// 卡片内容内嵌的元素不再触发新的悬浮卡片，避免无限嵌套
const nestedInCard = inject<boolean>("itemCardTooltipActive", false);
provide("itemCardTooltipActive", true);

/**
 * 是否禁用悬浮卡片，嵌套场景与外部禁用标记同时生效
 */
const isDisabled = computed(() => props.disabled || nestedInCard);

const open = ref(false);
const contentRef = ref<HTMLElement | null>(null);

// 本次悬停开始时间，用于判断是否满足延迟关闭条件
let hoverStartAt = 0;
// 是否处于移出后等待鼠标进入卡片的保持状态
let holdOpen = false;
// 移出时的坐标，作为移动距离判定基准
let leavePoint = {x: 0, y: 0};
// 触屏长按计时器
let pressTimer: number | null = null;
// 本次触屏是否由长按打开
let pressOpened = false;

/**
 * 停止长按计时
 */
const clearPressTimer = () => {
  if (pressTimer === null) return;
  window.clearTimeout(pressTimer);
  pressTimer = null;
};

/**
 * 关闭卡片并清理全部交互状态
 */
const onClose = () => {
  open.value = false;
  holdOpen = false;
  clearPressTimer();
  window.removeEventListener("pointermove", onGlobalPointerMove);
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
};

/**
 * 进入移出保持状态，允许鼠标向卡片移动
 * @param x 移出位置横坐标
 * @param y 移出位置纵坐标
 */
const onHoldOpen = (x: number, y: number) => {
  holdOpen = true;
  leavePoint = {x, y};
  window.addEventListener("pointermove", onGlobalPointerMove, {passive: true});
};

/**
 * 全局指针移动：进入卡片则保持，超出一百像素则关闭
 * @param e 指针事件
 */
const onGlobalPointerMove = (e: PointerEvent) => {
  const el = contentRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right
        && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (inside) {
      holdOpen = false;
      return;
    }
  }
  if (Math.hypot(e.clientX - leavePoint.x, e.clientY - leavePoint.y) > ESCAPE_DISTANCE) {
    onClose();
  }
};

/**
 * 触屏打开卡片后，点击卡片以外的区域即关闭
 * @param e 指针事件
 */
const onDocumentPointerDown = (e: PointerEvent) => {
  const el = contentRef.value;
  if (el && el.contains(e.target as Node)) return;
  onClose();
};

/**
 * 指针进入图标：开始计时并展开卡片
 * @param e 指针事件
 */
const onActivatorEnter = (e: PointerEvent) => {
  if (e.pointerType === "touch") return;
  onMouseEnter(e as unknown as MouseEvent);
  hoverStartAt = Date.now();
  holdOpen = false;
  open.value = true;
};

/**
 * 指针离开图标：悬停已满三秒则保持展开，否则立即关闭
 * @param e 指针事件
 */
const onActivatorLeave = (e: PointerEvent) => {
  if (e.pointerType === "touch") return;
  if (open.value && Date.now() - hoverStartAt >= HOLD_THRESHOLD) {
    onHoldOpen(e.clientX, e.clientY);
    return;
  }
  onClose();
};

/**
 * 触屏长按图标打开卡片
 */
const onTouchStart = () => {
  clearPressTimer();
  pressOpened = false;
  pressTimer = window.setTimeout(() => {
    pressOpened = true;
    open.value = true;
    document.addEventListener("pointerdown", onDocumentPointerDown, true);
  }, LONG_PRESS_DELAY);
};

/**
 * 触屏抬起：长按已打开时阻止随后的跳转
 * @param e 触摸事件
 */
const onTouchEnd = (e: TouchEvent) => {
  clearPressTimer();
  if (!pressOpened) return;
  pressOpened = false;
  e.preventDefault();
};

/**
 * 卡片内容被移入时结束等待状态
 */
const onContentEnter = () => {
  holdOpen = false;
};

/**
 * 卡片内容被移出时正常关闭
 */
const onContentLeave = () => {
  if (holdOpen) return;
  onClose();
};

/**
 * 组装激活器属性：接管悬浮与触摸事件，由本组件统一控制开合
 * @param base Vuetify 提供的原始激活器属性
 */
const onBuildActivatorProps = (base: Record<string, any>): Record<string, any> => {
  const merged: Record<string, any> = {...base};
  for (const key of ["onMouseenter", "onMouseleave", "onPointerenter", "onPointerleave", "onFocus", "onBlur", "onTouchstart", "onTouchend", "onTouchcancel"]) {
    delete merged[key];
  }
  Object.assign(merged, {
    onPointerenter: onActivatorEnter,
    onPointerleave: onActivatorLeave,
    onPointermove: onMouseMove,
    onFocus: () => {
      open.value = true;
    },
    onBlur: () => {
      if (!holdOpen) onClose();
    },
    onTouchstart: onTouchStart,
    onTouchend: onTouchEnd,
    onTouchcancel: onTouchEnd,
  });
  return merged;
};

onBeforeUnmount(onClose);

defineOptions({
  name: "ItemCardTooltip",
  inheritAttrs: false
});
</script>

<template>
  <!-- 禁用时不再创建 tooltip 与详情卡片，只渲染激活元素，避免选择器等批量列表产生额外开销 -->
  <slot v-if="isDisabled" name="activator" :props="attrs"></slot>

  <v-tooltip
      v-else
      v-model="open"
      :eager="false"
      :offset="props.offset"
      scroll-strategy="close"
      transition="opacity 300ms ease-in"
      location="right top"
      :min-width="props.minWidth"
      :max-width="props.maxWidth"
      interactive
      class="item-card"
      :content-class="props.contentClass"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <slot name="activator" :props="onBuildActivatorProps({...attrs, ...activatorProps})"></slot>
    </template>
    <div ref="contentRef" @pointerleave="onContentLeave" @pointerenter="onContentEnter">
      <slot></slot>
    </div>
  </v-tooltip>
</template>
