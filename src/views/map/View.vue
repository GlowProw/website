<template>
  <div class="map" :class="{'position-relative': !isFull}">
    <MapView
        class="map-view"
        :class="{'imap-view-full': isFull}"
        :longitude="targetLongitude"
        :latitude="targetLatitude"
        :location-id="targetLocationId"
        :locations="locations"
        :bounds="mapBounds"
        :debug="isDebug"
        @map-created="onMapCreated"
    />

    <MapToolbar
        v-model="searchQuery"
        v-model:search="searchInput"
        :search-suggestions="searchSuggestions"
        :is-layer-panel-visible="isShowMarkModel"
        :get-category-icon="getCategoryIcon"
        @search="handleSearch"
        @toggle-layers="isShowMarkModel = !isShowMarkModel"
        @update:fullscreen="isFull = $event"
    />

    <MapLayerControl
        v-model="isShowMarkModel"
        :selected-collection-uuid="selectedCollectionUuid"
        :user-collections-select="userCollectionsSelect"
        :all-layers-visible="allLayersVisible"
        :available-categories="availableCategories"
        :grouped-categories="groupedCategories"
        :layer-visibility="layerVisibility"
        :group-visibility="groupVisibility"
        :get-category-icon="getCategoryIcon"
        :get-category-count="getCategoryCount"
        :get-personal-marker-icon="getPersonalMarkerIcon"
        :personal-markers-count="personalMarkersCount"
        @update:selected-collection-uuid="selectedCollectionUuid = $event"
        @toggle-all-layers="onToggleAllLayers"
        @init-visibility="onInitVisibility"
        @update:layer-visibility="onToggleLayer"
        @update:group-visibility="onToggleGroupLayer"
    />

    <MapLocationCard
        v-model="model"
        :selected-location="selectedLocationData"
        :get-category-icon="getCategoryIcon"
        :get-personal-marker-icon="getPersonalMarkerIcon"
        :nearby-points="selectedLocationNearbyPoints"
    />

    <MapCreateMarkerDialog
        v-model="showCreateMarkerDialog"
        :new-marker-data="newMarkerData"
        :user-collections="userCollections"
        :creating-marker="creatingMarker"
        :is-login="authStore.isLogin"
        @update:marker-data="newMarkerData = $event"
        @cancel="onCancelCreateMarker"
        @create="onCreateNewMarker"
        ref="markerFormRef"
    />

    <MapControls @zoom-in="_onZoomIn" @zoom-out="_onZoomOut" @reset-view="_onResetView" />

    <MapFooter
        :hoveed-coordinate="hoveedCoordinate"
        :clicked-coordinate="clickedCoordinate"
        :is-debug="isDebug"
    />

    <MapContextMenu
        :visible="contextMenuState.visible"
        :x="contextMenuState.x"
        :y="contextMenuState.y"
        :items="contextMenuItems"
        @close="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { use_map_controller } from '@/assets/sripts/use_map_controller';
import MapView from '@/components/map/MapView.vue';
import MapToolbar from '@/components/map/MapToolbar.vue';
import MapLayerControl from '@/components/map/MapLayerControl.vue';
import MapLocationCard from '@/components/map/MapLocationCard.vue';
import MapCreateMarkerDialog from '@/components/map/MapCreateMarkerDialog.vue';
import MapControls from '@/components/map/MapControls.vue';
import MapFooter from '@/components/map/MapFooter.vue';
import MapContextMenu from '@/components/map/MapContextMenu.vue';

const {
  authStore,
  mobile,
  mapInstance,
  vectorLayerRef,
  mapCenterLocation,
  mapBounds,
  locations,
  icons,
  isFull,
  model,
  selectedLocationData,
  showCoordinateInfo,
  clickedCoordinate,
  hoveedCoordinate,
  targetLongitude,
  targetLatitude,
  targetLocationId,
  searchQuery,
  searchInput,
  searchSuggestions,
  isShowMarkModel,
  layerVisibility,
  groupVisibility,
  allLayersVisible,
  userCollections,
  selectedCollectionUuid,
  selectedLocationNearbyPoints,
  personalMarkers,
  showCreateMarkerDialog,
  creatingMarker,
  selectedPoint,
  markerFormRef,
  newMarkerData,
  editingMarker,
  availableCategories,
  groupedCategories,
  personalMarkersCount,
  userCollectionsSelect,
  isDebug,
  onMapCreated,
  onHandleUrlParams,
  onLoadUserCollections,
  loadCollectionPoints,
  onAddPersonalMarkersToMap,
  createPersonalFeature,
  onRemovePersonalMarkersFromMap,
  onCreateNewMarker,
  onResetNewMarkerData,
  onCancelCreateMarker,
  onTogglePersonalLayer,
  onCreatePersonalMarkerStyle,
  getPersonalMarkerIcon,
  onSearchNearbyPoints,
  getCategoryCount,
  getCategoryIcon,
  handleSearch,
  onToggleLayer,
  onToggleGroupLayer,
  onToggleAllLayers,
  onInitVisibility,
  onUpdateAllLayersVisibleState,
  initializeLayerVisibility,
  getLocationDisplayName,
  onCreateMarkerStyle,
  onCreateFeaturesFromLocations,
  onCreateFeatureFromLocation,
  _onZoomIn,
  _onZoomOut,
  _onResetView,
  contextMenuState,
  contextMenuItems,
  closeContextMenu,
} = use_map_controller();
</script>

<style scoped lang="less">
.map {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 100px);
  max-height: 100vh;
  background: #b1c1bf;

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
}
</style>
