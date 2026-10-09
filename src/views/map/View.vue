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
        :is-settings-open="isShowSettings"
        :is-login="authStore.isLogin"
        :marquee-mode="marqueeMode"
        :get-category-icon="getCategoryIcon"
        @search="handleSearch"
        @toggle-layers="isShowMarkModel = !isShowMarkModel"
        @toggle-settings="isShowSettings = !isShowSettings"
        @update:fullscreen="isFull = $event"
        @toggle-marquee="onToggleMarqueeMode"
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
        :path-shapes-count="pathShapesCount"
        :region-shapes-count="regionShapesCount"
        @update:selected-collection-uuid="selectedCollectionUuid = $event"
        @toggle-all-layers="onToggleAllLayers"
        @init-visibility="onInitVisibility"
        @update:layer-visibility="onToggleLayer"
        @update:group-visibility="onToggleGroupLayer"
    />

    <MapSetting
        v-model="isShowSettings"
        :get-category-icon="getCategoryIcon"
        :available-categories="availableCategories"
        :grouped-categories="groupedCategories"
        @config-changed="onConfigChanged"
    />

    <MapLocationCard
        v-model="model"
        :selected-location="selectedLocationData"
        :get-category-icon="getCategoryIcon"
        :get-personal-marker-icon="getPersonalMarkerIcon"
        :nearby-points="selectedLocationNearbyPoints"
        :is-debug="isDebug"
        @edit-marker="openEditMarker"
        @clone-marker="cloneMarker"
        @copy-marker-json="copyMarkerJson"
        @copy-marker-coords="copyMarkerCoordinates"
    />

    <MapDebugEditMarkerDialog
        v-model="showEditMarkerDialog"
        :marker-data="editingMarkerData"
        :available-categories="availableCategories"
        :get-category-icon="getCategoryIcon"
        @save="saveEditMarker"
        @cancel="onCancelEditMarker"
    />

    <MapEditMarkerDialog
        v-model="showPointEditDialog"
        :form="pointEditForm"
        :user-collections="userCollections"
        :saving="savingPointEdit"
        ref="pointEditFormRef"
        @update:form="onPointEditFormChange"
        @cancel="onCancelPointEdit"
        @save="onSavePointEdit"
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

    <MapShapeInfoCard
        :shape="selectedShape"
        :vertex-editing="!!selectedShape && shapeVertexEditingUuid === selectedShape.uuid"
        @close="closeShapeCard"
        @edit-attrs="openShapeEdit"
        @edit-vertices="beginShapeVertexEdit"
        @cancel-vertices="cancelShapeVertexEdit"
        @save-vertices="saveShapeVertexEdit"
        @delete="deleteShape"
    />

    <MapShapeEditDialog
        v-model="showShapeDialog"
        :mode="shapeDialogMode"
        :shape-type="shapeDialogType"
        :form="shapeFormData"
        :user-collections="userCollections"
        :saving="savingShape"
        @update:form="onShapeFormChange"
        @cancel="onCancelShapeDialog"
        @save="onSaveShape"
        ref="shapeFormRef"
    />

    <!-- 只读浏览他人公开地图集时的顶部提示条 -->
    <div v-if="sharedCollectionPreview" class="shared-preview-wrap">
      <v-card color="amber" variant="tonal" rounded="pill" class="shared-preview-card px-4 py-2">
        <div class="d-flex align-center flex-wrap ga-3">
          <v-icon size="20" color="amber-darken-2">mdi-share-variant-outline</v-icon>
          <span class="text-body-2">
            {{ t('map.share.previewBanner', {creator: sharedCollectionPreview.creator.name, title: sharedCollectionPreview.title}) }}
          </span>
          <v-chip size="x-small" variant="outlined" color="amber-darken-2">
            {{ t('map.share.readonlyBadge') }}
          </v-chip>
          <v-btn size="x-small" variant="text" color="amber-darken-3"
                 @click="exitSharedPreview">
            {{ t('map.share.exitPreview') }}
          </v-btn>
        </div>
      </v-card>
    </div>

    <MapCollectionShareDialog
        :model-value="showShareCollectionDialog"
        :info="sharedCollectionInfo"
        :importing="importingSharedCollection"
        @cancel="onCancelShareDialog"
        @preview="onPreviewSharedCollection"
        @import="onImportSharedCollection"
    />

    <!-- 框选结果操作条：拖动任意选中项统一移动，或一键删除/取消 -->
    <div v-if="marqueeCount > 0" class="marquee-action-wrap">
      <v-card border elevation="24" rounded="lg" class="marquee-action-card px-3 py-2">
        <div class="d-flex align-center ga-3 flex-wrap">
          <v-icon color="amber" icon="mdi-selection-multiple"></v-icon>
          <span class="text-body-2">{{ t('map.marquee.selectedCount', { count: marqueeCount }) }}</span>
          <span class="text-caption text-medium-emphasis">{{ t('map.marquee.moveHint') }}</span>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="tonal" color="red" prepend-icon="mdi-delete-outline"
                 @click="onDeleteMarqueeSelection">
            {{ t('map.marquee.deleteSelected') }}
          </v-btn>
          <v-btn size="small" variant="text" prepend-icon="mdi-close"
                 @click="clearMarqueeSelection">
            {{ t('map.marquee.cancel') }}
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- 通用删除确认 -->
    <v-dialog :model-value="confirmState.visible" max-width="420" persistent>
      <v-card border>
        <v-card-title class="d-flex align-center ga-2 py-4">
          <v-icon :color="confirmState.danger ? 'red' : 'amber'" icon="mdi-alert-outline"></v-icon>
          {{ t('basic.button.confirm') || '确认' }}
        </v-card-title>
        <v-card-text class="text-body-2">{{ confirmState.message }}</v-card-text>
        <v-card-actions class="border-t px-4 py-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="onCancelConfirmDialog">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn :color="confirmState.danger ? 'red' : 'amber'" variant="tonal"
                 @click="onConfirmDialog">
            {{ t('basic.button.confirm') || '确认' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <MapZoomControls @zoom-in="_onZoomIn" @zoom-out="_onZoomOut" @reset-view="_onResetView" />

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
import { useI18n } from 'vue-i18n';
import { use_map_controller } from '@/assets/sripts/use_map_controller';
import MapView from '@/components/map/MapView.vue';
import MapToolbar from '@/components/map/MapToolbar.vue';
import MapLayerControl from '@/components/map/MapLayerControl.vue';
import MapSetting from '@/components/map/MapSetting.vue';
import MapLocationCard from '@/components/map/MapLocationCard.vue';
import MapDebugEditMarkerDialog from '@/components/map/MapDebugEditMarkerDialog.vue';
import MapEditMarkerDialog from '@/components/map/MapEditMarkerDialog.vue';
import MapCreateMarkerDialog from '@/components/map/MapCreateMarkerDialog.vue';
import MapShapeEditDialog from '@/components/map/MapShapeEditDialog.vue';
import MapShapeInfoCard from '@/components/map/MapShapeInfoCard.vue';
import MapCollectionShareDialog from '@/components/map/MapCollectionShareDialog.vue';
import MapZoomControls from '@/components/map/MapZoomControls.vue';
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
  isShowSettings,
  layerVisibility,
  groupVisibility,
  allLayersVisible,
  userCollections,
  selectedCollectionUuid,
  selectedLocationNearbyPoints,
  personalMarkers,
  selectedShape,
  showCreateMarkerDialog,
  creatingMarker,
  selectedPoint,
  markerFormRef,
  newMarkerData,
  editingMarker,
  availableCategories,
  groupedCategories,
  personalMarkersCount,
  pathShapesCount,
  regionShapesCount,
  userCollectionsSelect,
  isDebug,
  shapeVertexEditingUuid,
  showShapeDialog,
  shapeDialogMode,
  shapeDialogType,
  savingShape,
  shapeFormRef,
  shapeFormData,
  showShareCollectionDialog,
  sharedCollectionInfo,
  importingSharedCollection,
  sharedCollectionPreview,
  onPreviewSharedCollection,
  onImportSharedCollection,
  onCancelShareDialog,
  exitSharedPreview,
  onMapCreated,
  onHandleUrlParams,
  onLoadUserCollections,
  loadCollectionPoints,
  loadCollectionShapes,
  onStartDraw,
  onShapeFormChange,
  onSaveShape,
  onCancelShapeDialog,
  openShapeEdit,
  beginShapeVertexEdit,
  cancelShapeVertexEdit,
  saveShapeVertexEdit,
  deleteShape,
  closeShapeCard,
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
  isEditingBounds,
  isMarkerDraggingEnabled,
  showEditMarkerDialog,
  editingMarkerData,
  openEditMarker,
  saveEditMarker,
  onCancelEditMarker,
  cloneMarker,
  copyMarkerJson,
  copyMarkerCoordinates,
  closeContextMenu,
  openLocationDetail,
  onConfigChanged,
  showPointEditDialog,
  savingPointEdit,
  pointEditFormRef,
  pointEditForm,
  confirmState,
  marqueeMode,
  marqueeSelection,
  marqueeCount,
  onPointEditFormChange,
  onSavePointEdit,
  onCancelPointEdit,
  onConfirmDialog,
  onCancelConfirmDialog,
  onToggleMarqueeMode,
  clearMarqueeSelection,
  onDeleteMarqueeSelection,
} = use_map_controller();

const { t } = useI18n();
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

.shared-preview-wrap {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  max-width: calc(100vw - 32px);
}

.shared-preview-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
}

.marquee-action-wrap {
  position: fixed;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  width: min(560px, calc(100vw - 32px));
}

.marquee-action-card {
  background: hsl(from rgb(var(--v-theme-background)) h s l / .92);
}
</style>

<style lang="less">
/* DragBox 在地图视口内直接生成的拖框元素，不走组件作用域，需要全局样式 */
.map-marquee-box {
  background: rgba(255, 213, 79, 0.15);
  border: 2px dashed #ffb300;
  border-radius: 2px;
  cursor: crosshair;
}
</style>
