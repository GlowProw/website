<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="720">
    <v-card border elevation="16" class="edit-marker-dialog">
      <v-card-title class="d-flex align-center justify-space-between pt-4 px-6 pb-2">
        <div class="d-flex align-center">
          <v-icon color="amber" class="mr-2">mdi-pencil-box-outline</v-icon>
          <span class="text-h6 font-weight-bold">{{ t('map.contextMenu.editMarkerTitle') || '编辑地图标记 (DEBUG)' }}</span>
        </div>
        <v-btn variant="text" icon density="comfortable" @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <div class="px-6 pt-1">
        <v-tabs v-model="activeTab" density="compact" color="amber">
          <v-tab value="form">
            <v-icon start size="16">mdi-form-select</v-icon>
            {{ t('map.contextMenu.editMarkerForm') || '表单模式' }}
          </v-tab>
          <v-tab value="json">
            <v-icon start size="16">mdi-code-json</v-icon>
            {{ t('map.contextMenu.editMarkerJson') || 'JSON 模式' }}
          </v-tab>
        </v-tabs>
      </div>

      <v-divider class="my-2"></v-divider>

      <v-card-text class="px-6 py-4" style="max-height: 65vh; overflow-y: auto;">
        <!-- 表单模式 -->
        <v-window v-model="activeTab">
          <v-window-item value="form">
            <v-form ref="formRef" @submit.prevent="onSave">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                      v-model="formData.id"
                      :label="t('map.contextMenu.markerId') || '标记 ID'"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-identifier"
                      :rules="[v => !!v || 'ID 不能为空']"
                      required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-autocomplete
                      v-model="formData.category"
                      :items="availableCategories"
                      item-value="value"
                      item-title="text"
                      :label="t('map.contextMenu.markerCategory') || '标记类型'"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || '请选择类型']"
                      required>
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-img
                              v-if="getCategoryIcon(item.raw.value)"
                              :src="getCategoryIcon(item.raw.value)"
                              width="20"
                              height="20"
                              class="mr-2"
                              cover
                          />
                        </template>
                      </v-list-item>
                    </template>
                    <template v-slot:prepend-inner>
                      <v-img
                          v-if="formData.category && getCategoryIcon(formData.category)"
                          :src="getCategoryIcon(formData.category)"
                          width="20"
                          height="20"
                          class="mr-1"
                          cover
                      />
                    </template>
                  </v-autocomplete>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                      v-model="formData.name"
                      :label="t('map.contextMenu.markerName') || '标记名称 / 备注'"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-tag-text-outline"
                      placeholder="可选名称"
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                      v-model.number="formData.longitude"
                      :label="t('map.longitude') || '经度 Longitude'"
                      type="number"
                      step="0.000001"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-longitude"
                      :rules="[v => v !== undefined && v !== null && !isNaN(v) || '请输入有效经度']"
                      required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                      v-model.number="formData.latitude"
                      :label="t('map.latitude') || '纬度 Latitude'"
                      type="number"
                      step="0.000001"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-latitude"
                      :rules="[v => v !== undefined && v !== null && !isNaN(v) || '请输入有效纬度']"
                      required
                  />
                </v-col>

                <v-col cols="12" sm="6" v-if="formData.baseRank !== undefined || isRankCategory">
                  <v-text-field
                      v-model.number="formData.baseRank"
                      label="据点等级 BaseRank"
                      type="number"
                      step="1"
                      min="1"
                      max="20"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-shield-star"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                      v-model="formData.description"
                      :label="t('map.markerDescription') || '标记描述 Description'"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                      auto-grow
                      prepend-inner-icon="mdi-text"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- JSON 模式 -->
          <v-window-item value="json">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption opacity-70">直接编辑原始 JSON 数据（支持所有扩展字段）</span>
              <div class="d-flex gap-2">
                <v-btn size="x-small" variant="text" prepend-icon="mdi-content-copy" @click="copyJson">
                  复制 JSON
                </v-btn>
                <v-btn size="x-small" variant="text" prepend-icon="mdi-format-align-left" @click="formatJson">
                  格式化
                </v-btn>
              </div>
            </div>
            <v-alert v-if="jsonError" type="error" density="compact" variant="tonal" class="mb-3">
              {{ jsonError }}
            </v-alert>
            <v-textarea
                v-model="rawJsonText"
                variant="outlined"
                class="json-editor-textarea"
                rows="14"
                no-resize
                font-family="monospace"
                @update:model-value="onJsonInput"
            />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="px-6 py-4">
        <v-btn size="small" variant="tonal" color="info" prepend-icon="mdi-content-copy" @click="copyMarkerInfo">
          复制标记信息
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="emit('cancel')">
          {{ t('basic.button.cancel') || '取消' }}
        </v-btn>
        <v-btn color="amber" variant="flat" prepend-icon="mdi-content-save" @click="onSave">
          {{ t('basic.button.save') || '保存' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNoticeStore } from '~/stores/noticeStore';

const props = defineProps<{
  modelValue: boolean;
  markerData: any;
  availableCategories: Array<{ value: string; text: string }>;
  getCategoryIcon: (category: string) => string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', updatedData: any): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const notice = useNoticeStore();

const activeTab = ref<'form' | 'json'>('form');
const formRef = ref<any>(null);
const formData = ref<Record<string, any>>({});
const rawJsonText = ref<string>('');
const jsonError = ref<string | null>(null);

const isRankCategory = computed(() => {
  return ['den', 'outpost', 'megafort', 'militaryBase'].includes(formData.value?.category);
});

// 初始化数据
watch(() => props.markerData, (newVal) => {
  if (newVal) {
    formData.value = JSON.parse(JSON.stringify(newVal));
    rawJsonText.value = JSON.stringify(newVal, null, 2);
    jsonError.value = null;
  }
}, { immediate: true, deep: true });

// 切换到 JSON 标签时，同步表单数据
watch(activeTab, (tab) => {
  if (tab === 'json') {
    rawJsonText.value = JSON.stringify(formData.value, null, 2);
    jsonError.value = null;
  } else if (tab === 'form') {
    try {
      formData.value = JSON.parse(rawJsonText.value);
      jsonError.value = null;
    } catch (e: any) {
      jsonError.value = e.message || 'JSON 格式错误';
    }
  }
});

const onJsonInput = (val: string) => {
  try {
    const parsed = JSON.parse(val);
    formData.value = parsed;
    jsonError.value = null;
  } catch (e: any) {
    jsonError.value = e.message;
  }
};

const formatJson = () => {
  try {
    const parsed = JSON.parse(rawJsonText.value);
    rawJsonText.value = JSON.stringify(parsed, null, 2);
    formData.value = parsed;
    jsonError.value = null;
  } catch (e: any) {
    jsonError.value = e.message;
  }
};

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(rawJsonText.value);
    notice.success(t('map.contextMenu.copiedMarkerJsonTip') || '标记 JSON 已复制到剪贴板');
  } catch (e) {
    console.error('Copy failed', e);
  }
};

