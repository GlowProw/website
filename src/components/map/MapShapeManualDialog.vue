<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="720">
    <v-card border elevation="12" class="shape-manual-card overflow-y-auto">
      <!-- 标题区：与 MapLocationCard 完全一致的结构与琥珀色文字 -->
      <template v-slot:title>
        <div class="my-2 mr-2">
          <div class="d-flex align-center">
            <div class="mr-2">
              <v-icon color="amber" size="30">
                {{ shapeType === 'path' ? 'mdi-vector-polyline' : 'mdi-vector-polygon' }}
              </v-icon>
            </div>
            <div>
              <div class="d-flex align-center text-amber singe-line text-subtitle-1 font-weight-bold"
                   :title="dialogTitle">
                {{ dialogTitle }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <v-form ref="formRef">
        <!-- 基本信息 -->
        <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
          {{ t('map.basicInfo') }}
        </div>
        <div class="mx-5 mb-5 pt-3">
          <v-text-field
              :model-value="form.title"
              @update:model-value="patch({ title: $event })"
              :label="t('map.shapeName')"
              :rules="[v => !!v || t('map.titleRequired')]"
              variant="outlined"
              density="compact"
              class="mb-3"
              required></v-text-field>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                  :model-value="form.collectionUuid"
                  @update:model-value="onCollectionChange"
                  item-title="title"
                  item-value="uuid"
                  :items="collectionItems"
                  :label="t('map.selectCollection')"
                  :placeholder="t('map.noCollection')"
                  variant="outlined"
                  density="compact"
                  clearable></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-combobox
                  :model-value="form.tags"
                  @update:model-value="patch({ tags: $event })"
                  :label="t('map.tags')"
                  multiple
                  chips
                  variant="outlined"
                  density="compact"></v-combobox>
            </v-col>
          </v-row>
        </div>

        <!-- 样式 -->
        <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
          {{ t('map.style') }}
        </div>
        <div class="mx-5 mb-5 pt-3">
          <MapShapeStyleFields
              :shape-type="shapeType"
              :style="form.style"
              @update:style="patch({ style: $event })"></MapShapeStyleFields>
        </div>

        <!-- 坐标 -->
        <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
          {{ t('map.coordinates') }}
        </div>
        <div class="mx-5 mb-5 pt-3">
          <v-textarea
              :model-value="form.coordinatesText"
              @update:model-value="patch({ coordinatesText: $event })"
              :label="shapeType === 'path' ? t('map.pathCoordinatesHint') : t('map.regionCoordinatesHint')"
              :hint="shapeType === 'path' ? t('map.pathCoordinatesHelp') : t('map.regionCoordinatesHelp')"
              persistent-hint
              variant="outlined"
              density="compact"
              rows="6"
              :error-messages="coordinateError"
              class="mb-2"
              monospace></v-textarea>
        </div>

        <!-- 描述与可见性 -->
        <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
          {{ t('map.shapeDescription') }}
        </div>
        <div class="mx-5 mb-8 pt-3">
          <v-textarea
              :model-value="form.description"
              @update:model-value="patch({ description: $event })"
              :label="t('map.shapeDescription')"
              variant="outlined"
              density="compact"
              rows="3"
              class="mb-3"></v-textarea>

          <v-select
              :model-value="publicSelectValue"
              @update:model-value="patch({ public: $event })"
              item-title="label"
              item-value="value"
              :items="visibilityItems"
              :label="t('map.visibility')"
              variant="outlined"
              density="compact"
              :disabled="!!selectedCollection"
              :hint="selectedCollection ? t('map.publicFollowCollection') : undefined"
              persistent-hint></v-select>
        </div>

        <!-- 操作按钮 -->
        <div class="mx-5 mb-8 d-flex justify-end ga-2">
          <v-btn variant="text" @click="emit('cancel')">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="tonal" :loading="saving" @click="onSubmit">
            {{ isEdit ? t('basic.button.save') : t('basic.button.create') }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MapShapeStyleFields from '@/components/map/MapShapeStyleFields.vue';
import type { MapShapeType, ShapeGeometry, ShapeManualFormData } from '@/assets/types/Map';

const props = defineProps<{
  modelValue: boolean;
  shapeType: MapShapeType;
  form: ShapeManualFormData;
  userCollections: any[];
  saving: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:form', 'cancel', 'save']);

const { t } = useI18n();
const formRef = ref(null);
const coordinateError = ref('');

const isEdit = computed(() => !!props.form.uuid);

const dialogTitle = computed(() => isEdit.value
    ? t('map.editShapeTitle')
    : (props.shapeType === 'path' ? t('map.createPath') : t('map.createRegion')));

const collectionItems = computed(() => [
  { title: t('map.noCollection'), uuid: null },
  ...(props.userCollections || []),
]);

/** 可见性下拉项：公开 / 私有 */
const visibilityItems = computed(() => [
  { value: true, label: t('map.public') },
  { value: false, label: t('map.private') },
]);

/** 当前归属的地图集（选中"未分组"时为 undefined） */
const selectedCollection = computed(() =>
    (props.userCollections || []).find((c: any) => c.uuid === props.form.collectionUuid));

/** 归属地图集时显示地图集的公开状态，禁用选择（公开状态由地图集决定） */
const publicSelectValue = computed(() =>
    selectedCollection.value ? Number((selectedCollection.value as any).public) === 1 : props.form.public);

const patch = (data: Partial<ShapeManualFormData>) => {
  coordinateError.value = '';
  emit('update:form', { ...props.form, ...data });
};

/** 切换地图集归属时，公开状态同步跟随地图集；移出时保留当前值 */
const onCollectionChange = (uuid: string | null) => {
  const collection = (props.userCollections || []).find((c: any) => c.uuid === uuid);
  patch({
    collectionUuid: uuid || null,
    public: collection ? Number(collection.public) === 1 : props.form.public,
  });
};

/**
 * 解析每行一个坐标，支持：
 * 经度,纬度 / 经度，纬度 / 经度 纬度 / 经度\t纬度
 */
const parseCoordinates = (text: string): number[][] | null => {
  const lines = text.split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  const coords: number[][] = [];
  for (const line of lines) {
    const parts = line.split(/\s*[,，\s]\s*/).filter(Boolean);
    if (parts.length < 2) return null;
    const lon = Number(parts[0]);
    const lat = Number(parts[1]);
    if (Number.isNaN(lon) || Number.isNaN(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) {
      return null;
    }
    coords.push([lon, lat]);
  }
  return coords;
};

const onSubmit = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  const coords = parseCoordinates(props.form.coordinatesText);
  const minCount = props.shapeType === 'path' ? 2 : 3;
  if (!coords || coords.length < minCount) {
    coordinateError.value = props.shapeType === 'path'
        ? t('map.pathCoordinatesError')
        : t('map.regionCoordinatesError');
    return;
  }

  const geometry: ShapeGeometry = props.shapeType === 'path'
      ? { type: 'LineString', coordinates: coords }
      : { type: 'Polygon', coordinates: [[...coords, coords[0]]] };

  emit('save', { geometry });
};

defineExpose({ formRef });

defineOptions({ name: 'MapShapeManualDialog' });
</script>

<style scoped lang="less">
/* 视觉语言严格对齐 MapLocationCard：半透明玻璃模糊 + 琥珀色标题 + 黑色 30% 分节条 */
.shape-manual-card {
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
  backdrop-filter: blur(20px);
  max-height: 86vh;

  .map-title {
    marker: none;
    background-color: hsl(from #000 h s l / .3);
  }
}
</style>
