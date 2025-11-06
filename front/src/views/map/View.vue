<template>
  <div class="map-container">
    <div id="map" class="map-view" ref="mapViewRef"></div>

    <!-- 搜索 S -->
    <v-card border class="d-flex map-search-bar"
            :width="mobile ? 'calc(100% - 60px)' : 450"
            :style="{'top': mobile ? '80px' : '80px'}">
      <v-combobox
          v-model="searchQuery"
          :items="searchSuggestions"
          tile
          elevation="0"
          hide-details
          variant="solo"
          clearable
          class="bg-transparent"
          density="comfortable"
          :menu-props="{ maxHeight: '450px' }"
          :placeholder="t('map.searchPlaceholder')"
          @update:search="handleSearchInput"
          @keydown.enter="handleSearch"
          prepend-inner-icon="mdi-magnify">
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <template v-slot:prepend>
              <v-img
                  :src="getCategoryIcon(item.raw.category)"
                  width="24"
                  height="24"
                  class="mr-2"
                  cover/>
            </template>
            <template v-slot:title>
              <MapLocationNameWidget :id="item.raw.id"></MapLocationNameWidget>
            </template>
          </v-list-item>
        </template>
      </v-combobox>
      <v-divider vertical></v-divider>
      <v-btn tile stacked density="compact" @click="isShowMarkModel = !isShowMarkModel">
        <v-icon :class="isShowMarkModel ? 'text-amber' : ''" :icon="`mdi-layers${!isShowMarkModel ? '-outline' : ''}`"></v-icon>
      </v-btn>
      <FullscreenBtn></FullscreenBtn>
    </v-card>
    <!-- 搜索 E -->

    <!-- 图层控制面板 -->
    <v-navigation-drawer v-model="isShowMarkModel"
                         temporary
                         absolute
                         tile
                         class="layer-control-panel"
                         :scrim="false"
                         :style="mobile ? isShowMarkModel ? 'min-width: 100%' : 'width: 0' :''"
                         :width="mobile ? '100vh' : 510">
      <v-card
          tile
          elevation="0"
          class="bg-transparent"
          width="100%"
          height="100%">
        <v-card-title class="d-flex align-center py-4 px-7">
          <v-icon icon="mdi-layers" class="mr-2 text-amber"></v-icon>
          {{ t('map.layerControl') }}
          <v-spacer></v-spacer>
          <v-btn
              variant="text"
              size="small"
              @click="toggleAllLayers">
            {{ allLayersVisible ? t('map.hideAll') : t('map.showAll') }}
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-0 px-3">
          <v-list density="compact" class="bg-transparent">
            <v-list-item
                v-for="category in availableCategories"
                :key="category.value">
              <template v-slot:prepend>
                <v-checkbox
                    v-model="layerVisibility[category.value]"
                    @update:model-value="toggleLayer(category.value)"
                    hide-details
                    class="mr-2"
                    density="compact"></v-checkbox>

                <v-img
                    :src="getCategoryIcon(category.value)"
                    width="20"
                    height="20"
                    class="mr-3"
                    cover/>
              </template>
              <v-list-item-title>
                {{ category.text }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ getCategoryCount(category.value) }} {{ t('map.locations') }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

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
                  :label="t('map.markerName')"
                  variant="outlined"
                  hide-details
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-select
                  v-model="newMarkerData.category"
                  :items="categories"
                  :label="t('map.markerType')"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  hide-details
              ></v-select>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.longitude.toFixed(6)"
                  :label="t('map.longitude')"
                  variant="outlined"
                  hide-details
                  readonly
              ></v-text-field>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.latitude.toFixed(6)"
                  :label="t('map.latitude')"
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
          <v-btn @click="cancelCreateMarker" variant="text">{{ t('common.cancel') }}</v-btn>
          <v-btn
              @click="createNewMarker"
              :disabled="!newMarkerData.name"
              variant="flat">
            {{ t('map.createMarker') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 地图控件 -->
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
            <span>{{ hoveedCoordinate.longitude?.toFixed(6) }}</span>
            <v-divider vertical class="mx-1"></v-divider>
            <span>{{ hoveedCoordinate.latitude?.toFixed(6) }}</span>
          </div>
          <template v-if="route.query.debug">
            <v-divider vertical inset class="mx-5"></v-divider>
            <div class="text-caption opacity-50">
              <span>{{ clickedCoordinate.longitude?.toFixed(6) }}</span>
              <v-divider vertical class="mx-1"></v-divider>
              <span>{{ clickedCoordinate.latitude?.toFixed(6) }}</span>
            </div>
          </template>
          <v-icon size="12" class="ml-2">mdi-map-marker</v-icon>
        </v-col>
      </v-row>
    </div>

    <!-- 信息卡片 S -->
    <v-card
        v-show="model"
        border
        elevation="12"
        :width="mobile ? 'calc(100% - 60px)' : 450"
        :style="{
          'top': mobile ? '140px' : '80px'
        }"
        class="map-container-cardInfo overflow-y-auto">
      <template v-slot:title>
        <div class="my-2 mr-2">
          <v-row align="center" no-gutters>
            <v-col cols="auto" class="mr-2">
              <ShieldWidget :size="30">
                {{ selectedLocationData.baseRank || 0 }}
              </ShieldWidget>
            </v-col>
            <v-col>
              <template v-if="selectedLocationData.category != 'shareLocation'">
                <router-link :to="`/codex/mapLocation/${selectedLocationData.id}`">
                  <div
                      class="d-flex align-center text-amber"
                      :title="t(`snb.locations.${selectedLocationData.id}`)">
                    <MapLocationNameWidget :id="selectedLocationData.id"></MapLocationNameWidget>
                  </div>
                </router-link>
              </template>
              <template v-else-if="selectedLocationData.category == 'shareLocation'">
                <div
                    class="d-flex align-center text-amber"
                    :title="selectedLocationData.id">
                  {{ selectedLocationData.id }}
                </div>
              </template>
            </v-col>
          </v-row>
        </div>
      </template>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="model = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <div class="mx-5 mb-3 pb-2">
        <v-row no-gutters>
          <v-col cols="auto" class="d-flex align-center mr-2">
            <v-img
                :src="getCategoryIcon(selectedLocationData.category)"
                v-if="getCategoryIcon(selectedLocationData.category)"
                width="25"
                height="25"
                cover/>
          </v-col>
          <v-col>
            {{ t(`map.type.${selectedLocationData.category || 'none'}`) }}
          </v-col>
        </v-row>
        <v-row no-gutters class="mt-1" v-if="selectedLocationData && selectedLocationData.faction">
          <v-col cols="auto" class="d-flex align-center mr-2">
            <ItemSlotBase :size="'25px'" :padding="0">
              <FactionIconWidget :name="selectedLocationData.faction.id"></FactionIconWidget>
            </ItemSlotBase>
          </v-col>
          <v-col>
            <FactionNameWidget :id="selectedLocationData.faction.id"></FactionNameWidget>
          </v-col>
        </v-row>
      </div>

      <template v-if="selectedLocationData.possibleLoot">
        <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" >
          {{ t('map.possibleLoot') }}
        </div>
        <div class="mx-5 mb-5 pt-3 opacity-60">
          <v-row v-for="(i,index) in Object.entries(selectedLocationData.possibleLoot)" :key="index" align="center" no-gutters>
            <v-col cols="auto" class="mr-2">
              <ItemSlotBase :size="`30px`">
                <MaterialIconWidget :id="i[0]"></MaterialIconWidget>
              </ItemSlotBase>
            </v-col>
            <v-col cols="auto">
              <MaterialNameRarity :id="i[0]">
                <MaterialName :id="i[0]"></MaterialName>
              </MaterialNameRarity>
            </v-col>
            <v-col class="text-right">
              {{ i[1] || 0 }}
            </v-col>
          </v-row>
        </div>
      </template>


      <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
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
    <!-- 信息卡片 E -->
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, type Ref, watch} from 'vue';
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
import {defaults as defaultInteractions, Select} from 'ol/interaction';
import {Icon, Style} from 'ol/style';
import {pointerMove} from 'ol/events/condition';
import type {Feature as OLFeature} from 'ol';
import type {Geometry} from 'ol/geom';
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";

import {MapLocations} from "glow-prow-data"

import {useI18n} from "vue-i18n";
import {useAssetsStore} from "~/stores/assetsStore.js";
import {useI18nUtils} from "@/assets/sripts/i18n_util.js";

import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";
import FullscreenBtn from "@/components/FullscreenBtn.vue";
import MapLocationNameWidget from "@/components/snbWidget/mapLocationNameWidget.vue";
import ShieldWidget from "@/components/snbWidget/shieldWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionNameWidget from "@/components/snbWidget/factionNameWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    {asString} = useI18nUtils(),
    {mobile} = useDisplay(),
    {serializationMap} = useAssetsStore();

let mapViewRef = ref<HTMLElement | null>(null),
    mapInstance: Ref<Map | null> = ref(null),
    locations: Ref<any[]> = ref(Object.values(MapLocations)),
    icons: Ref<Record<string, string>> = ref({}),
    model = ref<boolean>(false),
    selectedLocationData = ref<any>({}),
    showCoordinateInfo = ref<boolean>(false),
    clickedCoordinate = ref({
      longitude: 0,
      latitude: 0
    }),
    hoveedCoordinate = ref({
      longitude: 0,
      latitude: 0
    }),

    // 搜索相关
    searchQuery = ref(''),
    searchSuggestions = ref<any[]>([]),

    // 图层控制相关
    isShowMarkModel = ref(false),
    layerVisibility = ref<Record<string, boolean>>({}),
    allLayersVisible = ref(true),
    vectorLayerRef: Ref<VectorLayer<VectorSource> | null> = ref(null),

    // 创建标记
    categories = ref([
      {value: 'shareLocation', text: t('map.type.shareLocation')},
      {value: 'outpost', text: t('map.type.outpost')},
      {value: 'den', text: t('map.type.den')},
      {value: 'settlement', text: t('map.type.settlement')},
      {value: 'harbor', text: t('map.type.harbor')},
      {value: 'fort', text: t('map.type.fort')},
      {value: 'lumber', text: t('map.type.lumber')},
      {value: 'mine', text: t('map.type.mine')},
      {value: 'farm', text: t('map.type.farm')},
      {value: 'workshop', text: t('map.type.workshop')}
    ]),
    showCreateMarkerDialog = ref(false),
    newMarkerData = ref({
      longitude: 0,
      latitude: 0,
      category: 'shareLocation',
      name: '',
      id: ''
    });

/**
 * 计算可用分类
 */
const availableCategories = computed(() => {
  const uniqueCategories = [...new Set(locations.value.map(loc => loc.category))];
  return uniqueCategories.map(category => ({
    value: category,
    text: t(`map.type.${category}`)
  }));
});


watch(searchQuery, (newValue) => {
  if (!newValue) {
    searchSuggestions.value = [];
  }
});

onMounted(() => {
  const {x: queryX, y: queryY, key: queryKey, category: queryCategory} = route.query;

  // 初始化图层可见性
  initializeLayerVisibility();

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
    style: (feature) => {
      const featureCategory = feature.get('originalData')?.category;
      const isVisible = layerVisibility.value[featureCategory];

      return isVisible ? createMarkerStyle(feature) : null;
    }
  });

  // 保存矢量图层引用
  vectorLayerRef.value = vectorLayer;

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
    interactions: defaultInteractions({
      doubleClickZoom: false, // 禁用双击缩放
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
      model.value = true;
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

    showCoordinateInfo.value = true;
    model.value = false;

    router.push({
      name: route.name,
      query: {}
    })
  });

  map.on('dblclick', (event) => {
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
    model.value = false;
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
    const Lat = [parseFloat(queryX as string), parseFloat(queryY as string)]
    const feature = locations.value.find(i => i.id == queryKey)

    // 已有数据
    if (feature) {
      map.getView().animate({
        center: fromLonLat(Lat),
        duration: 0
      })

      selectedLocationData.value = feature
      model.value = true;
    }

    // 创建分享
    if (queryCategory == 'shareLocation') {
      const loadLocation = {
        name: queryKey,
        id: queryKey,
        latitude: parseFloat(queryY as string),
        longitude: parseFloat(queryX as string),
        category: queryCategory,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // 创建新的要素并添加到地图
      const newFeature = createFeatureFromLocation(loadLocation);
      vectorSource.addFeature(newFeature);

      // 更新图层可见性状态
      if (!layerVisibility.value[queryCategory]) {
        layerVisibility.value[queryCategory] = true;
        updateAllLayersVisibleState();
      }

      map.getView().animate({
        center: fromLonLat([parseFloat(queryX as string), parseFloat(queryY as string)]),
        duration: 0
      })

      selectedLocationData.value = {
        id: queryKey,
        category: queryCategory,
        latitude: parseFloat(queryX as string),
        longitude: parseFloat(queryY as string)
      }
      model.value = true;
    }
  }
});

/**
 * 获取分类数量
 * @param category
 */
const getCategoryCount = (category: string) => {
  return locations.value.filter(loc => loc.category === category).length;
};

/**
 * 获取分类图标
 * @param category
 */
const getCategoryIcon = (category: string) => {
  return icons.value[category] || icons.value['default'];
};

/**
 * 处理搜索输入
 * @param value
 */
const handleSearchInput = (value: string) => {
  if (!value.trim()) {
    searchSuggestions.value = [];
    return;
  }

  const filtered = locations.value.filter(location => {
    const name = location.name || location.id || locationDisplayName(location);
    return name.toLowerCase().includes(value.toLowerCase()) || location.id.toLowerCase().includes(value.toLowerCase());
  }).slice(0, 10); // 限制建议数量

  searchSuggestions.value = filtered.map(location => ({
    title: location.name || location.id,
    value: location.id,
    ...location
  }));
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  if (!searchQuery.value.trim()) return;

  const foundLocation = locations.value.find(location => {
    const name = location.name || location.id || locationDisplayName(location);
    return name.toLowerCase() === searchQuery.value.toLowerCase() || location.id.toLowerCase() === searchQuery.value.toLowerCase();
  });

  if (foundLocation && mapInstance.value) {
    // 跳转到找到的位置
    mapInstance.value.getView().animate({
      center: fromLonLat([foundLocation.longitude, foundLocation.latitude]),
      zoom: 15,
      duration: 500
    });

    // 显示位置信息
    selectedLocationData.value = foundLocation;
    model.value = true;
    showCoordinateInfo.value = false;

    router.push({
      name: route.name,
      query: {
        ...route.query,
        key: foundLocation.id,
        x: foundLocation.longitude,
        y: foundLocation.latitude,
        category: foundLocation.category
      }
    });
  }
};

/**
 * 切换单个图层显示
 * @param category
 */
const toggleLayer = (category: string) => {
  if (!vectorLayerRef.value) return;

  const isVisible = layerVisibility.value[category];

  // 更新图层样式函数来过滤要素
  vectorLayerRef.value.setStyle((feature) => {
    const featureCategory = feature.get('originalData')?.category;

    // 如果该分类不可见，返回null（隐藏）
    if (featureCategory === category && !isVisible) {
      return null;
    }

    // 如果该分类可见，返回正常样式
    if (featureCategory === category && isVisible) {
      return createMarkerStyle(feature);
    }

    // 对于其他分类，根据其可见性决定
    const otherCategoryVisible = layerVisibility.value[featureCategory];
    return otherCategoryVisible ? createMarkerStyle(feature) : null;
  });

  // 强制刷新地图
  vectorLayerRef.value.changed();

  // 更新全选状态
  updateAllLayersVisibleState();
};

/**
 * 切换所有图层显示
 */
const toggleAllLayers = () => {
  if (!vectorLayerRef.value || !availableCategories.value.length) return;

  const newVisibility = !allLayersVisible.value;

  // 更新所有分类的可见性状态
  availableCategories.value.forEach(category => {
    layerVisibility.value[category.value] = newVisibility;
  });

  allLayersVisible.value = newVisibility;

  // 应用样式
  vectorLayerRef.value.setStyle((feature) => {
    const featureCategory = feature.get('originalData')?.category;
    const isFeatureVisible = layerVisibility.value[featureCategory];

    return isFeatureVisible ? createMarkerStyle(feature) : null;
  });

  // 强制刷新地图
  vectorLayerRef.value.changed();
};

/**
 * 更新全选图层状态
 */
const updateAllLayersVisibleState = () => {
  const allCategories = availableCategories.value.map(cat => cat.value);
  const allVisible = allCategories.every(category => layerVisibility.value[category]);
  allLayersVisible.value = allVisible;
};

/**
 * 初始化图层可见性
 */
const initializeLayerVisibility = () => {
  const allCategories = [...new Set(locations.value.map(loc => loc.category))];
  allCategories.forEach(category => {
    layerVisibility.value[category] = true;
  });
};

/**
 * 处理名称
 * @param data
 */
const locationDisplayName = (data: any): string => {
  const location = data;
  if (!location.id) return '';

  return asString([
    `snb.mapLocations.${location.category}${capitalizeFirstLetter(location.id)}`,
    `snb.mapLocations.${capitalizeFirstLetter(location.id)}`,
    `snb.mapLocations.${location.id}`
  ], {backRawKey: false}) || location.id;
};

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
 * @param feature
 */
const createMarkerStyle = (feature: OLFeature<Geometry>): Style => {
  const originalData = feature.get('originalData');

  return new Style({
    image: new Icon({
      src: getCategoryIcon(originalData.category),
      scale: 0.12,
      anchor: [0.5, 0.6],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction'
    }),
  });
};

/**
 * 将locations数据转换为OpenLayers要素
 * @param locations
 */
const createFeaturesFromLocations = (locations: any[]): OLFeature<Geometry>[] => {
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

  // 更新可见图层状态
  if (!layerVisibility.value[newMarkerData.value.category]) {
    layerVisibility.value[newMarkerData.value.category] = true;
    updateAllLayersVisibleState();
  }

  // 选中新创建的标记
  selectedLocationData.value = Object.assign(newLocation, {
    id,
    latitude: newMarkerData.value.latitude,
    longitude: newMarkerData.value.longitude
  });
  model.value = true;

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
    category: 'shareLocation',
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

  .map-search-bar {
    background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
    position: absolute;
    top: 30px;
    left: 30px;
    z-index: 200;
  }

  .layer-control-panel {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.67);
    backdrop-filter: blur(70px);
    top: 0 !important;;
    left: 0;
    padding-top: 136px;
    height: calc(100vh - 100px) !important;;
    overflow-y: auto;
    z-index: 30 !important;
  }

  .map-view {
    width: 100%;
    height: 100%;
  }

  .map-controls {
    position: absolute;
    bottom: 30px;
    left: 30px;
    z-index: 20;
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
    background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
    backdrop-filter: blur(20px);
    position: absolute;
    right: 30px;
    max-height: 80vh;

    .map-title {
      marker: none;
      background-color: hsl(from #000 h s l / .3);
    }
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
