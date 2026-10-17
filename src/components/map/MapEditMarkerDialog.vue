<template>
  <!-- 编辑标记 -->
  <v-dialog :model-value="modelValue" persistent max-width="1024" @update:model-value="emit('update:modelValue', $event)">
    <v-card border elevation="12">
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 create-marker-card">
        <v-img :src="getCategoryIcon(form.category || 'shareLocation')" width="64" height="64" class="mx-auto mb-2"></v-img>
        <p>
          {{ isEdit ? t('map.editMarkerTitle') : t('map.createMarker') }}
        </p>
      </v-card-title>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <v-card-text>
        <v-form ref="formRef">
          <v-row>
            <!-- 左侧：小型可交互地图 -->
            <v-col cols="12" md="6">
              <v-card variant="tonal" height="320" class="position-relative overflow-hidden rounded-lg border">
                <MapView
                    :draggable="true"
                    :zoomable="true"
                    :initialZoom="13"
                    :latitude="initialLat"
                    :longitude="initialLon"
                    @map-created="onMiniMapCreated"
                />

                <!-- 地图控制小工具条 -->
                <div class="position-absolute top-0 left-0 right-0 pa-2 d-flex align-center justify-space-between mini-map-toolbar">
                  <span class="text-caption text-amber font-weight-medium">
                    <v-icon size="16" class="mr-1">mdi-map-marker</v-icon>
                    {{ t('map.clickToSetMarker') || '点击地图调整标记位置' }}
                  </span>
                  <v-btn
                      v-if="hasValidCoords"
                      size="x-small"
                      variant="tonal"
                      color="amber"
                      prepend-icon="mdi-crosshairs-gps"
                      @click="centerOnMarker">
                    {{ t('map.centerOnMarker') || '定位标记' }}
                  </v-btn>
                </div>
              </v-card>

              <div class="text-caption text-medium-emphasis mt-2 text-center">
                <v-icon size="small" class="mr-1">mdi-cursor-default-click</v-icon>
                {{ t('map.clickMapTip') || '在地图上点击任意位置即可更新经纬度' }}
              </div>

              <v-row density="compact" class="mt-2">
                <v-col cols="6">
                  <v-text-field
                      :model-value="form.longitude"
                      @update:model-value="patch({ longitude: $event })"
                      :label="t('map.longitude')"
                      type="number"
                      variant="outlined"
                      density="compact"
                      :rules="[v => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v)) || t('map.invalidCoordinate')]"
                      required></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                      :model-value="form.latitude"
                      @update:model-value="patch({ latitude: $event })"
                      :label="t('map.latitude')"
                      type="number"
                      variant="outlined"
                      density="compact"
                      :rules="[v => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v)) || t('map.invalidCoordinate')]"
                      required></v-text-field>
                </v-col>
              </v-row>
            </v-col>

            <!-- 右侧：表单字段 -->
            <v-col cols="12" md="6">
              <v-row density="compact">
                <v-col cols="12" sm="7">
                  <v-text-field
                      :model-value="form.title"
                      @update:model-value="patch({ title: $event })"
                      :label="t('map.markerName')"
                      :rules="[v => !!v || t('map.titleRequired')]"
                      variant="outlined"
                      density="compact"
                      required></v-text-field>
                </v-col>

                <v-col cols="12" sm="5">
                  <v-autocomplete
                      :model-value="form.category || 'shareLocation'"
                      @update:model-value="patch({ category: $event })"
                      :items="categoryOptions"
                      item-value="value"
                      item-title="text"
                      :label="t('map.icon')"
                      variant="outlined"
                      density="compact">
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-img
                              v-if="getCategoryIcon(item.raw.value)"
                              :src="getCategoryIcon(item.raw.value)"
                              width="24"
                              height="24"
                              class="mr-2"
                              contain
                          />
                        </template>
                      </v-list-item>
                    </template>
                    <template v-slot:prepend-inner>
                      <v-img
                          v-if="getCategoryIcon(form.category || 'shareLocation')"
                          :src="getCategoryIcon(form.category || 'shareLocation')"
                          width="20"
                          height="20"
                          class="mr-1"
                          contain
                      />
                    </template>
                  </v-autocomplete>
                </v-col>

                <v-col cols="12">
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

                <v-col cols="12">
                  <v-combobox
                      :model-value="form.tags"
                      @update:model-value="patch({ tags: $event })"
                      :label="t('map.tags')"
                      multiple
                      chips
                      variant="outlined"
                      density="compact"></v-combobox>
                </v-col>

                <v-col cols="12">
                  <v-card border class="pa-2 my-1">
                    <Textarea
                        :model-value="form.description"
                        @update:model-value="patch({ description: $event })"
                        :label="t('map.markerDescription')"
                        variant="outlined"
                        density="compact"
                        :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"></Textarea>
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
                      density="compact"
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
        <v-btn variant="text" @click="emit('cancel')">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="amber" variant="tonal" :loading="saving" @click="onSubmit">
          {{ isEdit ? t('basic.button.save') : t('basic.button.create') }}
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
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Icon, Style} from 'ol/style';
import {fromLonLat, toLonLat} from 'ol/proj';

