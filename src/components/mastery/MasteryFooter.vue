<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import MasteryControls from '@/components/mastery/MasteryControls.vue';
import HtmlLink from "@/components/HtmlLink.vue";

const {t} = useI18n();

const props = defineProps<{
  zoom: number;
  scaleExtent: number[];
  transformX: number;
  transformY: number;
  isDebug?: boolean;
}>();

const emit = defineEmits<{
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'set-scale', scale: number): void;
  (e: 'reset-view'): void;
}>();
</script>

<template>
  <div class="mastery-footer-toolbar px-8 py-3 d-flex align-center">
    <MasteryControls
        :zoom="zoom"
        :scale-extent="scaleExtent"
        @zoom-in="emit('zoom-in')"
        @zoom-out="emit('zoom-out')"
        @set-scale="emit('set-scale', $event)"
        @reset-view="emit('reset-view')"
    />

    <p class="text-caption opacity-60 pl-4">{{ t('mastery.dataSources') }}<HtmlLink :href="'https://skullandbonestools.de/en/loadout/mastery'">skullandbonestools</HtmlLink></p>

    <v-spacer></v-spacer>

    <!-- Debug S -->
    <v-chip v-if="isDebug" color="error" size="small" variant="flat" class="mr-3 font-weight-bold">
      <v-icon start size="14">mdi-bug</v-icon>
      {{ t('mastery.debugBadge') }}
    </v-chip>
    <!-- Debug E -->

    <span class="text-caption opacity-60 font-monospace">
      X: {{ Math.round(transformX) }} Y: {{ Math.round(transformY) }}
    </span>
  </div>
</template>

<style scoped lang="less">
.mastery-footer-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}
</style>
