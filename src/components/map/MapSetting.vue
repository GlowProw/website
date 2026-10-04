<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      max-width="850px"
      scrollable
      :fullscreen="mobile">
    <v-card class="map-setting-card">
      <v-card-title class="d-flex align-center py-3 px-6 bg-surface-variant-light">
        <v-icon icon="mdi-cog" color="amber" class="mr-2"></v-icon>
        <span class="font-weight-bold">{{ t('map.settings') }}</span>
        <v-spacer></v-spacer>
        <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="emit('update:modelValue', false)">
        </v-btn>
      </v-card-title>

      <v-tabs v-model="activeTab" color="amber" density="comfortable" class="border-b px-4">
        <v-tab value="general">
          <v-icon icon="mdi-tune" start></v-icon>
          {{ t('map.generalSettings') }}
        </v-tab>
        <v-tab value="zoom">
          <v-icon icon="mdi-map-marker-distance" start></v-icon>
          {{ t('map.markerZoomSettings') }}
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-4 pa-md-6" style="max-height: 65vh">
        <!-- 常规设置 S -->
        <div v-show="activeTab === 'general'">
          <v-card border elevation="0" class="mb-4">
            <v-list class="bg-transparent" lines="two">
              <v-list-item>
                <template v-slot:prepend>
                  <v-avatar color="amber-lighten-4" class="text-amber-darken-3 mr-2">
                    <v-icon icon="mdi-bookmark-check-outline"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ t('map.rememberMarkerSelection') }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption opacity-70">
                  {{ t('map.rememberMarkerSelectionDesc') }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-switch
                      v-model="rememberMarkerSelection"
                      color="amber"
                      hide-details
                      inset
                      @update:model-value="onToggleRememberSelection">
                  </v-switch>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </div>
        <!-- 常规设置 E -->

        <!-- 标记缩放与尺寸设置 S -->
        <div v-show="activeTab === 'zoom'">
          <v-alert
              type="info"
              variant="tonal"
              density="compact"
              color="amber"
              icon="mdi-information-outline"
              class="mb-4 text-caption">
            <div>{{ t('map.markerZoomSettingsDesc') }}</div>
            <div class="opacity-70 mt-1">{{ t('map.zoomLevelHint') }}</div>
          </v-alert>

          <!-- 快速预设按钮栏 -->
          <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <span class="text-caption opacity-70 mr-2">{{ t('map.batchConfig') }}:</span>
            <v-btn
                size="small"
                variant="outlined"
                color="amber"
                prepend-icon="mdi-restore"
                @click="onApplyPreset('default')">
              {{ t('map.presetDefault') }}
            </v-btn>
            <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-eye-outline"
                @click="onApplyPreset('allVisible')">
              {{ t('map.presetAlwaysVisible') }}
            </v-btn>
          </div>

          <!-- 分组配置折叠面板 -->
          <v-expansion-panels v-model="openedPanels" multiple variant="accordion" class="zoom-config-panels">
            <v-expansion-panel
                v-for="(categories, groupName) in groupedCategories"
                :key="groupName"
                class="mb-2 border rounded">
              <v-expansion-panel-title class="py-2 px-4">
                <div class="d-flex align-center justify-space-between w-100 pr-2">
                  <div class="d-flex align-center font-weight-medium">
                    <v-icon icon="mdi-folder-marker-outline" color="amber" class="mr-2" size="small"></v-icon>
                    <span>{{ groupName === 'other' ? t('map.groups.other') : t(`map.groups.${groupName}`) }}</span>
                    <v-chip size="x-small" class="ml-2" variant="tonal">{{ categories.length }}</v-chip>
                  </div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text class="pt-2 px-1">
                <v-row density="comfortable">
                  <v-col
                      cols="12"
                      v-for="cat in categories"
                      :key="cat.value">
                    <v-card border elevation="0" class="pa-3 mb-2 bg-surface-light">
                      <div class="d-flex align-center mb-3">
                        <v-avatar size="32" class="mr-3 bg-black">
                          <v-img :src="getCategoryIcon(cat.value)" cover width="24" height="24"></v-img>
                        </v-avatar>
                        <div>
                          <div class="font-weight-medium text-body-2">{{ cat.text }}</div>
                          <div class="text-caption opacity-60">
                            {{ t('map.visibleZoomRange') }}:
                            Zoom {{ getCategoryRule(cat.value).minZoom }} - {{ getCategoryRule(cat.value).maxZoom }}
                          </div>
                        </div>
                      </div>

                      <!-- 可见层级范围 Slider -->
                      <div class="px-2 mb-2">
                        <div class="d-flex justify-space-between text-caption opacity-70 mb-1">
                          <span>{{ t('map.visibleZoomRange') }}</span>
                          <span class="font-weight-bold text-amber">
                            Zoom {{ getCategoryRule(cat.value).minZoom }} ~ {{ getCategoryRule(cat.value).maxZoom }}
                          </span>
                        </div>
                        <v-range-slider
                            :model-value="[getCategoryRule(cat.value).minZoom, getCategoryRule(cat.value).maxZoom]"
                            @update:model-value="onUpdateCategoryZoomRange(cat.value, $event)"
                            :min="12"
                            :max="15"
                            :step="1"
                            color="amber"
                            thumb-size="14"
                            show-ticks="always"
                            step-ticks
                            hide-details
                            density="compact">
                          <template v-slot:tick-label="{ tick }">
                            <span class="text-caption" style="font-size: 10px">{{ tick.value }}</span>
                          </template>
                        </v-range-slider>
                      </div>

                      <!-- 各 Zoom 尺寸调整 -->
                      <div class="px-2 pt-2 border-t mt-2">
                        <div class="text-caption opacity-70 mb-2">图标尺寸比例 (Scale):</div>
                        <v-row density="compact">
                          <v-col
                              cols="6"
                              sm="3"
                              v-for="zoomLevel in [12, 13, 14, 15]"
                              :key="zoomLevel">
                            <div class="text-caption d-flex justify-space-between" style="font-size: 11px">
                              <span>Zoom {{ zoomLevel }}:</span>
                              <span class="font-weight-bold">{{ (getCategoryScaleAtZoom(cat.value, zoomLevel)).toFixed(2) }}</span>
                            </div>
                            <v-slider
                                :model-value="getCategoryScaleAtZoom(cat.value, zoomLevel)"
                                @update:model-value="onUpdateCategoryScaleAtZoom(cat.value, zoomLevel, $event)"
                                :min="0.05"
                                :max="0.25"
                                :step="0.01"
                                color="amber"
                                thumb-size="12"
                                hide-details
                                density="compact">
                            </v-slider>
                          </v-col>
                        </v-row>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        <!-- 标记缩放与尺寸设置 E -->
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="py-3 px-6 bg-surface">
        <v-btn
            v-show="activeTab === 'zoom'"
            variant="text"
            color="error"
            density="comfortable"
            prepend-icon="mdi-restore"
            @click="onResetAllToDefault">
          {{ t('map.resetDefaults') }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
            variant="text"
            density="comfortable"
            @click="emit('update:modelValue', false)">
          {{ t('basic.cancel') }}
        </v-btn>
        <v-btn
            variant="flat"
            color="amber"
            density="comfortable"
            prepend-icon="mdi-content-save"
            @click="onSaveSettings">
          {{ t('map.saveSettings') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/framework';
import { storage_account } from '@/assets/sripts/index';
import { useNoticeStore } from '~/stores/noticeStore';
import {
  DEFAULT_CATEGORY_ZOOM_CONFIG,
  getActiveCategoryZoomConfig,
  type CategoryZoomRule
} from '@/assets/sripts/map_zoom_config';

const props = defineProps<{
  modelValue: boolean;
  getCategoryIcon: (category: string) => string;
  availableCategories?: any[];
  groupedCategories?: Record<string, any[]>;
}>();

const emit = defineEmits(['update:modelValue', 'config-changed']);

const { t } = useI18n();
const { mobile } = useDisplay();
const notice = useNoticeStore();

const activeTab = ref('general');
const openedPanels = ref<number[]>([0]);

// 常规设置：记录选择开关
const rememberMarkerSelection = ref(true);

// 自定义分类缩放配置（本地草稿状态）
const customConfig = ref<Record<string, CategoryZoomRule>>({});

const loadCurrentSettings = () => {
  rememberMarkerSelection.value = storage_account.getConfigurationItem('map', 'rememberMarkerSelection', { defaultValue: true });
  const active = getActiveCategoryZoomConfig();
  // 深拷贝
  customConfig.value = JSON.parse(JSON.stringify(active));
};

watch(() => props.modelValue, (val) => {
  if (val) {
    loadCurrentSettings();
  }
});

onMounted(() => {
  loadCurrentSettings();
});

const onToggleRememberSelection = (val: boolean) => {
  storage_account.updateConfiguration('map', 'rememberMarkerSelection', val);
  if (!val) {
    storage_account.updateConfiguration('map', 'marker.select', null);
  }
};

const getCategoryRule = (category: string): CategoryZoomRule => {
  if (!customConfig.value[category]) {
    const fallback = DEFAULT_CATEGORY_ZOOM_CONFIG[category] || DEFAULT_CATEGORY_ZOOM_CONFIG.default;
    customConfig.value[category] = JSON.parse(JSON.stringify(fallback));
  }
  return customConfig.value[category];
};

const getCategoryScaleAtZoom = (category: string, zoom: number): number => {
  const rule = getCategoryRule(category);
  if (rule.scales && rule.scales[zoom] !== undefined) {
    return rule.scales[zoom];
  }
  return rule.baseScale || 0.12;
};

const onUpdateCategoryZoomRange = (category: string, range: [number, number]) => {
  const rule = getCategoryRule(category);
  rule.minZoom = Math.min(range[0], range[1]);
  rule.maxZoom = Math.max(range[0], range[1]);
};

const onUpdateCategoryScaleAtZoom = (category: string, zoom: number, scale: number) => {
  const rule = getCategoryRule(category);
  if (!rule.scales) {
    rule.scales = {};
  }
  rule.scales[zoom] = Number(scale.toFixed(2));
};

const onApplyPreset = (type: 'default' | 'allVisible') => {
  if (type === 'default') {
    customConfig.value = JSON.parse(JSON.stringify(DEFAULT_CATEGORY_ZOOM_CONFIG));
    notice.success(t('map.resetSuccess'));
  } else if (type === 'allVisible') {
    Object.keys(customConfig.value).forEach(cat => {
      customConfig.value[cat].minZoom = 12;
      customConfig.value[cat].maxZoom = 15;
    });
    notice.success(t('map.presetAlwaysVisible'));
  }
};

const onResetAllToDefault = () => {
  customConfig.value = JSON.parse(JSON.stringify(DEFAULT_CATEGORY_ZOOM_CONFIG));
  storage_account.updateConfiguration('map', 'categoryZoomConfig', null);
  notice.success(t('map.resetSuccess'));
  emit('config-changed');
};

const onSaveSettings = () => {
  storage_account.updateConfiguration('map', 'rememberMarkerSelection', rememberMarkerSelection.value);
  storage_account.updateConfiguration('map', 'categoryZoomConfig', customConfig.value);
  notice.success(t('map.settingsSaved'));
  emit('config-changed');
  emit('update:modelValue', false);
};
</script>

<style scoped>
.map-setting-card {
  border-radius: 12px;
}
.zoom-config-panels :deep(.v-expansion-panel-title__overlay) {
  opacity: 0.04;
}
</style>
