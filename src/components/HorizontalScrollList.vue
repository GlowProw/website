<template>
  <BaseScrollList
      ref="baseRef"
      direction="horizontal"
      v-bind="props"
      :prev-button-aria-label="leftButtonAriaLabel || prevButtonAriaLabel"
      :next-button-aria-label="rightButtonAriaLabel || nextButtonAriaLabel"
      @scroll="$emit('scroll', $event)"
      @scroll-start="$emit('scroll-start', $event)"
      @scroll-end="$emit('scroll-end', $event)">
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}"></slot>
    </template>
  </BaseScrollList>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseScrollList, { type ScrollListProps, type ScrollState } from './BaseScrollList.vue'

export interface HorizontalScrollListProps extends Omit<ScrollListProps, 'direction'> {}

const props = withDefaults(defineProps<HorizontalScrollListProps>(), {
  btnSize: 45,
  isIndicator: true,
  gap: 16,
  showControls: true,
  showScrollIndicator: true,
  hideScrollbar: true,
  scrollStep: 1000,
  leftButtonAriaLabel: '向左滚动',
  rightButtonAriaLabel: '向右滚动',
  prevButtonAriaLabel: '',
  nextButtonAriaLabel: '',
  wheelScroll: true,
  dragSensitivity: 2,
  useRAF: true,
  useShiftKey: true,
  wheelSensitivity: 0.5,
  forceDraggable: true,
  isFollowScreenCenter: false,
  followScreenSafeDistance: 200,
  height: '',
  width: ''
})

const emit = defineEmits<{
  (e: 'scroll', payload: any): void
  (e: 'scroll-start', payload: { position: number }): void
  (e: 'scroll-end', payload: { position: number }): void
}>()

const baseRef = ref<{
  scrollTo: (pos: number, behavior?: ScrollBehavior) => void
  scrollToItem: (idx: number, behavior?: ScrollBehavior) => void
  scrollPrev: () => void
  scrollNext: () => void
  scrollLeft: () => void
  scrollRight: () => void
  checkScrollability: () => void
  getScrollState: () => ScrollState
} | null>(null)

defineExpose({
  scrollTo: (pos: number, behavior?: ScrollBehavior) => baseRef.value?.scrollTo(pos, behavior),
  scrollToItem: (idx: number, behavior?: ScrollBehavior) => baseRef.value?.scrollToItem(idx, behavior),
  scrollLeft: () => baseRef.value?.scrollLeft(),
  scrollRight: () => baseRef.value?.scrollRight(),
  scrollPrev: () => baseRef.value?.scrollPrev(),
  scrollNext: () => baseRef.value?.scrollNext(),
  checkScrollability: () => baseRef.value?.checkScrollability(),
  getScrollState: () => {
    const state = baseRef.value?.getScrollState()
    return {
      scrollLeft: state?.scrollPosition ?? 0,
      canScrollLeft: state?.canScrollPrev ?? false,
      canScrollRight: state?.canScrollNext ?? false,
      maxScroll: state?.maxScroll ?? 0,
      canScrollHorizontally: state?.canScroll ?? false
    }
  }
})

defineOptions({
  name: 'HorizontalScrollList'
})
</script>
