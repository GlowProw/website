<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import type {Mastery} from 'glow-prow-data';

const {t} = useI18n();

const props = defineProps<{
  isDebug: boolean;
  selectedNode: Mastery | null;
}>();

const emit = defineEmits<{
  (e: 'export-json'): void;
  (e: 'update-coordinate'): void;
  (e: 'update-requisite'): void;
}>();
</script>

<template>
  <v-card
      v-if="isDebug"
      border
      elevation="20"
      width="340"
      class="mastery-debug-panel bg-surface-darken-2"
  >
    <div class="d-flex align-center justify-space-between pa-2 bg-error text-white font-weight-bold text-caption">
      <span><v-icon size="14" start>mdi-bug</v-icon>{{ t('mastery.debug.title') }}</span>
      <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click="emit('export-json')" :title="t('mastery.debug.exportJson')"></v-btn>
    </div>
    <div class="pa-3 text-caption">
      <div v-if="selectedNode">
        <div class="mb-1"><strong>{{ t('mastery.debug.selectedNode') }}:</strong> {{ selectedNode.id }} ({{ selectedNode.skill }})</div>
        <v-row no-gutters class="gap-2 mb-2">
          <v-col>
            <v-text-field
                v-model.number="selectedNode.position.x"
                :label="t('mastery.debug.coordX')"
                density="compact"
                variant="outlined"
                hide-details
                type="number"
                @update:model-value="emit('update-coordinate')"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
                v-model.number="selectedNode.position.y"
                :label="t('mastery.debug.coordY')"
                density="compact"
                variant="outlined"
                hide-details
                type="number"
                @update:model-value="emit('update-coordinate')"
            ></v-text-field>
          </v-col>
        </v-row>
        <div class="mb-1"><strong>{{ t('mastery.debug.requisites') }}:</strong></div>
        <v-combobox
            v-model="selectedNode.requisite"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
            :placeholder="t('mastery.debug.requisitesPlaceholder')"
            @update:model-value="emit('update-requisite')"
        ></v-combobox>
      </div>
      <div v-else class="opacity-60 text-center py-2">
        {{ t('mastery.debug.clickHint') }}
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="less">
.mastery-debug-panel {
  position: absolute;
  top: 76px;
  right: 16px;
  z-index: 30;
  border-radius: 8px;
  pointer-events: auto;
}
</style>
