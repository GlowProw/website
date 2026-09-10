<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import type {Mastery} from 'glow-prow-data';

const {t} = useI18n();

defineProps<{
  isDebug: boolean;
  selectedNode: Mastery | null;
}>();

const emit = defineEmits<{
  (e: 'export-json'): void;
}>();
</script>

<template>
  <v-card
      v-if="isDebug"
      border
      elevation="20"
      width="300"
      class="mastery-debug-panel bg-surface-darken-2">
    <div class="d-flex align-center justify-space-between pa-2 bg-error text-white font-weight-bold text-caption">
      <span><v-icon size="14" start>mdi-bug</v-icon>{{ t('mastery.debug.title') }}</span>
      <v-btn icon="mdi-content-copy" size="x-small" variant="text"
              :title="t('mastery.debug.exportJson')"
              @click="emit('export-json')"></v-btn>
    </div>
    <div class="pa-3 text-caption">
      <div v-if="selectedNode" class="mb-2">
        <div class="text-truncate">
          <strong>{{ t('mastery.debug.selectedNode') }}:</strong>
          {{ selectedNode.key }} <span class="opacity-60">({{ selectedNode.id }})</span>
        </div>
        <div class="opacity-70">
          x: {{ Math.round(selectedNode.position?.x ?? 0) }}，
          y: {{ Math.round(selectedNode.position?.y ?? 0) }}
        </div>
      </div>
      <p class="mb-1 opacity-80">
        <v-icon size="12">mdi-mouse-right-click</v-icon>
        {{ t('mastery.debug.contextMenuHint') }}
      </p>
      <p class="mb-0 opacity-60">{{ t('mastery.debug.dragHint') }}</p>
    </div>
  </v-card>
</template>

<style scoped lang="less">
.mastery-debug-panel {
  position: absolute;
  right: 16px;
  bottom: 64px;
  z-index: 90;
  border-radius: 8px;
  pointer-events: auto;
}
</style>
