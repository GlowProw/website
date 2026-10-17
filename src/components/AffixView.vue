<template>
  <div class="nail-widget" :class="[directionClass]">
    <div class="main-content pl-5">
      <slot></slot>
    </div>

    <div class="nail-area" :class="[`nail-${props.direction}`, props?.affixBgClass || '']">
      <div
          class="nail-container"
          :style="nailStyle">
        <div class="nail-content">
          <slot name="nail"></slot>
        </div>
      </div>

      <div class="nail-footer" v-if="slots['nail-footer']">
        <slot name="nail-footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, useSlots} from 'vue'
import type {AffixViewProps} from '@/assets/types/Ui'

const props = withDefaults(defineProps<AffixViewProps>(), {
  direction: 'left',
  offsetTop: 80,
  offsetBottom: 0,
  affixBgClass: '',
  disabled: false
})

const slots = useSlots()

const directionClass = computed(() => `direction-${props.direction}`)

const nailStyle = computed(() => {
  if (props.disabled) {
    return {
      position: 'relative' as const,
      top: '0px',
      zIndex: 1,
      width: '100%'
    }
  }

  return {
    position: 'sticky' as const,
    top: `${props.offsetTop}px`,
    zIndex: 5,
    width: '100%'
  }
})

defineOptions({ name: 'AffixView' })
</script>

<style scoped>
.nail-widget {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 40px;
}

.nail-widget.direction-left {
  flex-direction: row;
}

.nail-widget.direction-right {
  flex-direction: row-reverse;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.nail-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  flex-shrink: 0;
}

.nail-container {
  width: 100%;
}

.nail-footer {
  margin-top: auto;
}
</style>
