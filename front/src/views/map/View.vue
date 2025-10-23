<template>
  <div class="map-container">
    <div id="map" class="map-view" ref="mapViewRef"></div>

    <!-- 创建标记对话框 -->
    <v-dialog v-model="showCreateMarkerDialog" max-width="500">
      <v-card>
        <v-card-title class="text-center py-14">
          <v-icon icon="mdi-map-marker-plus" class="mr-2" size="100"></v-icon>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                  v-model="newMarkerData.name"
                  label="标记名称"
                  variant="outlined"
                  hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-select
                  v-model="newMarkerData.category"
                  :items="categories"
                  label="标记类型"
                  variant="outlined"
                  hide-details
              ></v-select>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.longitude"
                  label="经度"
                  variant="outlined"
                  hide-details
                  readonly
              ></v-text-field>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.latitude"
                  label="纬度"
                  variant="outlined"
                  hide-details
                  readonly
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="px-6 py-2">
          <v-spacer></v-spacer>
          <v-btn @click="cancelCreateMarker" variant="text">取消</v-btn>
          <v-btn
              @click="createNewMarker"
              :disabled="!newMarkerData.name"
              variant="flat">
            创建标记
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 信息卡片 -->
    <v-card
        v-show="showModel"
        border
        elevation="12"
        :width="mobile ? 'calc(100% - 50px)' : 450"
        :style="{
        'top': mobile ? '100px' : '30px'
      }"
        class="map-container-cardInfo overflow-y-auto">
      <v-card-title class="my-2 mr-2">
        <v-row align="center">
          <v-col cols="auto" class="d-flex align-center">
            <v-img
                :src="icons[selectedLocationData.category]"
                v-if="icons[selectedLocationData.category]"
                width="28"
                height="28"
                cover/>
          </v-col>
          <v-col>
            <div
                class="d-flex align-center text-amber"
                :title="t(`snb.locations.${selectedLocationData.id}`)">
              {{ locationDisplayName }}
            </div>
          </v-col>
        </v-row>
      </v-card-title>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2 text-amber-lighten-4">
        类型
      </div>
      <div class="mx-5 py-2">
        {{ t(`map.type.${selectedLocationData.category || 'none'}`) }}
      </div>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2 text-amber-lighten-4">
        {{ t('empireSkillSimulation.other') }}
      </div>
      <div class="mx-5 mb-10 opacity-60"
           v-if="selectedLocationData && selectedLocationData.id">
        <v-text-field :value="selectedLocationData.id" hide-details readonly variant="underlined" density="compact">
          <template v-slot:append-inner>
            <v-icon>mdi-identifier</v-icon>
          </template>
        </v-text-field>
        <v-text-field :value="selectedLocationData.longitude" hide-details readonly variant="underlined"
                      density="compact">
          <template v-slot:append-inner>
            <v-icon size="15">mdi-longitude</v-icon>
          </template>
        </v-text-field>
        <v-text-field :value="selectedLocationData.latitude" hide-details readonly variant="underlined"
                      density="compact">
          <template v-slot:append-inner>
            <v-icon size="15">mdi-latitude</v-icon>
          </template>
        </v-text-field>

        <v-row no-gutters class="mt-2" align="center" v-if="selectedLocationData.dateAdded">
          <v-col cols="auto" class="mr-2">
            <v-icon icon="mdi-calendar-range" size="19"></v-icon>
            {{ t('empireSkillSimulation.dateAdded') }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="text-right">
            <TimeView :time="selectedLocationData.dateAdded" v-if="selectedLocationData.dateAdded">
              <Time :time="selectedLocationData.dateAdded"></Time>
            </TimeView>
          </v-col>
        </v-row>
        <v-row no-gutters class="mt-2" align="center" v-if="selectedLocationData.lastUpdated">
          <v-col cols="auto" class="mr-2">
            <v-icon icon="mdi-calendar-range" size="19"></v-icon>
            {{ t('empireSkillSimulation.lastUpdated') }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="text-right">
            <TimeView :time="selectedLocationData.lastUpdated" v-if="selectedLocationData.lastUpdated">
              <Time :time="selectedLocationData.lastUpdated"></Time>
            </TimeView>
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- 自定义地图控件 -->
    <div class="map-controls">
      <v-btn
          class="control-btn"
          @click="zoomIn"
          variant="flat">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn
          class="control-btn"
          @click="zoomOut"
          variant="flat">
        <v-icon>mdi-minus</v-icon>
      </v-btn>
      <v-btn
          class="control-btn"
          @click="resetView"
          variant="flat">
        <v-icon>mdi-crosshairs-gps</v-icon>
      </v-btn>
    </div>

    <!-- 地图控制底部信息 -->
    <div class="map-footer">
      <v-row class="w-100 mb-1">
        <v-spacer></v-spacer>
        <v-col cols="auto" class="d-flex align-center">
          <div class="text-caption opacity-50">
            <span>{{ hoveedCoordinate.longitude }}</span>
            <v-divider vertical class="mx-1"></v-divider>
            <span>{{ hoveedCoordinate.latitude }}</span>
          </div>
          <template v-if="route.query.debug">
            <v-divider vertical inset class="mx-5"></v-divider>
            <div class="text-caption opacity-50">
              <span>{{ clickedCoordinate.longitude }}</span>
              <v-divider vertical class="mx-1"></v-divider>
              <span>{{ clickedCoordinate.latitude }}</span>
            </div>
          </template>
          <v-icon size="12" class="ml-2">mdi-map-marker</v-icon>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, type Ref} from 'vue';
import {v6 as uuidv6} from 'uuid';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import {fromLonLat, toLonLat} from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {defaults as defaultControls} from 'ol/control';
import {Icon, Style} from 'ol/style';
import {Select} from 'ol/interaction';
import {pointerMove} from 'ol/events/condition';
import type {Feature as OLFeature} from 'ol';
import type {Geometry} from 'ol/geom';

import locationsData from "/public/config/mapData.json"

import {useI18n} from "vue-i18n";
import {useAssetsStore} from "~/stores/assetsStore.js";
import {useI18nUtils} from "@/assets/sripts/i18n_util.js";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";
import {useRoute, useRouter} from "vue-router";

const mapViewRef = ref<HTMLElement | null>(null);
const mapInstance: Ref<Map | null> = ref(null);
const locations: Ref<[]> = ref<[]>(locationsData);
const icons: Ref<{}> = ref({});
const showModel = ref<boolean>(false);
const selectedLocationData = ref<{}>({});
const mobile = ref<boolean>(false);
const showCoordinateInfo = ref<boolean>(false);
const clickedCoordinate = ref({
      longitude: 0,
      latitude: 0
    }),
    hoveedCoordinate = ref({}),

    // 创建标记
    categories = ref(['shareLocation']),
    showCreateMarkerDialog = ref(false),
    newMarkerData = ref({
      longitude: 0,
      latitude: 0,
      category: 'shareLocation',
      name: '',
      id: ''
    });
;

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    {asString} = useI18nUtils(),
    {serializationMap} = useAssetsStore();

onMounted(() => {
  const {x: queryX, y: queryY, key: queryKey, category: queryCategory} = route.query

  // 加载图标
  const mapImages = import.meta.glob('/src/assets/images/map/*.*', {eager: true});
  icons.value = serializationMap(mapImages);

  // 创建矢量数据源并添加要素
  const vectorSource = new VectorSource({
    features: createFeaturesFromLocations(locations.value)
  });

  // 创建矢量图层
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    zIndex: 100,
    style: createMarkerStyle // 设置默认样式
  });

  // 初始化地图
  const map = new Map({
    target: mapViewRef.value as HTMLElement,
    layers: [
      new TileLayer({
        source: new XYZ({
          url: 'https://tiles.mapgenie.io/games/skull-and-bones/indian-ocean/default-v1/{z}/{y}/{x}.jpg',
          crossOrigin: 'anonymous'
        })
      }),
      vectorLayer
    ],
    controls: defaultControls({
      zoom: false,
      rotate: false,
    }),
    view: new View({
      center: locations.value.length > 0
          ? fromLonLat([locations.value[0].longitude, locations.value[0].latitude])
          : fromLonLat([0.0, 0.0]),
      zoom: 14,
      maxZoom: 15,
      minZoom: 12,
    })
  });

  // 保存地图实例
  mapInstance.value = map;

  // 添加悬停交互
  const hoverInteraction = new Select({
    condition: pointerMove,
    layers: [vectorLayer],
    hitTolerance: 10,
    style: null
  });

  map.addInteraction(hoverInteraction);

  // 监听悬停事件，改变鼠标样式
  hoverInteraction.on('select', (event) => {
    const mapElement = map.getTargetElement();
    if (mapElement) {
      if (event.selected.length > 0) {
        mapElement.style.cursor = 'pointer';
      } else {
        mapElement.style.cursor = '';
      }
    }
  });

  // 添加点击地图事件 - 显示坐标
  map.on('click', (event) => {
    // 检查是否点击到了要素
    const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
      return feature as OLFeature<Geometry>;
    });

    if (feature) {
      selectedLocationData.value = feature.get('originalData');
      showModel.value = true;
      showCoordinateInfo.value = false;

      router.push({
        name: route.name,
        query: {
          ...route.query,
          key: selectedLocationData.value.id,
          x: selectedLocationData.value.longitude,
          y: selectedLocationData.value.latitude,
          category: selectedLocationData.value.category
        }
      })
      return;
    }

    // 点击空白处，显示坐标信息并准备创建标记
    const coordinate = toLonLat(event.coordinate);
    clickedCoordinate.value = {
      longitude: coordinate[0],
      latitude: coordinate[1]
    };

    // 设置新标记的数据
    newMarkerData.value = Object.assign(newMarkerData.value, {
      longitude: coordinate[0],
      latitude: coordinate[1],
    });

    showCoordinateInfo.value = true;
    showModel.value = false;
    showCreateMarkerDialog.value = true; // 显示创建标记对话框

    router.push({
      name: route.name,
      query: {}
    })
  });

  // 添加指针移动事件，实时更新坐标
  map.on('pointermove', (event) => {
    if (event.dragging) return; // 拖拽时不更新

    const lonLat = toLonLat(event.coordinate);
    hoveedCoordinate.value = {
      longitude: lonLat[0],
      latitude: lonLat[1]
    };
  });

  // 查找
  if (queryX && queryY && queryKey) {
    const Lat = [queryX, queryY]
    const feature = locations.value.find(i => i.id == queryKey)

    // 已有数据
    if (feature) {
      map.getView().animate({
        center: fromLonLat(Lat)
      })

      selectedLocationData.value = feature
      showModel.value = true;
    }

    // 创建分享
    if (queryCategory == 'shareLocation') {
      const loadLocation = {
        name: queryKey,
        id: queryKey,
        latitude: queryY,
        longitude: queryX,
        category: queryCategory,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // 创建新的要素并添加到地图
      const newFeature = createFeatureFromLocation(loadLocation);
      vectorSource.addFeature(newFeature);

      map.getView().animate({
        center: fromLonLat([queryX, queryY])
      })

      selectedLocationData.value = {
        id: queryKey,
        category: queryCategory,
        latitude: queryX,
        longitude: queryY
      }
      showModel.value = true;
    }
  }
});

