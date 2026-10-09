<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-menu offset="8" :close-on-content-click="false">
        <template v-slot:activator="{ props }">
          <v-field variant="outlined"
                  :label="shapeType === 'path' ? t('map.pathColor') : t('map.borderColor')"
                  v-bind="props">
            <div class="d-flex align-center ga-2 py-2 px-3 cursor-pointer">
              <span class="color-swatch" :style="{ background: local.color }"></span>
              <span class="text-body-2">{{ local.color }}</span>
            </div>
          </v-field>
        </template>
        <v-color-picker
            :model-value="local.color"
            @update:model-value="pickColor($event, 'color')"
            mode="hex"></v-color-picker>
      </v-menu>
    </v-col>

    <v-col cols="12" md="6">
      <div class="d-flex align-center ga-4 w-100 h-100 style-row">
        <span class="text-body-2 text-medium-emphasis whitespace-nowrap">{{ t('map.lineWidth') }}</span>
        <v-slider
            :model-value="local.width"
            @update:model-value="patch({ width: $event })"
            min="1"
            max="20"
            step="1"
            thumb-label
            color="amber"
            class="flex-grow-1"></v-slider>
        <span class="text-body-2 width-value">{{ local.width }}</span>
      </div>
    </v-col>

    <v-col cols="12" md="6">
      <div class="d-flex align-center ga-4 w-100 h-100 style-row">
        <span class="text-body-2 text-medium-emphasis whitespace-nowrap">{{ t('map.lineOpacity') }}</span>
        <v-slider
            :model-value="local.opacity"
            @update:model-value="patch({ opacity: $event })"
            min="0"
            max="1"
            step="0.05"
            thumb-label
            color="amber"
            class="flex-grow-1"></v-slider>
        <span class="text-body-2 width-value">{{ Math.round((local.opacity ?? 0) * 100) }}%</span>
      </div>
    </v-col>

    <v-col cols="12" md="6">
      <v-switch
          :model-value="local.dashed"
          @update:model-value="patch({ dashed: $event })"
          :label="t('map.dashedLine')"
          color="amber"
          hide-details
          density="compact"></v-switch>
    </v-col>

    <v-col cols="12" md="6">
      <v-switch
          :model-value="local.smoothed"
          @update:model-value="patch({ smoothed: $event })"
          :label="shapeType === 'path' ? t('map.smoothCurve') : t('map.smoothRegion')"
          color="amber"
          hide-details
          density="compact"></v-switch>
    </v-col>

    <template v-if="shapeType === 'region'">
      <v-col cols="12" md="6">
        <v-menu offset="8" :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <v-field variant="outlined" :label="t('map.fillColor')" v-bind="props">
              <div class="d-flex align-center ga-2 py-2 px-3 cursor-pointer">
                <span class="color-swatch" :style="{ background: local.fillColor }"></span>
                <span class="text-body-2">{{ local.fillColor }}</span>
              </div>
            </v-field>
          </template>
          <v-color-picker
              :model-value="local.fillColor"
              @update:model-value="pickColor($event, 'fillColor')"
              mode="hex"></v-color-picker>
        </v-menu>
      </v-col>

      <v-col cols="12" md="6">
        <div class="d-flex align-center ga-4 w-100 h-100 style-row">
          <span class="text-body-2 text-medium-emphasis whitespace-nowrap">{{ t('map.fillOpacity') }}</span>
          <v-slider
              :model-value="local.fillOpacity"
              @update:model-value="patch({ fillOpacity: $event })"
              min="0"
              max="1"
              step="0.05"
              thumb-label
              color="amber"
              class="flex-grow-1"></v-slider>
          <span class="text-body-2 width-value">{{ Math.round((local.fillOpacity ?? 0) * 100) }}%</span>
        </div>
      </v-col>
    </template>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MapShapeType, ShapeStyle } from '@/assets/types/Map';

const props = defineProps<{
  shapeType: MapShapeType;
  style: ShapeStyle;
}>();

const emit = defineEmits(['update:style']);

const { t } = useI18n();

const local = computed(() => props.style);

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * 取色器回调：Vuetify 下发 {hex,...} 对象。
 * 仅在得到合法 6 位 hex 时回写，避免空值（nullColor 黑色）污染样式。
 */
const pickColor = (v: any, key: 'color' | 'fillColor') => {
  const hex = String(v?.hex ?? v ?? '').trim();
  if (HEX_RE.test(hex)) patch({ [key]: hex });
};

const patch = (data: Partial<ShapeStyle>) => {
  emit('update:style', { ...props.style, ...data });
};

defineOptions({ name: 'MapShapeStyleFields' });
</script>

<style scoped>
.color-swatch {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgb(var(--v-theme-on-surface) / 0.25);
  flex: none;
}

.cursor-pointer {
  cursor: pointer;
}

.style-row {
  padding: 0 4px;
}

.width-value {
  min-width: 38px;
  text-align: right;
}

.whitespace-nowrap {
  white-space: nowrap;
}
</style>
