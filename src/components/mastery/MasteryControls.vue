<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import RhombusWidget from '@/components/snbWidget/rhombusWidget.vue';

const {t} = useI18n();

const props = defineProps<{
  zoom: number;
  scaleExtent: number[];
}>();

const emit = defineEmits<{
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'set-scale', scale: number): void;
  (e: 'reset-view'): void;
}>();
</script>

<template>
  <v-card border class="d-inline-flex py-1 px-2 align-center bg-surface-darken-1 mastery-controls">
    <v-icon class="mr-1 opacity-60" size="14">mdi-magnify-scan</v-icon>
    <span class="text-caption opacity-60 mr-2">{{ Math.abs(zoom).toFixed(1) }}x</span>

    <v-btn icon="mdi-minus" size="x-small" variant="text" :title="t('mastery.zoomOut')" @click="emit('zoom-out')"></v-btn>
    <div v-for="(z, zIndex) in scaleExtent" :key="zIndex" class="d-inline-flex">
      <RhombusWidget
          :size="6"
          :activate="z.toFixed(1) === Math.abs(zoom).toFixed(1)"
          :solid="z.toFixed(1) === Math.abs(zoom).toFixed(1)"
          @click="emit('set-scale', z)"
          class="pa-1 cursor-pointer"
          :title="t('mastery.zoomTo', { zoom: z })"
      />
    </div>
    <v-btn icon="mdi-crosshairs-gps" size="x-small" variant="text" @click="emit('reset-view')" :title="t('mastery.resetView')"></v-btn>
    <v-btn icon="mdi-plus" size="x-small" variant="text" :title="t('mastery.zoomIn')" @click="emit('zoom-in')"></v-btn>
  </v-card>
</template>

<style scoped lang="less">
.mastery-controls {
  border-radius: 6px;
  background-color: rgba(20, 27, 36, 0.85) !important;
  backdrop-filter: blur(8px);
}
</style>