/**
 * 处理名称
 */
const locationDisplayName = computed(() => {
  const location = selectedLocationData.value;
  if (!location.id) return '';

  return asString([
    `snb.locations.${location.category}${capitalizeFirstLetter(location.id)}`,
    `snb.locations.${capitalizeFirstLetter(location.id)}`,
    `snb.locations.${location.id}`
  ], {backRawKey: false}) || location.id;
});

/**
 * 首字母大写
 * @param str
 */
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  const [first, ...rest] = str;
  return first.toUpperCase() + rest.join('');
};

/**
 * 创建标记点样式
 */
const createMarkerStyle = (feature: OLFeature<Geometry>): Style => {
  const originalData = feature.get('originalData');

  return new Style({
    image: new Icon({
      src: icons.value[originalData.category] || 'default',
      scale: 0.12,
      anchor: [0.5, 0.6],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction'
    }),
  });
};

/**
 * 将locations数据转换为OpenLayers要素
 */
const createFeaturesFromLocations = (locations: []): OLFeature<Geometry>[] => {
  return locations.map(location => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([location.longitude, location.latitude])),
      id: location.id,
      name: location.name || `位置${location.id}`,
      originalData: location
    }) as OLFeature<Geometry>;

    return feature;
  });
};

/**
 * 创建新标记
 */
