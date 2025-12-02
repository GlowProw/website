<template>
  <div class="map" :class="{'position-relative': !isFull}">
    <div id="map" class="map-view" :class="{'imap-view-full': isFull}" ref="mapViewRef"></div>

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
          @update:model-value="onHandleSelectSuggestion"
          prepend-inner-icon="mdi-magnify">
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props" @click="onSelectLocation(item.raw)">
            <template v-slot:prepend>
              <v-img
                  :src="getCategoryIcon(item.raw.category)"
                  width="24"
                  height="24"
                  class="mr-2"
                  cover/>
            </template>
            <template v-slot:title>
              <MapLocationNameWidget :id="item.raw.id" v-if="item.raw.id"></MapLocationNameWidget>
            </template>
          </v-list-item>
        </template>
      </v-combobox>

      <v-divider vertical></v-divider>
      <v-btn tile stacked density="compact" @click="isShowMarkModel = !isShowMarkModel">
        <v-icon :class="isShowMarkModel ? 'text-amber' : ''" :icon="`mdi-layers${!isShowMarkModel ? '-outline' : ''}`"></v-icon>
      </v-btn>

      <FullscreenBtn @update:isFull="(v) => isFull = v"></FullscreenBtn>
    </v-card>

    <!-- 图层控制面板 -->
    <v-navigation-drawer v-model="isShowMarkModel"
                         temporary
                         absolute
                         tile
                         class="layer-control-panel"
                         :scrim="false"
                         :style="mobile ? isShowMarkModel ? 'min-width: 100%' : 'width: 0' :''"
                         :width="mobile ? '100vh' : 510">
      <div>
        <v-card
            v-if="authStore.isLogin"
            tile
            elevation="0"
            class="bg-transparent">
          <v-card-title class="d-flex align-center py-4 px-7">
            <v-icon icon="mdi-map-marker-multiple" class="mr-2 text-amber"></v-icon>
            {{ t('map.layerCollection') }}
            <v-btn size="x-small" variant="tonal">BETA</v-btn>
            <v-spacer></v-spacer>
            <v-btn density="compact" to="/account/maps" target="_blank">
              <v-icon icon="mdi-cog"></v-icon>
            </v-btn>
          </v-card-title>

          <!-- 地图集选择器 S -->
          <v-select
              v-model="selectedCollectionUuid"
              :items="userCollectionsSelect"
              item-title="title"
              item-value="uuid"
              density="compact"
              variant="outlined"
              hide-details
              :placeholder="t('map.selectCollection')"
              class="collection-selector mx-9">
          </v-select>
          <!-- 地图集选择器 E -->
        </v-card>

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
                @click="onToggleAllLayers">
              {{ allLayersVisible ? t('map.hideAll') : t('map.showAll') }}
            </v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="pa-0 px-3">
            <v-list density="compact" class="bg-transparent">
              <!-- 系统分类 -->
              <v-list-item
                  v-for="category in availableCategories"
                  :key="category.value">
                <template v-slot:prepend>
                  <v-checkbox
                      v-model="layerVisibility[category.value]"
                      @update:model-value="onToggleLayer()"
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

              <!-- 个人标记层 -->
              <v-list-item v-if="authStore.isLogin && layerVisibility.shareLocation">
                <template v-slot:prepend>
                  <v-checkbox
                      v-model="layerVisibility.shareLocation"
                      @update:model-value="onTogglePersonalLayer"
                      hide-details
                      class="mr-2"
                      density="compact"></v-checkbox>
                  <v-img
                      :src="getPersonalMarkerIcon()"
                      width="20"
                      height="20"
                      class="mr-3"
                      cover/>
                </template>
                <v-list-item-title>
                  {{ t('map.personalMarkers') }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ personalMarkersCount }} {{ t('map.locations') }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </div>
    </v-navigation-drawer>

    <!-- 创建标记对话框 S -->
    <v-dialog v-model="showCreateMarkerDialog" max-width="500">
      <v-card border
              elevation="12">
        <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 create-marker-card">
          <v-icon size="80">mdi-map-marker-plus</v-icon>
        </v-card-title>
        <template v-slot:append>
          <v-btn variant="tonal" icon @click="onCancelCreateMarker">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>

        <v-card-text>
          <v-alert type="warning" class="mb-5" v-if="userCollections.length <= 0">
            {{ t('map.collectionIsEmptyTip') }}
            <template v-slot:append>
              <v-btn to="/account/maps" target="_blank">
                {{ t('basic.button.go') }}
              </v-btn>
            </template>
          </v-alert>

          <v-form ref="markerFormRef">
            <v-row>
              <v-col cols="12">
                <v-text-field
                    v-model="newMarkerData.title"
                    :label="t('map.markerName')"
                    :disabled="userCollections.length <= 0"
                    :rules="[v => !!v || t('map.titleRequired')]"
                    variant="outlined"
                    required></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-select
                    v-model="newMarkerData.collectionUuid"
                    item-title="title"
                    item-value="uuid"
                    :items="userCollections"
                    :label="t('map.selectCollection')"
                    :disabled="userCollections.length <= 0"
                    :placeholder="t('map.selectCollection')"
                    variant="outlined"
                    required>
                  <template v-slot:details v-if="userCollections.length <= 0">
                    {{ t('map.collectionIsEmptyTip') }}
                  </template>
                </v-select>
              </v-col>

              <v-col cols="6">
                <v-text-field
                    :model-value="newMarkerData.longitude.toFixed(6)"
                    :disabled="userCollections.length <= 0"
                    :label="t('map.longitude')"
                    variant="outlined"
                    readonly></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                    :model-value="newMarkerData.latitude.toFixed(6)"
                    :disabled="userCollections.length <= 0"
                    :label="t('map.latitude')"
                    variant="outlined"
                    readonly></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-combobox
                    v-model="newMarkerData.tags"
                    :label="t('map.tags')"
                    :disabled="userCollections.length <= 0"
                    multiple
                    chips
                    variant="outlined"></v-combobox>
              </v-col>

              <v-col cols="12" v-if="userCollections.length > 0">
                <Textarea
                    v-model="newMarkerData.description"
                    :min-height="'200px'"
                    :value="newMarkerData.description || t('map.markerDescription')"
                    :placeholder="t('map.markerDescription')"
                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']">
                </Textarea>
              </v-col>

              <v-col cols="12">
                <v-checkbox
                    v-model="newMarkerData.public"
                    density="compact"
                    :label="t('map.publicMarker')"
                    :disabled="userCollections.length <= 0"
                    color="primary"></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 py-4">
          <v-spacer></v-spacer>
          <v-btn @click="onCancelCreateMarker" variant="text">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn
              @click="onCreateNewMarker"
              :loading="creatingMarker"
              :disabled="!authStore.isLogin || newMarkerData.collectionUuid == null"
              variant="flat">
            {{ t('map.createMarker') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 创建标记对话框 E -->

    <!-- 地图控件 S -->
    <div class="map-controls">
      <v-btn
          class="control-btn"
          @click="onZoomIn"
          variant="flat">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn
          class="control-btn"
          @click="onZoomOut"
          variant="flat">
        <v-icon>mdi-minus</v-icon>
      </v-btn>
      <v-btn
          class="control-btn"
          @click="onResetView"
          variant="flat">
        <v-icon>mdi-crosshairs-gps</v-icon>
      </v-btn>
    </div>
    <!-- 地图控件 E -->

    <!-- 地图底部信息 S -->
    <div class="map-footer">
      <v-row class="w-100 mb-1">
        <v-col class="text-caption opacity-50 ml-8">
          <v-icon size="12" class="mr-2">mdi-information-outline</v-icon>
          map tiles by
          <HtmlLink :is-icon="false" :is-iframe-show="false" href="https://mapgenie.io">mapgenie</HtmlLink>
        </v-col>
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
    <!-- 地图底部信息 E -->

    <!-- 信息卡片 S -->
    <v-card
        v-show="model"
        border
        elevation="12"
        :width="mobile ? 'calc(100% - 60px)' : 450"
        :style="{
          'top': mobile ? '140px' : '80px'
        }"
        class="map-card-info overflow-y-auto">
      <template v-slot:title>
        <div class="my-2 mr-2">
          <div class="d-flex">
            <div class="mr-2">
              <ShieldWidget :size="30"
                            :class="{'opacity-30': selectedLocationData.category == 'den' || selectedLocationData.category == 'outpost'}">
                {{ selectedLocationData.baseRank || 0 }}
              </ShieldWidget>
            </div>
            <div>
              <template v-if="selectedLocationData.category != 'shareLocation'">
                <router-link :to="`/codex/mapLocation/${selectedLocationData.id}`">
                  <div
                      class="d-flex align-center text-amber singe-line"
                      :title="t(`snb.locations.${selectedLocationData.id}`)">
                    <MapLocationNameWidget :id="selectedLocationData.id" v-if="selectedLocationData.id"></MapLocationNameWidget>
                  </div>
                </router-link>
              </template>
              <template v-else-if="selectedLocationData.category == 'shareLocation'">
                <div
                    class="d-flex align-center text-amber singe-line"
                    :title="selectedLocationData.name || selectedLocationData.id">
                  {{ selectedLocationData.name || selectedLocationData.id }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="model = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
      <template v-slot:image>
        <v-card v-if="selectedLocationData.faction" width="100%" height="400" class="overflow-hidden opacity-20">
          <FactionIconWidget :name="selectedLocationData.faction.id"
                             size="300"
                             class="img-bottom-fade faction-title-image"></FactionIconWidget>
        </v-card>
      </template>

      <div class="mx-5 pb-3">
        <v-row no-gutters align="center">
          <v-col cols="auto" class="d-flex align-center mr-2">
            <v-img
                :src="getCategoryIcon(selectedLocationData.category)"
                v-if="getCategoryIcon(selectedLocationData.category)"
                width="25"
                height="25"
                cover/>
          </v-col>
          <v-col class="text-caption">
            {{ t(`map.types.${selectedLocationData.category || 'none'}.name`) }}
          </v-col>
        </v-row>
        <v-row no-gutters class="mt-1" v-if="selectedLocationData && selectedLocationData.faction" align="center">
          <v-col cols="auto" class="d-flex align-center mr-2">
            <ItemSlotBase :size="'25px'" :padding="0">
              <FactionIconWidget :name="selectedLocationData.faction.id"></FactionIconWidget>
            </ItemSlotBase>
          </v-col>
          <v-col class="text-caption">
            <FactionNameWidget :id="selectedLocationData.faction.id"></FactionNameWidget>
          </v-col>
        </v-row>
      </div>

      <v-row class="mx-2 mt-8" v-if="selectedLocationData.difficulty" align="center">
        <v-col>
          {{ t('map.difficulty') }}
        </v-col>
        <v-col cols="auto" class="text-blue d-flex align-center">
          <v-icon>mdi-account-group</v-icon>
          <div class="font-weight-bold ml-2">
            <ShinyText :text="`${selectedLocationData.difficulty.minimumPeople || 1 }+ ${selectedLocationData.difficulty.type.toUpperCase()}`"
                       :speed=".8"
                       class-name="text-blue"></ShinyText>
          </div>
        </v-col>
      </v-row>

      <template v-if="t(`map.types.${selectedLocationData.category}.description`)">
        <v-divider class="my-2 mx-4"></v-divider>

        <div class="mx-5 mb-3 pb-2">
          {{ t(`map.types.${selectedLocationData.category}.description`) }}
        </div>
      </template>

      <template v-if="selectedLocationData && ['shareLocation'].includes(selectedLocationData.category) && selectedLocationData.description">
        <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
          {{ t('map.markerDescription') }}
        </v-row>
        <div class="mx-5 mb-5 pt-3">
          <Textarea min-height="40" :readonly="true" v-model="selectedLocationData.description"></Textarea>
        </div>
      </template>

      <template v-if="selectedLocationData && ['shareLocation'].includes(selectedLocationData.category)">
        <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
          {{ t('map.nearbyMarker') }}
        </v-row>
        <div class="mx-5 mb-5 pt-3">
          <v-row v-for="(i, index) in selectedLocationNearbyPoints" :key="index" align="center" no-gutters class="mb-1">
            <v-col cols="auto">
              <ItemSlotBase size="30px" :padding="2" class="mr-2">
                <v-img :src="getPersonalMarkerIcon()"></v-img>
              </ItemSlotBase>
            </v-col>
            <v-col>
              {{ i.title }}
            </v-col>
          </v-row>
        </div>
      </template>

      <template v-if="selectedLocationData && ['outpost'].includes(selectedLocationData.category)">
        <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
          {{ t('map.treasureMapAvailable') }}
          <v-spacer></v-spacer>
          <v-btn icon density="compact" to="/codex/treasureMaps">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </v-row>
        <div class="mb-5 pt-3">
          <MapLocationAvailableTreasureMapWidget :id="selectedLocationData.id"></MapLocationAvailableTreasureMapWidget>
        </div>
      </template>

      <template v-if="selectedLocationData && ['outpost','den'].includes(selectedLocationData.category)">
        <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
          {{ t('map.npcAvailable') }}
          <v-spacer></v-spacer>
          <v-btn icon density="compact" to="/codex/npcs">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </v-row>
        <div class="mb-5 pt-3">
          <MapLocationAvailableNpcWidget :id="selectedLocationData.id" :category="selectedLocationData.category"></MapLocationAvailableNpcWidget>
        </div>
      </template>

      <template v-if="selectedLocationData.possibleLoot">
        <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
          {{ t('map.possibleLoot') }}
        </div>
        <div class="mx-5 mb-5 pt-3 opacity-60">
          <MapPossibleLoot :possible-loot="selectedLocationData.possibleLoot"></MapPossibleLoot>
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
import type {MapCollection, MapPoint} from '@/assets/types/map';
import {useMapApi} from '@/assets/sripts/api/map_service';
import {useAuthStore} from "~/stores/userAccountStore";

import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";
import FullscreenBtn from "@/components/FullscreenBtn.vue";
import MapLocationNameWidget from "@/components/snbWidget/mapLocationNameWidget.vue";
import ShieldWidget from "@/components/snbWidget/shieldWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionNameWidget from "@/components/snbWidget/factionNameWidget.vue";
import MapPossibleLoot from "@/components/snbWidget/mapPossibleLoot.vue";
import ShinyText from "@/components/ShinyText.vue";
import MapLocationAvailableTreasureMapWidget from "@/components/snbWidget/mapLocationAvailableTreasureMapWidget.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import MapLocationAvailableNpcWidget from "@/components/snbWidget/mapLocationAvailableNpcWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

const mapImages = import.meta.glob('/src/assets/images/map/*.*', {eager: true});
const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    authStore = useAuthStore(),
    notice = useNoticeStore(),
    api = useMapApi(),
    {asString} = useI18nUtils(),
    {mobile} = useDisplay(),
    {serializationMap} = useAssetsStore();

let mapViewRef = ref<HTMLElement | null>(null),
    mapInstance: Ref<Map | null> = ref(null),
    mapCenterLocation: Ref<number[]> = ref([-0.667206, 0.626653]),
    locations: Ref<any[]> = ref(Object.values(MapLocations)),
    icons: Ref<Record<string, string>> = ref({}),
    isFull = ref(false),
    model = ref<boolean>(false),
    selectedLocationData: Ref<Record<any, any>> = ref({}),
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
    layerVisibility: Ref<Record<string, boolean>> = ref({
      shareLocation: false
    }),
    allLayersVisible = ref(true),
    vectorLayerRef: Ref<VectorLayer<VectorSource> | null> = ref(null),

    // 地图集管理相关
    userCollections = ref<MapCollection[]>([]),
    selectedCollectionUuid = ref<string>(''),
    selectedLocationNearbyPoints = ref([]),
    personalMarkers = ref<MapPoint[]>([]),
    showCreateMarkerDialog = ref(false),
    creatingMarker = ref(false),
    selectedPoint = ref<MapPoint | null>(null),

    // 表单引用
    markerFormRef = ref(null),

    // 标记表单数据
    newMarkerData = ref({
      collectionUuid: '',
      title: '',
      description: '',
      longitude: 0,
      latitude: 0,
      address: '',
      tags: [] as string[],
      public: false,
      sharedUsers: [] as string[]
    }),
    editingMarker = ref(false),

    // 计算可用分类
    availableCategories = computed(() => {
      const uniqueCategories = [...new Set(locations.value.map(loc => loc.category))];
      return uniqueCategories.map(category => ({
        value: category,
        text: t(`map.types.${category}.name`)
      }));
    }),
    // 计算个人标记数量
    personalMarkersCount = computed(() => {
      return personalMarkers.value.length;
    }),
    // 用户可用地图集
    userCollectionsSelect = computed(() => {
      return [{title: t('none'), uuid: null}].concat(userCollections.value as [])
    });

watch(() => searchQuery.value, (newValue) => {
  if (!newValue) {
    searchSuggestions.value = [];
  }
});

watch(() => selectedLocationData.value, async () => {
  if (!authStore.isLogin) return;

  if (model.value == true) {
    const {latitude, longitude} = selectedLocationData.value;
    await onSearchNearbyPoints(latitude, longitude)
  }
})

watch(() => selectedCollectionUuid.value, async (newCollectionUuid) => {
  if (!authStore.isLogin) return;

  // 监听选中的地图集变化
  if (newCollectionUuid) {
    await loadCollectionPoints(newCollectionUuid);
  } else {
    personalMarkers.value = [];
    onRemovePersonalMarkersFromMap();
  }
});

onMounted(async () => {
  const {x: queryX, y: queryY, key: queryKey, category: queryCategory} = route.query;

  // 初始化图层可见性
  initializeLayerVisibility();

  // 加载图标
  icons.value = serializationMap(mapImages);

  // 创建矢量数据源并添加要素
  const vectorSource = new VectorSource({
    features: onCreateFeaturesFromLocations(locations.value)
  });

  // 创建矢量图层
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    zIndex: 100,
    style: (feature) => {
      const originalData = feature.get('originalData');
      const featureCategory = originalData?.category;

      // 处理个人标记
      if (featureCategory === 'shareLocation') {
        const isPersonalVisible = layerVisibility.value.shareLocation;
        return isPersonalVisible ? onCreatePersonalMarkerStyle() : null;
      }

      // 处理系统标记
      const isSystemVisible = layerVisibility.value[featureCategory];
      return isSystemVisible ? onCreateMarkerStyle(feature) : null;
    }
  } as any);

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
      doubleClickZoom: false,
    }),
    view: new View({
      center: locations.value.length > 0
          ? fromLonLat(mapCenterLocation.value)
          : fromLonLat([0.0, 0.0]),
      zoom: 13,
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

  // 添加点击地图事件
  map.on('click', async (event) => {
    // 检查是否点击到了要素
    const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
      return feature as OLFeature<Geometry>;
    });

    if (feature) {
      const originalData = feature.get('originalData');

      // 处理个人标记点击
      if (originalData?.category == 'shareLocation') {
        selectedPoint.value = originalData;
        selectedLocationData.value = {
          ...originalData,
          id: originalData.id,
          name: originalData.title,
          category: 'shareLocation',
        };
        model.value = true;
        showCoordinateInfo.value = false;

        await router.push({
          name: route.name,
          query: {
            ...route.query,
            key: originalData.id,
            x: originalData.longitude,
            y: originalData.latitude,
            category: 'shareLocation'
          }
        });
        return;
      }

      // 处理系统标记点击
      selectedLocationData.value = originalData;
      model.value = true;
      showCoordinateInfo.value = false;

      await router.push({
        name: route.name,
        query: {
          ...route.query,
          key: selectedLocationData.value.id,
          x: selectedLocationData.value.longitude,
          y: selectedLocationData.value.latitude,
          category: selectedLocationData.value.category
        }
      });
      return;
    }

    showCoordinateInfo.value = true;
    model.value = false;

    await router.push({
      name: route.name,
      query: {}
    });
  });

  // 添加双击地图事件
  map.on('dblclick', (event) => {
    const coordinate = toLonLat(event.coordinate);
    clickedCoordinate.value = {
      longitude: coordinate[0],
      latitude: coordinate[1]
    };

    // 设置新标记的数据
    newMarkerData.value = {
      collectionUuid: selectedCollectionUuid.value || (userCollections.value[0]?.uuid || ''),
      title: '',
      description: '',
      longitude: coordinate[0],
      latitude: coordinate[1],
      address: '',
      tags: [],
      public: false,
      sharedUsers: []
    };

    editingMarker.value = false;
    showCoordinateInfo.value = true;
    model.value = false;
    showCreateMarkerDialog.value = true;

    router.push({
      name: route.name,
      query: {}
    });
  });

  // 添加指针移动事件，实时更新坐标
  map.on('pointermove', (event) => {
    if (event.dragging) return;

    const lonLat = toLonLat(event.coordinate);
    hoveedCoordinate.value = {
      longitude: lonLat[0],
      latitude: lonLat[1]
    };
  });

  // 加载用户的地图集
  await onLoadUserCollections();

  // 处理URL参数
  if (queryKey) {
    await onHandleUrlParams(queryKey as string, queryX as string, queryY as string, queryCategory as string, vectorSource);
  }
});

