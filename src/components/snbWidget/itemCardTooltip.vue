<script setup lang="ts">
import {computed, inject, onBeforeUnmount, provide, ref, useAttrs, watch} from "vue";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";

/**
 * 图标提示卡片容器
 * 负责悬浮跟随定位、固定锁点交互、进入卡片与离开后的关闭处理，并兼容触屏长按查看
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

// 触屏长按打开卡片时长
const LONG_PRESS_DELAY = 500;
// 指针在图标与卡片之间切换的缓冲时长（毫秒）
const CLOSE_BUFFER_DELAY = 200;

const {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();

// 根节点是 v-if/v-else 片段，Vue 无法自动继承属性，由激活元素承接
const attrs = useAttrs();

// 卡片内容内嵌的元素不再触发新的悬浮卡片，避免无限嵌套
const nestedInCard = inject<boolean>("itemCardTooltipActive", false);
provide("itemCardTooltipActive", true);

/**
 * 是否禁用悬浮卡片，嵌套场景与外部禁用标记同时生效
 */
const isDisabled = computed(() => props.disabled || nestedInCard);

const open = ref(false);
const isPinned = ref(false);
const contentRef = ref<HTMLElement | null>(null);

// 记录指针是否处在激活图标或提示卡片内部
let isInsideActivator = false;
let isInsideContent = false;
let closeTimer: number | null = null;

// 触屏长按计时器与状态
let pressTimer: number | null = null;
let pressOpened = false;

/**
 * 清除关闭延迟计时器
 */
const clearCloseTimer = () => {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
};

/**
 * 停止长按计时
 */
const clearPressTimer = () => {
  if (pressTimer !== null) {
    window.clearTimeout(pressTimer);
    pressTimer = null;
  }
};

/**
 * 关闭卡片并重置锁定及交互状态
 */
const onClose = () => {
  clearCloseTimer();
  clearPressTimer();
  if (open.value) {
    open.value = false;
  }
  isPinned.value = false;
  isInsideActivator = false;
  isInsideContent = false;
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
};

// 监听外层浮层开合状态，关闭时重置锁定与指针标记
watch(open, (val) => {
  if (!val) {
    onClose();
  }
});

/**
 * 切换卡片固定锁定状态：锁定后坐标不再跟随鼠标移动，保持位置直至完全移出
 */
const togglePin = () => {
  isPinned.value = !isPinned.value;
};

/**
 * 外部设置锁定状态
 * @param val 是否锁定
 */
const setPinned = (val: boolean) => {
  isPinned.value = val;
};

// 注入给子级 CardDetail 等组件，绑定固定快捷键与按钮
provide("itemCardTooltipContext", {
  isPinned,
  togglePin,
  setPinned,
});

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
 * 检查指针离开状态：当指针完全离开图标与卡片后执行关闭
 */
const checkLeaveAndClose = () => {
  clearCloseTimer();
  closeTimer = window.setTimeout(() => {
    if (!isInsideActivator && !isInsideContent) {
      onClose();
    }
  }, CLOSE_BUFFER_DELAY);
};

/**
 * 指针进入图标
 * @param e 指针事件
 */
const onActivatorEnter = (e: PointerEvent) => {
  if (e.pointerType === "touch") return;
  clearCloseTimer();
  isInsideActivator = true;
  if (!isPinned.value) {
    onMouseEnter(e as unknown as MouseEvent);
  }
  open.value = true;
};

/**
 * 指针在图标内部移动：锁定后保持位置固定，未锁定时跟随鼠标
 * @param e 指针事件
 */
const onActivatorMove = (e: PointerEvent) => {
  if (e.pointerType === "touch") return;
  isInsideActivator = true;
  if (!isPinned.value) {
    onMouseMove(e as unknown as MouseEvent);
  }
};

/**
 * 指针离开图标
 * @param e 指针事件
 */
const onActivatorLeave = (e: PointerEvent) => {
  if (e.pointerType === "touch") return;
  isInsideActivator = false;
  checkLeaveAndClose();
};

/**
 * 指针移入提示卡片内容区
 */
const onContentEnter = () => {
  clearCloseTimer();
  isInsideContent = true;
};

/**
 * 指针移出提示卡片内容区
 */
const onContentLeave = () => {
  isInsideContent = false;
  checkLeaveAndClose();
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
    onPointermove: onActivatorMove,
    onFocus: () => {
      open.value = true;
    },
    onBlur: () => {
      checkLeaveAndClose();
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
  inheritAttrs: false,
});
</script>

<template>
  <!-- 禁用时不再创建 tooltip 与详情卡片，只渲染激活元素，避免选择器等批量列表产生额外开销 -->
  <slot v-if="isDisabled" name="activator" :props="attrs"></slot>

  <v-tooltip
      v-else
      v-model="open"
      :z-index="2500"
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