const createNewMarker = (): void => {
  if (!mapInstance.value || !newMarkerData.value.name) return;

  // 创建新的位置数据
  const newLocation = {
    id: uuidv6(),
    ...newMarkerData.value,
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  // 添加到 locations 数据
  locations.value.push(newLocation);

  // 获取矢量图层
  const vectorLayer = mapInstance.value.getLayers().item(1) as VectorLayer<VectorSource>;
  const vectorSource = vectorLayer.getSource();
  const id = `${newMarkerData.value.name}`;

  // 创建新的要素并添加到地图
  const newFeature = createFeatureFromLocation(newLocation);
  vectorSource.addFeature(newFeature);

  // 选中新创建的标记
  selectedLocationData.value = Object.assign(newLocation, {
    id,
    latitude: newMarkerData.value.latitude,
    longitude: newMarkerData.value.longitude
  });
  showModel.value = true;

  router.push({
    name: route.name,
    query: {
      ...route.query,
      key: `${id}`,
      x: newMarkerData.value.longitude,
      y: newMarkerData.value.latitude,
      category: 'shareLocation'
    }
  })

  // 关闭对话框并重置数据
  showCreateMarkerDialog.value = false;
  resetNewMarkerData();
};

/**
 * 从单个位置数据创建要素
 */
const createFeatureFromLocation = (location: any): OLFeature<Geometry> => {
  const feature = new Feature({
    geometry: new Point(fromLonLat([location.longitude, location.latitude])),
    id: location.id,
    name: location.name || `位置${location.id}`,
    originalData: location
  }) as OLFeature<Geometry>;

  return feature;
};

/**
 * 重置新标记数据
 */
const resetNewMarkerData = (): void => {
  newMarkerData.value = {
    longitude: 0,
    latitude: 0,
    category: 'default',
    id: '',
    name: '',
  };
};

/**
 * 取消创建标记
 */
const cancelCreateMarker = (): void => {
  showCreateMarkerDialog.value = false;
  resetNewMarkerData();
};

/**
 * 地图控制函数
 * 放大
 */
const zoomIn = (): void => {
  if (mapInstance.value) {
    const view = mapInstance.value.getView();
    const currentZoom = view.getZoom() || 0;
    view.animate({
      zoom: currentZoom + 1,
      duration: 250
    });
  }
};

/**
 * 地图控制函数
 * 缩小
 */
const zoomOut = (): void => {
  if (mapInstance.value) {
    const view = mapInstance.value.getView();
    const currentZoom = view.getZoom() || 0;
    view.animate({
      zoom: currentZoom - 1,
      duration: 250
    });
  }
};

/**
 * 地图控制函数
 * 重制居中
 */
const resetView = (): void => {
  if (mapInstance.value && locations.value.length > 0) {
    const view = mapInstance.value.getView();

    view.animate({
      center: fromLonLat([locations.value[0].longitude, locations.value[0].latitude]),
      zoom: 14,
      duration: 500
    });
  }
};

</script>

<style scoped lang="less">
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 100px);
  max-height: 100vh;
  background: #b1c1bf;

  .map-view {
    width: 100%;
    height: 100%;
  }

  .map-controls {
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-btn {
    min-width: 40px !important;
    width: 40px;
    height: 40px;
  }

  .map-container-cardInfo {
    position: absolute;
    right: 30px;
    max-height: 80vh;
  }

  .coordinate-info {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(5px);
  }

  .map-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
}
</style>