import type {PointFormData} from '@/assets/types/Map';
import Textarea from "@/components/textarea/index.vue";
import MapView from "@/components/map/MapView.vue";
import {useAssetsStore} from "~/stores/assetsStore";

const props = defineProps<{
  modelValue: boolean;
  form: PointFormData;
  userCollections: any[];
  saving: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:form', 'cancel', 'save']);

const {t, te} = useI18n();
const formRef = ref<any>(null);
const mapInstance = ref<Map | null>(null);
const vectorSource = new VectorSource();
let vectorLayer: VectorLayer<VectorSource> | null = null;

const defaultLon = -0.667206;
const defaultLat = 0.626653;

const assetsStore = useAssetsStore();
const icons = ref<Record<string, string>>(assetsStore.getMapImages());

const getCategoryIcon = (category: string) => {
  return icons.value[category] || icons.value['shareLocation'] || icons.value['default'] || '';
};

const categoryKeys = [
  'shareLocation',
  'den',
  'outpost',
  'settlement',
  'capitalSettlement',
  'foundry',
  'lumberyard',
  'weaver',
  'militaryBase',
  'megafort',
  'guardTower',
  'treasureMap',
  'shipwreck',
  'bounty',
  'mainContract',
  'sideContract',
  'archive',
  'abaka',
  'acacia',
  'bogIron',
  'cobalt',
  'coconut',
  'copper',
  'crocodile',
  'durian',
  'greenheart',
  'hemp',
  'hippopotamus',
  'iroko',
  'ironwood',
  'juniper',
  'jute',
  'linen',
  'magnetite',
  'mopane',
  'ndizi',
  'nickel',
  'pureIron',
  'ramie',
  'roselle',
  'screwpine',
  'shark',
  'sisal',
  'teak',
  'zinc'
];

const categoryOptions = computed(() => {
  return categoryKeys.map(cat => ({
    value: cat,
    text: te(`map.types.${cat}.name`)
        ? t(`map.types.${cat}.name`)
        : (cat === 'shareLocation' ? t('map.tabPoints') || '个人标记' : cat)
  }));
});

const isEdit = computed(() => !!(props.form as any).uuid);

const initialLon = computed(() => {
  const num = Number(props.form.longitude);
  return !isNaN(num) && num !== 0 ? num : defaultLon;
});

const initialLat = computed(() => {
  const num = Number(props.form.latitude);
  return !isNaN(num) && num !== 0 ? num : defaultLat;
});

const hasValidCoords = computed(() => {
  const lon = Number(props.form.longitude);
  const lat = Number(props.form.latitude);
  return !isNaN(lon) && !isNaN(lat) && (lon !== 0 || lat !== 0);
});

const collectionItems = computed(() => [
  {title: t('map.noCollection'), uuid: null},
  ...(props.userCollections || []),
]);

const visibilityItems = computed(() => [
  {value: true, label: t('map.public')},
  {value: false, label: t('map.private')},
]);

const selectedCollection = computed(() =>
    (props.userCollections || []).find((c: any) => c.uuid === props.form.collectionUuid));

const publicSelectValue = computed(() =>
    selectedCollection.value ? Number((selectedCollection.value as any).public) === 1 : props.form.public);

const onCollectionChange = (uuid: string | null) => {
  const collection = (props.userCollections || []).find((c: any) => c.uuid === uuid);
  patch({
    collectionUuid: uuid || null,
    public: collection ? Number(collection.public) === 1 : props.form.public,
  });
};

const patch = (data: Partial<PointFormData>) => {
  emit('update:form', {...props.form, ...data});
};

const createMarkerStyle = (category?: string) => {
  const cat = category || props.form.category || 'shareLocation';
  const iconSrc = getCategoryIcon(cat);
  const isShare = cat === 'shareLocation';
  const anchor: [number, number] = isShare ? [0.5, 1] : [0.5, 0.6];
  return new Style({
    image: new Icon({
      src: iconSrc,
      scale: 0.16,
      anchor,
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
    }),
  });
};

const updateMarkerPosition = (lon: number, lat: number) => {
  if (isNaN(lon) || isNaN(lat) || (lon === 0 && lat === 0)) {
    vectorSource.clear();
    return;
  }
  const coord = fromLonLat([lon, lat]);
  const features = vectorSource.getFeatures();
  if (features.length > 0) {
    const geom = features[0].getGeometry();
    if (geom instanceof Point) {
      geom.setCoordinates(coord);
    } else {
      features[0].setGeometry(new Point(coord));
    }
  } else {
    const feature = new Feature({
      geometry: new Point(coord),
    });
    feature.setStyle(createMarkerStyle(props.form.category));
    vectorSource.addFeature(feature);
  }
};

const syncMarkerToMap = (fitView: boolean = false) => {
  const lon = Number(props.form.longitude);
  const lat = Number(props.form.latitude);
  if (!isNaN(lon) && !isNaN(lat) && (lon !== 0 || lat !== 0)) {
    updateMarkerPosition(lon, lat);
    if (fitView && mapInstance.value) {
      const coord = fromLonLat([lon, lat]);
      mapInstance.value.getView().setCenter(coord);
      mapInstance.value.getView().setZoom(13);
    }
  } else {
    vectorSource.clear();
  }
};

const centerOnMarker = () => {
  const lon = Number(props.form.longitude);
  const lat = Number(props.form.latitude);
  if (!isNaN(lon) && !isNaN(lat) && mapInstance.value) {
    const coord = fromLonLat([lon, lat]);
    mapInstance.value.getView().animate({center: coord, zoom: 13, duration: 400});
  }
};

const onMiniMapCreated = (map: Map) => {
  mapInstance.value = map;
  
  const existingLayer = map.getLayers().getArray().find(l => l.get('name') === 'markerLayer');
  if (!existingLayer) {
    vectorLayer = new VectorLayer({
      properties: { name: 'markerLayer' },
      source: vectorSource,
      zIndex: 100,
    });
    map.addLayer(vectorLayer);
  }

  map.on('click', (evt) => {
    const [lon, lat] = toLonLat(evt.coordinate);
    const newLon = Number(lon.toFixed(6));
    const newLat = Number(lat.toFixed(6));
    updateMarkerPosition(newLon, newLat);
    patch({
      longitude: newLon,
      latitude: newLat,
    });
  });

  setTimeout(() => {
    map.updateSize();
    syncMarkerToMap(true);
  }, 100);
};

watch(() => [props.form.longitude, props.form.latitude], ([newLon, newLat], [oldLon, oldLat]) => {
  if (newLon !== oldLon || newLat !== oldLat) {
    syncMarkerToMap(false);
  }
});

watch(() => props.form.category, (newCat) => {
  const features = vectorSource.getFeatures();
  if (features.length > 0) {
    features[0].setStyle(createMarkerStyle(newCat));
  }
});

watch(() => props.modelValue, (visible) => {
  if (visible) {
    setTimeout(() => {
      if (mapInstance.value) {
        mapInstance.value.updateSize();
        syncMarkerToMap(true);
      }
    }, 200);
  }
});

const onSubmit = async () => {
  if (formRef.value) {
    const {valid} = await formRef.value.validate();
    if (valid) emit('save');
  }
};

defineExpose({
  formRef
});

defineOptions({
  name: 'MapEditMarkerDialog'
});
</script>

<style scoped lang="less">
.create-marker-card {
  margin-top: -80px !important;
}

.mini-map-toolbar {
  z-index: 20;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%);
  pointer-events: auto;
}
</style>
