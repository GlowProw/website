<script setup lang="ts">
import {computed} from 'vue';

const props = withDefaults(defineProps<{
  offsetX?: number | string;
  offsetY?: number | string;
  patternSize?: number | string;
  patternColor?: string;
  circleSize?: number | string;
  circleColor?: string;
}>(), {
  offsetX: 0,
  offsetY: 0,
  patternSize: 100,
  patternColor: 'rgba(255, 255, 255, 0.01)',
  circleSize: 212,
  circleColor: 'rgba(255, 216, 2, 0.01)'
});

const formatPixel = (val?: number | string): string => {
  if (val === undefined || val === null) return '0px';
  if (typeof val === 'number') return `${val}px`;
  const s = String(val).trim();
  if (!s) return '0px';
  return isNaN(Number(s)) ? s : `${s}px`;
};

const circlesStyle = computed(() => {
  return {
    '--offset-x': formatPixel(props.offsetX),
    '--offset-y': formatPixel(props.offsetY),
    '--size': formatPixel(props.circleSize),
    '--color': props.circleColor
  };
});

const patternStyle = computed(() => {
  return {
    '--offset-x': formatPixel(props.offsetX),
    '--offset-y': formatPixel(props.offsetY),
    '--size': formatPixel(props.patternSize),
    '--color': props.patternColor
  };
});

defineOptions({
  name: 'StylizedLineBackground'
});
</script>

<template>
  <div class="stylized-line-background overlapping-circles" :style="circlesStyle">
    <div class="overlapping-pattern h-100 w-100" :style="patternStyle">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="less">
.stylized-line-background {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.overlapping-pattern {
  background-image: linear-gradient(to right,
  transparent calc(var(--size, 100px) + 0px),
  var(--color, rgba(255, 255, 255, 0.05)) calc(var(--size, 100px) + 1px),
  var(--color, rgba(255, 255, 255, 0.05)) calc(var(--size, 100px) + 2px),
  transparent calc(var(--size, 100px) + 3px)),
  linear-gradient(to bottom,
  transparent calc(var(--size, 100px) + 0px),
  var(--color, rgba(255, 255, 255, 0.05)) calc(var(--size, 100px) + 1px),
  var(--color, rgba(255, 255, 255, 0.05)) calc(var(--size, 100px) + 2px),
  transparent calc(var(--size, 100px) + 3px));

  background-size: 236px 236px;
  background-repeat: repeat;
  background-position: var(--offset-x, 0px) var(--offset-y, 0px);
}

.overlapping-circles {
  background-image: radial-gradient(circle at calc(50%) calc(50%),
  transparent calc(var(--size, 212px) + 0px),
  var(--color, rgba(255, 216, 2, 0.1)) calc(var(--size, 212px) + 1px),
  transparent calc(var(--size, 212px) + 3px));

  background-size: calc(var(--size, 212px) + 210px) calc(var(--size, 212px) + 210px);
  background-repeat: repeat;
  background-position: var(--offset-x, 0px) var(--offset-y, 0px);
}
</style>
