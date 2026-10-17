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
  offsetTop: 60,
  offsetBottom: 0,
  disabled: false,
  affixBottom: false
})

/**
 * 钉住节点样式：
 * 顶部模式用 sticky top，并限制视口内最大高度让内容自身滚动；
 * 底部模式用 sticky bottom；禁用时回到普通文档流。
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

  return {
    position: 'sticky' as const,
    top: `${props.offsetTop}px`,
    zIndex: 90,
    maxHeight: `calc(100vh - ${props.offsetTop}px - 16px)`,
    overflowY: 'auto' as const
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
}

.affix-container-content::-webkit-scrollbar {
  width: 4px;
}

.affix-container-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
