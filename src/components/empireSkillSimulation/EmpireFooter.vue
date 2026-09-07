<script setup lang="ts">
import RhombusWidget from '@/components/snbWidget/rhombusWidget.vue';

const props = withDefaults(defineProps<{
  zoom: number;
  scaleExtent: number[];
  transformX: number;
  transformY: number;
  isDebug?: boolean;
}>(), {
  isDebug: false
});

const emit = defineEmits<{
  (e: 'set-scale', scale: number): void;
}>();
</script>

<template>
  <div class="skill-tree-footer-toolbar px-8 py-3 d-flex">
    <v-card border class="d-inline-flex mx-auto py-1 px-2 align-center">
      <v-icon class="mr-1 opacity-60" size="13">mdi-resize</v-icon>
      <span class="text-caption opacity-60 mr-2">{{ Math.abs(zoom).toFixed(1) }}</span>

      <div v-for="(z, zIndex) in scaleExtent" :key="zIndex">
        <RhombusWidget
            :size="6"
            :activate="z.toFixed(1) === Math.abs(zoom).toFixed(1)"
            :solid="z.toFixed(1) === Math.abs(zoom).toFixed(1)"
            @click="emit('set-scale', z)"
            class="pa-1"
        ></RhombusWidget>
      </div>
    </v-card>

    <v-spacer></v-spacer>

    <v-chip v-if="isDebug" color="error" size="small" variant="flat" class="mr-3 font-weight-bold">
      <v-icon start size="14">mdi-bug</v-icon>
      DEBUG 模式 (可拖拽节点/编辑关系)
    </v-chip>

    <span class="ml-3 text-caption opacity-60">
      {{ Math.round(transformX) }} {{ Math.round(transformY) }}
    </span>
  </div>
</template>

<style scoped lang="less">
.skill-tree-footer-toolbar {
  position: absolute;
  z-index: 100;
  width: 100%;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}
</style>
