<template>
  <!-- 编辑地图区域/路径弹窗 -->
  <v-dialog :model-value="modelValue" persistent max-width="1024">
    <v-card border elevation="12">
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 shape-card">
        <v-icon size="72">{{ shapeType === 'path' ? 'mdi-vector-polyline' : 'mdi-vector-polygon' }}</v-icon>
      </v-card-title>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <v-card-text>
        <v-form ref="formRef">
          <v-row>
            <v-col cols="12" lg="6">
              <!-- 小型可交互地图容器 -->
              <v-card variant="tonal" height="260" class="position-relative overflow-hidden rounded-lg border">
                <MapView
                    :draggable="true"
                    :zoomable="true"
                    :initialZoom="13"
                    :latitude="centerLat"
                    :longitude="centerLon"
                    @map-created="onMiniMapCreated"
                />

                <!-- 地图控制小工具条 -->
                <div class="position-absolute top-0 left-0 right-0 pa-2 d-flex align-center justify-space-between mini-map-toolbar">
                  <span class="text-caption text-amber font-weight-medium">
                    {{ isDrawing ? t('map.drawOnMap') : t('map.editVertices') }}
                  </span>
                  <div class="d-flex ga-1">
                    <v-btn
                        size="x-small"
                        variant="tonal"
                        color="amber"
                        prepend-icon="mdi-pencil-ruler"
                        @click="startDraw">
                      {{ t('map.redraw') || '重新绘制' }}
                    </v-btn>
                  </div>
                </div>
              </v-card>

              <div class="mt-4">
                <MapShapeStyleFields
                    :shape-type="shapeType"
                    :style="form.style"
                    @update:style="patchStyle($event)"></MapShapeStyleFields>
              </div>
            </v-col>

            <v-col cols="12" lg="6">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                      :model-value="form.title"
                      @update:model-value="patch({ title: $event })"
                      :label="t('map.shapeName')"
                      :rules="[v => !!v || t('map.titleRequired')]"
                      variant="outlined"
                      required></v-text-field>
                </v-col>

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
                      clearable></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-combobox
                      :model-value="form.tags"
                      @update:model-value="patch({ tags: $event })"
                      :label="t('map.tags')"
                      multiple
                      chips
                      variant="outlined"></v-combobox>
                </v-col>

                <v-col cols="12">
                  <v-card border class="px-2 py-2">
                     <Textarea
                         :model-value="form.description"
                         @update:model-value="patch({ description: $event })"
                         :min-height="'160px'"
                         :value="form.description || t('map.shapeDescription')"
                         :placeholder="t('map.shapeDescription')"
                         :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']">
                    </Textarea>
                  </v-card>
                </v-col>

                <v-col cols="12">
                  <v-select
                      :model-value="publicSelectValue"
                      @update:model-value="patch({ public: $event })"
                      item-title="label"
                      item-value="value"
                      :items="visibilityItems"
                      :label="t('map.visibility')"
                      variant="outlined"
                      :disabled="!!selectedCollection"
                      :hint="selectedCollection ? t('map.publicFollowCollection') : undefined"
                      persistent-hint></v-select>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 py-4">
        <v-spacer></v-spacer>
        <v-btn @click="emit('cancel')" variant="text">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn @click="onSubmit" :loading="saving" variant="flat" color="amber">
          {{ mode === 'create' ? t('map.createShape') : t('basic.button.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import {fromLonLat, toLonLat} from 'ol/proj';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

import Textarea from '@/components/textarea/index.vue';
import MapShapeStyleFields from '@/components/map/MapShapeStyleFields.vue';
import {MapShapeType, ShapeFormData, ShapeGeometry, ShapeStyle} from '@/assets/types/Map';
import MapView from "@/components/map/MapView.vue";
import {createShapeOlStyle} from '@/assets/sripts/map_draw_controller';

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  shapeType: MapShapeType;
  form: ShapeFormData;
  userCollections: any[];
  saving: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:form', 'cancel', 'save']);

const {t} = useI18n();
const formRef = ref<any>(null);
const mapInstance = ref<Map | null>(null);
const vectorSource = new VectorSource();
let vectorLayer: VectorLayer<VectorSource> | null = null;
let drawInteraction: Draw | null = null;
let modifyInteraction: Modify | null = null;
const isDrawing = ref(false);

const centerLon = ref(-0.667206);
const centerLat = ref(0.626653);

const collectionItems = computed(() => [
  {title: t('map.noCollection'), uuid: null},
  ...(props.userCollections || []),
]);

/**
 * 可见性下拉项：公开 / 私有
 */
const visibilityItems = computed(() => [
  {value: true, label: t('map.public')},
  {value: false, label: t('map.private')},
]);

/**
 * 当前归属的地图集（"未分组"时为 undefined）
 */
const selectedCollection = computed(() =>
    (props.userCollections || []).find((c: any) => c.uuid === props.form.collectionUuid));

/**
 * 归属地图集时显示并跟随地图集公开状态，下拉禁用
 */
const publicSelectValue = computed(() =>
    selectedCollection.value ? Number((selectedCollection.value as any).public) === 1 : props.form.public);

/**
 * 切换地图集归属时公开状态同步跟随；移出地图集时保留当前值
 */
const onCollectionChange = (uuid: string | null) => {
  const collection = (props.userCollections || []).find((c: any) => c.uuid === uuid);
  patch({
    collectionUuid: uuid || null,
    public: collection ? Number(collection.public) === 1 : props.form.public,
  });
};

const patch = (data: Partial<ShapeFormData>) => {
  emit('update:form', {...props.form, ...data});
};

const patchStyle = (style: ShapeStyle) => {
  emit('update:form', {...props.form, style});
  updateFeatureStyle();
};

/**
 * 将 GeoJSON 几何提取为投影坐标 feature
 */
const createFeatureFromGeometry = (geo: ShapeGeometry): Feature => {
  let olGeom: SimpleGeometry;
  if (geo.type === 'LineString') {
    const coords = (geo.coordinates as number[][]).map(c => fromLonLat(c));
    olGeom = new LineString(coords);
  } else {
    const coords = ((geo.coordinates as number[][][])[0] || []).map(c => fromLonLat(c));
    olGeom = new Polygon([coords]);
  }
  const feature = new Feature({geometry: olGeom});
  feature.setStyle(createShapeOlStyle(props.shapeType, props.form.style));
  return feature;
};

/**
 * 从 feature 提取 GeoJSON 格式几何坐标
 */
const extractGeoJson = (feature: Feature): ShapeGeometry | null => {
  const geom = feature.getGeometry();
  if (!geom) return null;
  if (geom instanceof LineString) {
    const coords = geom.getCoordinates().map(c => toLonLat(c));
    return {type: 'LineString', coordinates: coords};
  }
  if (geom instanceof Polygon) {
    const rings = geom.getCoordinates().map(ring => ring.map(c => toLonLat(c)));
    return {type: 'Polygon', coordinates: rings};
  }
  return null;
};

/**
 * 同步样式到地图图层上的 feature
 */
const updateFeatureStyle = () => {
  const features = vectorSource.getFeatures();
  features.forEach(f => {
    f.setStyle(createShapeOlStyle(props.shapeType, props.form.style));
  });
};

/**
 * 小型地图初始化完成回调
 */
const onMiniMapCreated = (map: Map) => {
  mapInstance.value = map;
  if (!vectorLayer) {
    vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 10,
    });
    map.addLayer(vectorLayer);
  }

  // 顶点编辑
  if (!modifyInteraction) {
    modifyInteraction = new Modify({source: vectorSource});
    modifyInteraction.on('modifyend', () => {
      const features = vectorSource.getFeatures();
      if (features.length > 0) {
        const geo = extractGeoJson(features[0]);
        if (geo) patch({geometry: geo});
      }
    });
    map.addInteraction(modifyInteraction);
  }

  loadFeatureToMap();
};

/**
 * 加载已有或初始图形到地图
 */
const loadFeatureToMap = () => {
  vectorSource.clear();
  if (props.form.geometry) {
    const feature = createFeatureFromGeometry(props.form.geometry);
    vectorSource.addFeature(feature);
    const extent = feature.getGeometry()?.getExtent();
    if (extent && mapInstance.value) {
      mapInstance.value.getView().fit(extent, {padding: [30, 30, 30, 30], maxZoom: 14});
    }
  } else if (props.mode === 'create') {
    startDraw();
  }
};

/**
 * 启动绘制模式
 */
const startDraw = () => {
  if (!mapInstance.value) return;
  if (drawInteraction) {
    mapInstance.value.removeInteraction(drawInteraction);
    drawInteraction = null;
  }
  vectorSource.clear();
  isDrawing.value = true;

  drawInteraction = new Draw({
    source: vectorSource,
    type: props.shapeType === 'path' ? 'LineString' : 'Polygon',
  });

  drawInteraction.on('drawend', (evt) => {
    isDrawing.value = false;
    const drawn = evt.feature;
    drawn.setStyle(createShapeOlStyle(props.shapeType, props.form.style));
    setTimeout(() => {
      if (mapInstance.value && drawInteraction) {
        mapInstance.value.removeInteraction(drawInteraction);
        drawInteraction = null;
      }
      const geo = extractGeoJson(drawn);
      if (geo) patch({geometry: geo});
    }, 50);
  });

  mapInstance.value.addInteraction(drawInteraction);
};

watch(() => props.modelValue, (visible) => {
  if (visible) {
    setTimeout(() => {
      if (mapInstance.value) {
        mapInstance.value.updateSize();
        loadFeatureToMap();
      }
    }, 200);
  }
});

const onSubmit = async () => {
  if (formRef.value) {
    const {valid} = await formRef.value.validate();
    if (!valid) return;
  }
  emit('save');
};

defineExpose({formRef});

defineOptions({
  name: 'MapShapeEditDialog'
});
</script>

<style scoped>
.shape-card {
  margin-top: -80px !important;
}

.mini-map-toolbar {
  z-index: 20;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%);
  pointer-events: auto;
}
</style>

<style scoped>
.shape-card {
  margin-top: -80px !important;
}
</style>