const copyMarkerInfo = async () => {
  try {
    const data = activeTab.value === 'json' ? JSON.parse(rawJsonText.value) : formData.value;
    const summary = `ID: ${data.id}\n类型: ${data.category}\n经纬度: [${data.longitude}, ${data.latitude}]${data.name ? `\n名称: ${data.name}` : ''}`;
    await navigator.clipboard.writeText(summary);
    notice.success('标记信息已复制到剪贴板');
  } catch (e) {
    console.error('Copy info failed', e);
  }
};

const onSave = async () => {
  if (activeTab.value === 'json') {
    try {
      const parsed = JSON.parse(rawJsonText.value);
      if (!parsed.id) {
        notice.error('标记 ID 不能为空');
        return;
      }
      emit('save', parsed);
    } catch (e: any) {
      jsonError.value = e.message;
      notice.error(t('map.contextMenu.invalidJson') || 'JSON 格式错误，请检查');
    }
  } else {
    if (formRef.value) {
      const { valid } = await formRef.value.validate();
      if (!valid) return;
    }
    emit('save', JSON.parse(JSON.stringify(formData.value)));
  }
};

defineOptions({ name: 'MapEditMarkerDialog' });
</script>

<style scoped>
.edit-marker-dialog {
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / 0.95);
  backdrop-filter: blur(16px);
}

.json-editor-textarea :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
}
</style>
