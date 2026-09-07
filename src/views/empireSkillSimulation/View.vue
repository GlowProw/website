<template>
  <div class="skill-tree-container" id="empire-skill-simulation" ref="empireSkillSimulationViewRef">
    <!-- 核心画布组件 (包含透明背景、风格化线条与 Canvas 逐帧渲染) -->
    <EmpireCanvas
        ref="canvasCompRef"
        :skills="skills"
        :selected-key="selectShowKey"
        :skill-points-input="skillPointsInput"
        :scale-extent="[svgScaleExtent[0], svgScaleExtent[1]]"
        :is-debug="isDebug"
        @select-node="onCanvasSelectNode"
        @update:transform="svgTransform = $event"
    />

    <!-- 顶部搜索栏组件 (包含搜索输入与全屏切换) -->
    <EmpireSearchBar
        v-model="searchQuery"
        :items="searchItems"
        :mobile="mobile"
        :view-ref="empireSkillSimulationViewRef"
        @search-input="handleSearchInput"
        @search-enter="searchAndLocate"
    />

    <!-- 技能详情信息卡片组件 -->
    <EmpireNodeCard
        v-model="model"
        :selected-key="selectShowKey"
        :skills="skills"
        :skill-points-input="skillPointsInput"
        :mobile="mobile"
        :is-debug="isDebug"
        :get-is-skill-point-possible="getIsSkillPointPossible"
        :get-node-coords="canvasCompRef?.getNodeCoords"
        @move-node="onMoveNode"
        @set-skill-point="onSetSkillPoint"
        @debug-requisite-changed="canvasCompRef?.drawTree()"
        @export-debug-config="onExportDebugConfig"
    />

    <!-- 底部状态工具栏组件 -->
    <EmpireFooter
        :zoom="svgTransform.k"
        :scale-extent="scaleExtent"
        :transform-x="svgTransform.x"
        :transform-y="svgTransform.y"
        :is-debug="isDebug"
        @set-scale="canvasCompRef?.setSvgScale($event)"
    />
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useEmpireController} from '@/assets/sripts/use_empire_controller';
import EmpireCanvas from '@/components/empireSkillSimulation/EmpireCanvas.vue';
import EmpireSearchBar from '@/components/empireSkillSimulation/EmpireSearchBar.vue';
import EmpireNodeCard from '@/components/empireSkillSimulation/EmpireNodeCard.vue';
import EmpireFooter from '@/components/empireSkillSimulation/EmpireFooter.vue';

const props = defineProps<{
  skills: Record<string, any>;
}>();

const empireSkillSimulationViewRef = ref<HTMLDivElement | null>(null);
const canvasCompRef = ref<InstanceType<typeof EmpireCanvas> | null>(null);
const showFactionControl = ref(false);

const {
  route,
  router,
  t,
  mobile,
  isDebug,
  svgScaleExtent,
  scaleExtent,
  svgTransform,
  model,
  selectShowKey,
  searchQuery,
  searchItems,
  foundNodes,
  skillPointsInput,
  getIsSkillPointPossible,
  onSetSkillPoint,
} = useEmpireController({skills: props.skills});

function onCanvasSelectNode(key: string | null) {
  selectShowKey.value = key;
  model.value = !!key;
  if (key) {
    router.push({
      name: route.name as string,
      query: {...route.query, key}
    });
  }
}

function onMoveNode(key: string) {
  if (!key || key === 'root') return;
  selectShowKey.value = key;
  model.value = true;
  canvasCompRef.value?.locateNodeByKey(key);
}

function searchAndLocate() {
  if (!searchQuery.value) return;
  const query = searchQuery.value.toLowerCase();
  const descendants = canvasCompRef.value?.getAllDescendants() || [];
  foundNodes.value = [];

  for (const node of descendants) {
    const skillData = node.data.data;
    const skillName = t(`snb.empireSkills.${skillData.id}.name`);
    const categoryName = skillData.type ? t(`snb.factions.${skillData.type}.name`).toLowerCase() : '';

    if (
        (node.id || '').toLowerCase().includes(query) ||
        skillName.includes(query) ||
        (skillData.type && categoryName.includes(query))
    ) {
      foundNodes.value.push({
        title: skillName,
        value: node.id || '',
        node: node
      });
    }
  }

  if (foundNodes.value.length === 1) {
    const target = foundNodes.value[0];
    onMoveNode(target.value);
  }
}

function handleSearchInput(value: any) {
  if (typeof value === 'object' && value && value.node) {
    onMoveNode(value.value);
  } else {
    searchAndLocate();
    searchItems.value = foundNodes.value.map(item => ({
      title: item.title,
      value: item.value,
      node: item.node,
    }));
  }
}

function onSelectFaction(faction: string) {
  const descendants = canvasCompRef.value?.getAllDescendants() || [];
  const factionNode = descendants.find(d => d.data.data.type === faction);
  if (factionNode) {
    onMoveNode(factionNode.id);
  }
}

function onExportDebugConfig() {
  const exported = canvasCompRef.value?.exportDebugConfig();
  if (exported) {
    navigator.clipboard.writeText(JSON.stringify(exported, null, 2)).then(() => {
      alert('已将所有帝国技能节点坐标与前置关系复制到剪贴板！');
    }).catch(() => {
      alert('复制失败，已输出至 Console 控制台。');
    });
  }
}

onMounted(() => {
  const {key} = route.query;
  if (key && typeof key === 'string' && props.skills[key]) {
    setTimeout(() => {
      onMoveNode(key);
    }, 250);
  }
});
</script>

<style scoped lang="less">
.skill-tree-container {
  width: 100%;
  height: calc(80vh + 128px);
  overflow: hidden;
  position: relative;
  background-color: transparent;
  user-select: none;
}
</style>