/**
 * 处理URL参数
 */
const onHandleUrlParams = async (
    queryKey: string,
    queryX: string,
    queryY: string,
    queryCategory: string,
    vectorSource: VectorSource
): Promise<void> => {
  // 查找已有的位置数据
  const existingLocation = locations.value.find(loc => loc.id === queryKey);

  if (existingLocation) {
    // 使用已有的坐标数据
    mapInstance.value?.getView().animate({
      center: fromLonLat([existingLocation.longitude, existingLocation.latitude]),
      duration: 0
    });

    selectedLocationData.value = existingLocation;
    model.value = true;
  } else if (queryX && queryY && queryCategory) {
    // 创建分享位置或查找个人标记
    if (queryCategory == 'shareLocation') {
      // 查找个人标记
      const personalMarker = personalMarkers.value.find(marker => marker.id === queryKey);
      if (personalMarker) {
        mapInstance.value?.getView().animate({
          center: fromLonLat([personalMarker.longitude, personalMarker.latitude]),
          duration: 0
        });

        selectedLocationData.value = {
          ...personalMarker,
          category: 'shareLocation',
          id: personalMarker.id,
          name: personalMarker.title
        };
        model.value = true;
      }
    } else {
      // 创建分享位置
      const loadLocation = {
        name: queryKey as string,
        id: queryKey as string,
        latitude: parseFloat(queryY as string),
        longitude: parseFloat(queryX as string),
        category: queryCategory as string,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // 创建新的要素并添加到地图
      const newFeature = onCreateFeatureFromLocation(loadLocation);
      vectorSource.addFeature(newFeature);

      // 更新图层可见性状态
      if (!layerVisibility.value[queryCategory]) {
        layerVisibility.value[queryCategory] = true;
        onUpdateAllLayersVisibleState();
      }

      mapInstance.value?.getView().animate({
        center: fromLonLat([parseFloat(queryX as string), parseFloat(queryY as string)]),
        duration: 0
      });

      selectedLocationData.value = loadLocation;
      model.value = true;

      // 如果是分享位置，添加到locations中以便搜索
      if (queryCategory == 'shareLocation') {
        locations.value.push(loadLocation);
      }
    }
  }
};

/**
 * 加载用户的地图集
 */
const onLoadUserCollections = async (): Promise<void> => {
  try {
    if (!authStore.isLogin) return

    const result = await api.getCollections(),
        d = result.data;

    userCollections.value = d.data;

    // 如果没有选中的地图集且存在地图集，默认选中第一个
    if (userCollections.value.length > 0 && !selectedCollectionUuid.value) {
      selectedCollectionUuid.value = userCollections.value[0].uuid;
    }
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
  }
};

/**
 * 加载地图集的坐标点
 */
const loadCollectionPoints = async (collectionUuid: string): Promise<void> => {
  try {
    if (!authStore.isLogin && !collectionUuid) return

    const result = await api.getCollectionPoints(collectionUuid),
        d = result.data;

    const points = d.points;
    personalMarkers.value = points;

    // 将个人标记添加到地图
    onAddPersonalMarkersToMap(points);

  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
  }
};

/**
 * 将个人标记添加到地图
 */
const onAddPersonalMarkersToMap = (points: MapPoint[]): void => {
  if (!mapInstance.value || !vectorLayerRef.value) return;

  const vectorSource = vectorLayerRef.value.getSource();
  if (!vectorSource) return;

  // 清除现有的个人标记
  onRemovePersonalMarkersFromMap();

  // 添加新的个人标记
  points.forEach(point => {
    const feature = createPersonalFeature(point);
    vectorSource.addFeature(feature);
  });

  // 刷新地图显示
  vectorLayerRef.value.changed();
};

/**
 * 创建个人标记要素
 */
const createPersonalFeature = (point: MapPoint): OLFeature<Geometry> => {
  return new Feature({
    geometry: new Point(fromLonLat([point.longitude, point.latitude])),
    id: point.id,
    name: point.title,
    originalData: {
      ...point,
      category: 'shareLocation'
    }
  }) as OLFeature<Geometry>;
};

/**
 * 从地图移除个人标记
 */
const onRemovePersonalMarkersFromMap = (): void => {
  if (!vectorLayerRef.value) return;

  const vectorSource = vectorLayerRef.value.getSource();
  if (!vectorSource) return;

  const features = vectorSource.getFeatures();
  features.forEach(feature => {
    const originalData = feature.get('originalData');

    if (originalData && originalData.category == 'shareLocation') {
      vectorSource.removeFeature(feature);
    }
  });
};

/**
 * 创建新标记
 */
const onCreateNewMarker = async (): Promise<void> => {
  if (!markerFormRef.value) return;

  const {valid} = await markerFormRef.value.validate();
  if (!valid) return;

  creatingMarker.value = true;

  try {
    await api.createPoint({
      collectionUuid: newMarkerData.value.collectionUuid,
      title: newMarkerData.value.title,
      description: newMarkerData.value.description,
      latitude: newMarkerData.value.latitude,
      longitude: newMarkerData.value.longitude,
      address: newMarkerData.value.address,
      tags: newMarkerData.value.tags,
      public: newMarkerData.value.public,
      sharedUsers: newMarkerData.value.sharedUsers
    });

    // 重新加载当前地图集的坐标点
    if (selectedCollectionUuid.value === newMarkerData.value.collectionUuid) {
      await loadCollectionPoints(selectedCollectionUuid.value);
    }

    // 关闭对话框并重置数据
    showCreateMarkerDialog.value = false;
    onResetNewMarkerData();

  } catch (error) {
    console.error('创建标记失败:', error);
  } finally {
    creatingMarker.value = false;
  }
};

/**
 * 重置新标记数据
 */
const onResetNewMarkerData = (): void => {
  newMarkerData.value = {
    collectionUuid: selectedCollectionUuid.value || '',
    title: '',
    description: '',
    longitude: 0,
    latitude: 0,
    address: '',
    tags: [],
    public: false,
    sharedUsers: []
  };
  editingMarker.value = false;
};

/**
 * 取消创建标记
 */
const onCancelCreateMarker = (): void => {
  showCreateMarkerDialog.value = false;
  onResetNewMarkerData();
  selectedPoint.value = null;
};

/**
 * 切换个人图层显示
 */
const onTogglePersonalLayer = (): void => {
  if (!vectorLayerRef.value) return;

  // 强制刷新地图
  vectorLayerRef.value.changed();
};

/**
 * 创建个人标记样式
 */
const onCreatePersonalMarkerStyle = (): Style => {
  return new Style({
    image: new Icon({
      src: getPersonalMarkerIcon(),
      scale: 0.1,
      anchor: [0.5, 1],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction'
    }),
  });
};

/**
 * 获取个人标记图标
 */
const getPersonalMarkerIcon = (): string => {
  return icons.value['shareLocation'];
};

/**
 * 搜索附近的坐标点
 */
const onSearchNearbyPoints = async (latitude: number, longitude: number, radius: number = 10): Promise<void> => {
  try {
    selectedLocationNearbyPoints.value = [];

    const result = await api.getNearbyPoints({
          latitude,
          longitude,
          radius,
          limit: 10
        }),
        d = result.data;

    selectedLocationNearbyPoints.value = d.points;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
  }
};

/**
 * 获取类别数量
 * @param category
 */
const getCategoryCount = (category: string) => {
  return locations.value.filter(loc => loc.category === category).length;
};

/**
 * 获取类别图标
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
    const displayName = getLocationDisplayName(location).toLowerCase();
    const locationId = location.id.toLowerCase();
    const searchTerm = value.toLowerCase().trim();

    return displayName.includes(searchTerm) || locationId.includes(searchTerm);
  }).slice(0, 10);

  searchSuggestions.value = filtered.map(location => ({
    title: getLocationDisplayName(location),
    value: location.id,
    ...location
  }));
};

/**
 * 处理搜索下拉选择
 * @param selectedItem
 */
const onHandleSelectSuggestion = (selectedItem: any) => {
  if (selectedItem && selectedItem.id) {
    onSelectLocation(selectedItem);
  }
};

/**
 * 选择搜索地点
 * @param location
 */
const onSelectLocation = (location: any) => {
  if (!location || !mapInstance.value) return;

  mapInstance.value.getView().animate({
    center: fromLonLat([location.longitude, location.latitude]),
    zoom: 15,
    duration: 500
  });

  selectedLocationData.value = location;
  model.value = true;
  showCoordinateInfo.value = false;

  searchQuery.value = '';

  router.push({
    name: route.name,
    query: {
      ...route.query,
      key: location.id,
      x: location.longitude,
      y: location.latitude,
      category: location.category
    }
  });
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  if (!searchQuery.value.trim()) return;

  const foundLocation = locations.value.find(location => {
    const displayName = getLocationDisplayName(location).toLowerCase();
    const locationId = location.id.toLowerCase();
    const searchTerm = searchQuery.value.toLowerCase().trim();

    return displayName === searchTerm || locationId === searchTerm;
  });

  if (foundLocation) {
    onSelectLocation(foundLocation);
  } else if (searchSuggestions.value.length > 0) {
    onSelectLocation(searchSuggestions.value[0]);
  }
};

/**
 * 图层开关
 */
const onToggleLayer = () => {
  if (!vectorLayerRef.value) return;

  vectorLayerRef.value.setStyle((feature: any) => {
    const originalData = feature.get('originalData');
    const featureCategory = originalData?.category;

    if (originalData?.category == 'shareLocation') {
      const isPersonalVisible = layerVisibility.value.shareLocation;
      return isPersonalVisible ? onCreatePersonalMarkerStyle() : null;
    }

    const isSystemVisible = layerVisibility.value[featureCategory];
    return isSystemVisible ? onCreateMarkerStyle(feature) : null;
  });

  vectorLayerRef.value.changed();
  onUpdateAllLayersVisibleState();
};

/**
 * 所有图层开关
 */
const onToggleAllLayers = () => {
  if (!vectorLayerRef.value || !availableCategories.value.length) return;

  const newVisibility = !allLayersVisible.value;

  availableCategories.value.forEach(category => {
    layerVisibility.value[category.value] = newVisibility;
  });
  layerVisibility.value.shareLocation = newVisibility;

  allLayersVisible.value = newVisibility;

  vectorLayerRef.value.setStyle((feature: any) => {
    const originalData = feature.get('originalData');
    const featureCategory = originalData?.category;

    if (featureCategory == 'shareLocation') {
      return newVisibility ? onCreatePersonalMarkerStyle() : null;
    }

    return newVisibility ? onCreateMarkerStyle(feature) : null;
  });

  vectorLayerRef.value.changed();
};

/**
 * 更新所有图层可见状态
 */
const onUpdateAllLayersVisibleState = () => {
  const allCategories = availableCategories.value.map(cat => cat.value);
  allCategories.push('shareLocation');
  allLayersVisible.value = allCategories.every(category => layerVisibility.value[category]);
};

/**
 * 初始化图层可见
 */
const initializeLayerVisibility = () => {
  const allCategories = [...new Set(locations.value.map(loc => loc.category))];
  allCategories.forEach(category => {
    layerVisibility.value[category] = true;
  });
  layerVisibility.value.shareLocation = true;
};

/**
 * 地点名称
 * @param data
 */
const getLocationDisplayName = (data: any): string => {
  const location = data;
  if (!location.id) return '';

  return asString([
    location.id,
    `snb.mapLocations.${location.id}.name`
  ], {backRawKey: false}) || location.id;
};

/**
 * 创建标记样式
 * @param feature
 */
const onCreateMarkerStyle = (feature: OLFeature<Geometry>): Style => {
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
 * 位置创建功能
 * @param locations
 */
const onCreateFeaturesFromLocations = (locations: any[]): OLFeature<Geometry>[] => {
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
 * 从位置信息创建功能项
 * @param location
 */
const onCreateFeatureFromLocation = (location: any): OLFeature<Geometry> => {
  return new Feature({
    geometry: new Point(fromLonLat([location.longitude, location.latitude])),
    id: location.id,
    name: location.name || `位置${location.id}`,
    originalData: location
  }) as OLFeature<Geometry>;
};

/**
 * 地图放大
 */
const onZoomIn = (): void => {
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
 * 地图缩小
 */
const onZoomOut = (): void => {
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
 * 地图重置
 */
const onResetView = (): void => {
  if (mapInstance.value && locations.value.length > 0) {
    const view = mapInstance.value.getView();

    view.animate({
      center: fromLonLat(mapCenterLocation.value),
      zoom: 13,
      duration: 500
    });
  }
};

defineExpose({
  resetView: onResetView,
  zoomIn: onZoomIn,
  zoomOut: onZoomOut
});
</script>

<style scoped lang="less">
.map {
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
    z-index: 40;
    min-width: 300px;
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

  .imap-view-full {
    position: fixed;
    z-index: 38;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

  .map-controls {
    position: absolute;
    bottom: 45px;
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

  .map-card-info {
    background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
    backdrop-filter: blur(20px);
    position: absolute;
    z-index: 10;
    right: 30px;
    max-height: 80vh;

    .map-title {
      marker: none;
      background-color: hsl(from #000 h s l / .3);
    }

    .faction-title-image {
      transform: rotate3d(1, -1, 1, 55deg) translate(50px, -190px);
      filter: blur(10px);
      mask-image: linear-gradient(to top, #00000000 0%, black 80%);
    }
  }

  .map-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
}

.create-marker-card {
  margin-top: -80px !important;
}
</style>
