<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useMasteryController} from '@/assets/sripts/use_mastery_controller';
import MasteryView from '@/components/mastery/MasteryView.vue';
import MasteryToolbar from '@/components/mastery/MasteryToolbar.vue';
import MasteryInfoPanel from '@/components/mastery/MasteryInfoPanel.vue';
import MasteryNodeCard from '@/components/mastery/MasteryNodeCard.vue';
import MasteryFooter from '@/components/mastery/MasteryFooter.vue';
import MasteryDebugPanel from '@/components/mastery/MasteryDebugPanel.vue';
import MasteryShareDialog from '@/components/mastery/MasteryShareDialog.vue';
import MasterySaveDialog from '@/components/mastery/MasterySaveDialog.vue';
import StylizedLineBackground from '@/components/StylizedLineBackground.vue';

const {t} = useI18n();
const masteryViewRef = ref<HTMLDivElement | null>(null);
const canvasCompRef = ref<InstanceType<typeof MasteryView> | null>(null);

const {
  route,
  router,
  isDebug,
  mobile,
  snackbarShow,
  snackbarText,
  snackbarColor,
  notify,
  svgScaleExtent,
  scaleExtent,
  transform,
  selectedSeasonId,
  seasonOptions,
  activeTree,
  maxPoints,
  localNodes,
  selectedNodeIds,
  selectedNode,
  regularPointsSpent,
  activeSeasonalPerks,
  aggregatedEffects,
  filteredAggregatedEffects,
  effectsFilter,
  expandedEffectIds,
  isAllEffectsExpanded,
  isLeftPanelOpen,
  panelExpanded,
  showShareDialog,
  searchSelected,
  searchItems,
  locateTargetNode,
  getSkillName,
  getSkillDesc,
  getNodeIconUrl,
  isNodeActive,
  isNodeAvailable,
  getNodeState,
  getNodeStateColor,
  getNodeStateText,
  getCategoryColor,
  getNodeRequirementItems,
  toggleNodeActivation,
  resetPoints,
  selectNode,
  locateNodeById,
  toggleEffectExpand,
  toggleAllEffectsExpanded,
  generateShareCode,
  getShareUrl,
  copyShareUrl,
  loadFromShareCode,
  initFromUrlParams,
  savedBuilds,
  showSaveDialog,
  saveBuild,
  deleteBuild,
  loadBuild,
} = useMasteryController({});

const shareUrl = computed(() => {
  if (selectedNodeIds.value) {
    // 建立依赖
  }
  return getShareUrl();
});

const shareCode = computed(() => {
  if (selectedNodeIds.value) {
    // 建立依赖
  }
  return generateShareCode();
});

const activeSeasonTitle = computed(() => {
  return seasonOptions.value?.find(s => s.id === selectedSeasonId.value)?.title || selectedSeasonId.value;
});

function onLocateNode(id: string) {
  locateNodeById(id);
  const node = localNodes.value[id];
  if (node) {
    canvasCompRef.value?.locateNode(node);
  }
}

watch(searchSelected, (val) => {
  if (val) {
    onLocateNode(val);
  }
});

watch(locateTargetNode, (node) => {
  if (node) {
    canvasCompRef.value?.locateNode(node);
  }
});

watch(selectedSeasonId, (newSeason) => {
  router.replace({
    query: {
      ...route.query,
      season: newSeason
    }
  });
});

function exportDebugJson() {
  const data = JSON.stringify(localNodes.value, null, 2);
  navigator.clipboard.writeText(data).then(() => {
    notify(t('mastery.debug.copied'), 'success');
  }).catch(() => {
    notify(t('mastery.shareDialog.copyFailed'), 'error');
  });
}

onMounted(() => {
  initFromUrlParams();
});
</script>

