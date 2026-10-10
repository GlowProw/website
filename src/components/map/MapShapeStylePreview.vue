<template>
  <!-- 路径/区域样式迷你预览 -->
  <svg :width="width" :height="height" viewBox="0 0 100 60" aria-hidden="true" class="map-shape-style-preview">
    <template v-if="shapeType === 'path'">
      <path :d="resolved.smoothed ? 'M 10 42 C 32 8, 65 52, 90 18' : 'M 10 42 L 35 14 L 65 46 L 90 18'"
            fill="none"
            :stroke="resolved.color"
            :stroke-opacity="resolved.opacity"
            :stroke-width="resolved.width"
            :stroke-dasharray="resolved.dashed ? `${resolved.width * 3.5} ${resolved.width * 2.5}` : undefined"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"/>
    </template>
    <template v-else>
      <path :d="resolved.smoothed ? 'M 24 14 C 55 6, 78 8, 86 18 C 94 28, 92 42, 82 48 C 65 54, 30 53, 16 46 C 8 38, 8 22, 24 14 Z' : 'M 14 14 L 84 10 L 92 48 L 8 50 Z'"
            :fill="resolved.fillColor"
            :fill-opacity="resolved.fillOpacity"
            :stroke="resolved.color"
            :stroke-opacity="resolved.opacity"
            :stroke-width="resolved.width"
            :stroke-dasharray="resolved.dashed ? `${resolved.width * 3.5} ${resolved.width * 2.5}` : undefined"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"/>
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
 * 补全默认颜色/透明度
 * 确保旧数据也能正确呈现
 */
const resolved = computed(() => resolveShapeStyle(props.shapeStyle, props.shapeType));

defineOptions({
  name: 'MapShapeStylePreview'
});
</script>

<style scoped>
.map-shape-style-preview {
  display: inline-block;
  vertical-align: middle;
  overflow: visible;
}
</style>
