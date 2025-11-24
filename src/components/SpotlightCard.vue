<script setup lang="ts">
import {ref, useTemplateRef} from 'vue';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps {
  className?: string;
  spotlightColor?: string;
}

const {className = '', spotlightColor = 'rgba(255, 255, 255, 1)'} = defineProps<SpotlightCardProps>();

const divRef = useTemplateRef<HTMLDivElement>('divRef');
const isFocused = ref<boolean>(false);
const position = ref<Position>({x: 0, y: 0});
const opacity = ref<number>(0);

const handleMouseMove = (e: MouseEvent) => {
  if (!divRef.value || isFocused.value) return;

  const rect = divRef.value.getBoundingClientRect();
  position.value = {x: e.clientX - rect.left, y: e.clientY - rect.top};
};

const handleFocus = () => {
  isFocused.value = true;
  opacity.value = 0.6;
};

const handleBlur = () => {
  isFocused.value = false;
  opacity.value = 0;
};

const handleMouseEnter = () => {
  opacity.value = 0.6;
};

const handleMouseLeave = () => {
  opacity.value = 0;
};
</script>

<template>
  <div
      class="position-relative"
      ref="divRef"
      @mousemove="handleMouseMove"
      @focus="handleFocus"
      @blur="handleBlur"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      :class="['position-relative overflow-hidden pa-5', className]">
    <div
        class="w-100 h-100 left-0 top-0 pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        :style="{
        opacity,
        background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`
      }"/>

    <slot/>
  </div>
</template>

<style scoped lang="less">
:root {
  --ease-in-out: cubic-bezier(.4, 0, .2, 1);
}

.ease-in-out {
  --tw-ease: var(--ease-in-out);
  transition-timing-function: var(--ease-in-out);
}

.duration-500 {
  --tw-duration: .5s;
  transition-duration: 0.5s;
}

.inset-0 {
  inset: calc(var(10) * 0);
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}

.absolute {
  position: absolute;
}
</style>