<template>
  <div class="mastery-container" id="mastery-simulation" ref="masteryViewRef">
    <!-- 消息提示 Snackbar -->
    <v-snackbar
        v-model="snackbarShow"
        :color="snackbarColor"
        timeout="2500"
        location="top"
        variant="flat"
        elevation="8">
      <div class="d-flex align-center">
        <v-icon start size="18">
          {{ snackbarColor === 'error' ? 'mdi-alert-circle' : snackbarColor === 'success' ? 'mdi-check-circle' : 'mdi-information' }}
        </v-icon>
        <span>{{ snackbarText }}</span>
      </div>
    </v-snackbar>

    <StylizedLineBackground
        class="mastery-bg-layer"
        :offset-x="transform?.x ?? 0"
        :offset-y="transform?.y ?? 0">
      <MasteryView
          ref="canvasCompRef"
          :nodes="localNodes"
          :selected-node="selectedNode"
          :selected-node-ids="selectedNodeIds"
          :regular-points-spent="regularPointsSpent"
          :scale-extent="[svgScaleExtent[0], svgScaleExtent[1]]"
          :is-debug="isDebug"
          :get-node-icon-url="getNodeIconUrl"
          :get-skill-name="getSkillName"
          :is-node-active="isNodeActive"
          :is-node-available="isNodeAvailable"
          @select-node="selectNode"
          @toggle-activation="toggleNodeActivation"
          @update:transform="transform = $event"
      />
    </StylizedLineBackground>

    <!-- 顶部工具栏 -->
    <MasteryToolbar
        v-model:selected-season-id="selectedSeasonId"
        v-model:search-selected="searchSelected"
        :season-options="seasonOptions"
        :search-items="searchItems"
        :is-left-panel-open="isLeftPanelOpen"
        :view-ref="masteryViewRef"
        @toggle-panel="isLeftPanelOpen = !isLeftPanelOpen"
        @open-share="showShareDialog = true"
        @open-save="showSaveDialog = true"
    />

    <!-- 左侧信息面板 -->
    <MasteryInfoPanel
        v-model="isLeftPanelOpen"
        :is-open="isLeftPanelOpen"
        :mobile="mobile"
        :selected-season-id="selectedSeasonId"
        :season-options="seasonOptions"
        @update:selected-season-id="selectedSeasonId = $event"
        @update:selectedSeasonId="selectedSeasonId = $event"
        v-model:panel-expanded="panelExpanded"
        v-model:effects-filter="effectsFilter"
        :regular-points-spent="regularPointsSpent"
        :max-points="maxPoints"
        :active-seasonal-perks="activeSeasonalPerks"
        :filtered-aggregated-effects="filteredAggregatedEffects"
        :total-effects-count="aggregatedEffects.length"
        :expanded-effect-ids="expandedEffectIds"
        :is-all-effects-expanded="isAllEffectsExpanded"
        :get-skill-name="getSkillName"
        :get-skill-desc="getSkillDesc"
        :get-category-color="getCategoryColor"
        @reset-points="resetPoints"
        @toggle-effect-expand="toggleEffectExpand"
        @toggle-all-effects-expand="toggleAllEffectsExpanded"
    />

    <!-- 节点详情浮窗 -->
    <MasteryNodeCard
        :node="selectedNode"
        :mobile="mobile"
        :regular-points-spent="regularPointsSpent"
        :is-node-active="isNodeActive"
        :is-node-available="isNodeAvailable"
        :get-node-state="getNodeState"
        :get-node-state-color="getNodeStateColor"
        :get-node-state-text="getNodeStateText"
        :get-category-color="getCategoryColor"
        :get-skill-name="getSkillName"
        :get-skill-desc="getSkillDesc"
        :get-node-requirement-items="getNodeRequirementItems"
        @close="selectNode(null)"
        @toggle-activation="toggleNodeActivation"
        @locate-node="onLocateNode"
    />

    <!-- 底部控制栏 -->
    <MasteryFooter
        :zoom="transform?.k ?? 1"
        :scale-extent="scaleExtent"
        :transform-x="transform?.x ?? 0"
        :transform-y="transform?.y ?? 0"
        :is-debug="isDebug"
        @zoom-in="canvasCompRef?.zoomStep(0.2)"
        @zoom-out="canvasCompRef?.zoomStep(-0.2)"
        @set-scale="canvasCompRef?.setScale($event)"
        @reset-view="canvasCompRef?.resetView()"
    />

    <!-- Debug 面板 -->
    <MasteryDebugPanel
        v-if="isDebug"
        :is-debug="isDebug"
        :selected-node="selectedNode"
        @export-json="exportDebugJson"
        @update-coordinate="canvasCompRef?.requestRender()"
        @update-requisite="canvasCompRef?.requestRender()"
    />

    <!-- 分享对话框 -->
    <MasteryShareDialog
        v-model="showShareDialog"
        :season-id="selectedSeasonId"
        :share-url="shareUrl"
        :share-code="shareCode"
        :season-title="activeSeasonTitle"
        :points-spent="regularPointsSpent"
        :max-points="maxPoints"
        :selected-nodes-count="selectedNodeIds.size"
        @copy="copyShareUrl"
        @import-code="loadFromShareCode"
    />

    <!-- 保存方案对话框 -->
    <MasterySaveDialog
        v-model="showSaveDialog"
        :saved-builds="savedBuilds"
        :season-title="activeSeasonTitle"
        :points-spent="regularPointsSpent"
        @save="saveBuild"
        @load="loadBuild"
        @delete="deleteBuild"
    />
  </div>
</template>

<style scoped lang="less">
.mastery-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 64px);
  overflow: hidden;
  user-select: none;
  background-color: transparent;
}

.mastery-bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
