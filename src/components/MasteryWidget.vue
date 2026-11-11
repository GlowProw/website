<script setup lang="ts">
import {computed, nextTick, ref, toRaw, watch} from "vue";
import {useI18n} from "vue-i18n";

import MasteryView from "@/components/mastery/MasteryView.vue";
import {useMasteryController} from "@/assets/sripts/use_mastery_controller";
import MasteryDataProcessing from "@/assets/sripts/mastery_data_processing";
import type {MasterySaveData} from "@/assets/types/Mastery";
import type {MasteryAttr} from "@/assets/types/Assembly";

const props = withDefaults(defineProps<{
      readonly?: boolean,
      draggable?: boolean,
    }>(), {
      readonly: false,
      draggable: true,
    }),
    emit = defineEmits(['update:item-change']),
    {t} = useI18n(),
    masteryDataProcessing = new MasteryDataProcessing();

const {
      selectedSeasonId,
      seasonOptions,
      localNodes,
      selectedNode,
      selectedNodeIds,
      selectedSeasonalPerks,
      regularPointsSpent,
      maxPoints,
      svgScaleExtent,
      getNodeIconUrl,
      getSkillName,
      isNodeActive,
      isNodeAvailable,
      toggleNodeActivation,
      resetPoints,
      selectNode,
    } = useMasteryController();

// 属性
const attr = ref<MasteryAttr>({
  masteryUseVersion: MasteryDataProcessing.nowVersion
});

// 是否空方案
const isEmpty = computed(() => !selectedSeasonId.value || selectedNodeIds.value.size === 0);

// 数据变动时通知工作台（校验/保存联动）
watch([selectedSeasonId, () => Array.from(selectedNodeIds.value), selectedSeasonalPerks], () => {
  emit('update:item-change', 'mastery');
}, {deep: true});

/**
 * 重置加点并通知工作台动态重验
 */
const handleResetPoints = () => {
  resetPoints();
  nextTick(() => {
    emit('update:item-change', 'mastery');
  });
};

/**
 * 设置精通属性
 * @param attrData
 */
const setSetting = (attrData?: MasteryAttr) => {
  if (!attrData) return {onLoad};

  attr.value = {...attr.value, ...attrData};

  return {onLoad}
}

/**
 * 应用方案数据到控制器
 * 与分享码加载逻辑一致：先切赛季（会重置节点），nextTick 后写入节点与特长
 */
const applyPayload = (data: MasterySaveData) => {
  const season = data.season || data.s;
  const nodes = Array.isArray(data.nodes) ? data.nodes : (Array.isArray(data.n) ? data.n : []);
  const perks = Array.isArray(data.perks) ? data.perks : (Array.isArray(data.sp) ? data.sp : []);

  if (season) {
    selectedSeasonId.value = season;
  }

  nextTick(() => {
    selectedNodeIds.value = new Set(nodes);

    const spMap: Record<string, string> = {};
    for (const spId of perks) {
      const spNode = Object.values(localNodes.value)
          .find((nd: any) => nd.key === spId || nd.id === spId) as any;
      if (spNode) {
        const tier = spNode.group || String(spNode.cost);
        spMap[tier] = spNode.key;
      }
    }
    selectedSeasonalPerks.value = spMap;
  });
}

/**
 * 导入
 * @param importDataRaw
 */
const onLoad = (importDataRaw: any) => {
  const importData = toRaw(importDataRaw);

  if (!importData || (typeof importData === 'object' && Object.keys(importData).length <= 0))
    return;

  const normalized = masteryDataProcessing.import(importData, attr.value.masteryUseVersion);
  applyPayload(normalized);
}

/**
 * 导出
 */
const onExport = () => {
  if (!selectedSeasonId.value || selectedNodeIds.value.size === 0) return null;
  const raw: MasterySaveData = {
    season: selectedSeasonId.value,
    nodes: Array.from(selectedNodeIds.value),
    perks: Object.values(selectedSeasonalPerks.value)
  };

  return masteryDataProcessing.export(raw);
}

/**
 * 验证（精通必选为必须项，节点未选阻断提交，技能点未满为建议项）
 */
const verify = () => {
  const result: { required: number; verify: Array<{ required: boolean; message: string; title?: string }> } = {
    required: 0,
    verify: []
  };

  const masteryTitle = t('assembly.additions.mastery');

  if (!selectedSeasonId.value) {
    result.required += 1;
    result.verify.push({
      required: true,
      message: 'masteryEmpty',
      title: masteryTitle
    });
    return result;
  }

  if (selectedNodeIds.value.size === 0) {
    result.required += 1;
    result.verify.push({
      required: true,
      message: 'masteryNodesEmpty',
      title: masteryTitle
    });
  } else if (regularPointsSpent.value < maxPoints.value) {
    result.verify.push({
      required: false,
      message: 'masteryPointsMissing',
      title: masteryTitle
    });
  }

  return result;
}

defineExpose({
  onExport,
  onLoad,
  setSetting,
  verify,
  data: isEmpty.value ? null : selectedNodeIds.value
})

defineOptions({
  name: 'MasteryWidget'
})
</script>

<template>
  <div class="position-relative mastery-widget">
    <!-- 顶部控制条 S -->
    <v-container>
      <v-row align="center" justify="center">
        <v-col cols="auto">
          <v-select
              :model-value="selectedSeasonId || null"
              :items="seasonOptions"
              item-title="title"
              item-value="id"
              :disabled="readonly"
              density="compact"
              variant="outlined"
              hide-details
              :label="t('mastery.shareDialog.currentSeason')"
              class="mastery-season-select"
              @update:model-value="selectedSeasonId = $event || ''">
          </v-select>
        </v-col>
        <v-col>
          <v-divider></v-divider>
        </v-col>
        <v-col cols="auto">
          <span >
            {{ regularPointsSpent }} / {{ maxPoints }}
          </span>
        </v-col>
        <v-col cols="auto" v-if="!readonly">
          <v-btn size="small" variant="tonal" density="compact" @click="handleResetPoints">
            <v-icon start icon="mdi-refresh"></v-icon>
            {{ t('mastery.reset') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
    <!-- 顶部控制条 S -->

    <v-divider></v-divider>

    <!-- 精通 S -->
    <div class="mastery-canvas-box">
      <MasteryView
          :nodes="localNodes"
          :selected-node="selectedNode as any"
          :selected-node-ids="selectedNodeIds"
          :regular-points-spent="regularPointsSpent"
          :scale-extent="[svgScaleExtent[0], svgScaleExtent[1]]"
          :get-node-icon-url="getNodeIconUrl"
          :get-skill-name="getSkillName"
          :is-node-active="isNodeActive"
          :is-node-available="isNodeAvailable"
          :initial-scale=".6"
          :readonly="readonly"
          @select-node="selectNode"
          @toggle-activation="toggleNodeActivation"
      />
    </div>
    <!-- 精通 S -->
  </div>
</template>

<style scoped lang="less">
.mastery-widget {
  width: 100%;
}

.mastery-season-select {
  min-width: 220px;
}

.mastery-canvas-box {
  position: relative;
  width: 100%;
  height: 650px;
  margin: 0 auto;
}
</style>
