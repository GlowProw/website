<template>
  <!-- 路径/区域样式迷你预览 -->
  <svg :width="width" :height="height" viewBox="0 0 46 20" aria-hidden="true">
    <template v-if="shapeType === 'path'">
      <path d="M2 14 C 12 2, 22 18, 44 6" fill="none"
            :stroke="resolved.color"
            :stroke-opacity="resolved.opacity"
            :stroke-width="Math.min(5, resolved.width) / scale"
            :stroke-dasharray="resolved.dashed ? `${5 / scale} ${3 / scale}` : undefined"
            stroke-linecap="round"/>
    </template>
    <template v-else>
      <polygon points="6,3 40,3 44,16 3,17"
               :fill="resolved.fillColor"
               :fill-opacity="resolved.fillOpacity"
               :stroke="resolved.color"
               :stroke-opacity="resolved.opacity"
               :stroke-width="Math.min(4, resolved.width) / scale"
               :stroke-dasharray="resolved.dashed ? `${4 / scale} ${3 / scale}` : undefined"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {MapShapeType, resolveShapeStyle, ShapeStyle} from '@/assets/types/Map';

const props = withDefaults(defineProps<{
  shapeType: MapShapeType;
  shapeStyle?: ShapeStyle | null;
  width?: number;
  height?: number;
}>(), {
  shapeStyle: null,
  width: 46,
  height: 20,
});

/** 
 * 补全默认颜色/透明度，旧数据也能正确呈现
 */
const resolved = computed(() => resolveShapeStyle(props.shapeStyle, props.shapeType));

/** 
 * SVG 等比缩放系数（preserveAspectRatio=meet），用于抵消描边/虚线的放大
 */
const scale = computed(() => Math.max(0.01, Math.min(props.width / 46, props.height / 20)));

defineOptions({
    name: 'MapShapeStylePreview'
});
</script>
