<template>
  <div class="affix-container-wrapper">
    <div
        class="affix-container-content"
        :style="contentStyle">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import type {AffixContainerViewProps} from '@/assets/types/Ui'

const props = withDefaults(defineProps<AffixContainerViewProps>(), {
  offsetTop: 80,
  offsetBottom: 0,
  disabled: false,
  affixBottom: false,
  scrollable: true
})

/**
 * 钉住节点样式：
 * 顶部模式用 sticky top，并限制视口内最大高度；
 * 当 scrollable 为 false（嵌套 VerticalScrollList 等自定义滚动容器）时，提供确切视口高度且外层不产生多余滚动条。
 */
const contentStyle = computed(() => {
  if (props.disabled) {
    return {
      position: 'relative' as const,
      width: '100%'
    }
  }

  if (props.affixBottom) {
    return {
      position: 'sticky' as const,
      bottom: `${props.offsetBottom}px`,
      zIndex: 10
    }
  }

  const viewportHeight = `calc(100vh - ${props.offsetTop}px - 16px)`

  if (!props.scrollable) {
    return {
      position: 'sticky' as const,
      top: `${props.offsetTop}px`,
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column' as const,
      height: viewportHeight,
      maxHeight: viewportHeight,
      overflow: 'hidden' as const
    }
  }

  return {
    position: 'sticky' as const,
    top: `${props.offsetTop}px`,
    zIndex: 90,
    maxHeight: viewportHeight,
    overflowY: 'auto' as const,
    '--affix-offset-top': `${props.offsetTop}px`
  }
})

defineOptions({ name: 'AffixContainerView' })
</script>

<style scoped lang="less">
.affix-container-wrapper {
  display: contents;
}

.affix-container-content {
  box-sizing: border-box;
  scrollbar-width: thin;

  // 关键兼容：当内部嵌套滚动容器时，自动隐藏外层原生滚动条并提供明确视口高度，解决嵌套冲突
  &:has(.scroll-container) {
    overflow: hidden !important;
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--affix-offset-top, 80px) - 16px);
    max-height: calc(100vh - var(--affix-offset-top, 80px) - 16px);
  }

  :deep(.scroll-container) {
    height: 100%;
    min-height: 0;
  }
}

.affix-container-content::-webkit-scrollbar {
  width: 4px;
}

.affix-container-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
