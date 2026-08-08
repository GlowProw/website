<template>
  <BaseScrollList
      ref="baseRef"
      direction="vertical"
      v-bind="props"
      :prev-button-aria-label="topButtonAriaLabel || prevButtonAriaLabel"
      :next-button-aria-label="bottomButtonAriaLabel || nextButtonAriaLabel"
      @scroll="$emit('scroll', $event)"
      @scroll-start="$emit('scroll-start', $event)"
      @scroll-end="$emit('scroll-end', $event)"
  >
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}"></slot>
    </template>
  </BaseScrollList>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseScrollList, { type ScrollListProps, type ScrollState } from './BaseScrollList.vue'

export interface VerticalScrollListProps extends Omit<ScrollListProps, 'direction'> {
  topButtonAriaLabel?: string
  bottomButtonAriaLabel?: string
}

const props = withDefaults(defineProps<VerticalScrollListProps>(), {
  btnSize: 45,
  isIndicator: true,
  gap: 16,
  showControls: true,
  showScrollIndicator: true,
  hideScrollbar: true,
  scrollStep: 1000,
  topButtonAriaLabel: '',
  bottomButtonAriaLabel: '',
  prevButtonAriaLabel: '',
  nextButtonAriaLabel: '',
  wheelScroll: false,
  dragSensitivity: 2,
  useRAF: true,
  useShiftKey: false,
  wheelSensitivity: 0.5,
  forceDraggable: true,
  isFollowScreenCenter: false,
  followScreenSafeDistance: 200,
  height: '',
  maxHeight: '',
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
  scrollUp: () => void
  scrollDown: () => void
  checkScrollability: () => void
  getScrollState: () => ScrollState
} | null>(null)

defineOptions({
  name: 'VerticalScrollList'
})

defineExpose({
  scrollTo: (pos: number, behavior?: ScrollBehavior) => baseRef.value?.scrollTo(pos, behavior),
  scrollToItem: (idx: number, behavior?: ScrollBehavior) => baseRef.value?.scrollToItem(idx, behavior),
  scrollUp: () => baseRef.value?.scrollPrev(),
  scrollDown: () => baseRef.value?.scrollNext(),
  scrollPrev: () => baseRef.value?.scrollPrev(),
  scrollNext: () => baseRef.value?.scrollNext(),
  checkScrollability: () => baseRef.value?.checkScrollability(),
  getScrollState: () => baseRef.value?.getScrollState()
})
</script>
