<template>
  <div class="skill-tree-container">
    <svg ref="svgRef"></svg>

    <v-card border class="skill-tree-search-bar"
            :style="{
              'top': mobile ? '70px' : '70px'
            }"
            :width="mobile ? 'calc(100% - 50px)' : 450">
      <v-combobox
          v-model="searchQuery"
          :items="searchItems"
          hide-details
          variant="solo"
          clearable
          density="comfortable"
          :menu-props="{ maxHeight: '450px' }"
          prepend-inner-icon="mdi-magnify"
          @update:modelValue="handleSearchInput"
          @keydown.enter="searchAndLocate"
      ></v-combobox>
    </v-card>

    <v-card v-show="show" border
            elevation="12"
            :width="mobile ? 'calc(100% - 50px)' : 450"
            :style="{
              'top': mobile ? '130px' : '70px'
            }"
            class="skill-tree-container-cardInfo overflow-y-auto">
      <v-card-title class="my-2 mr-2">
        <div class="mb-1 d-flex align-center text-caption"
             v-if="skills[selectShowKey] && skills[selectShowKey].type"
             :title="t(`snb.empireSkills.${selectShowKey}.name`)">
          <ItemSlotBase size="20px" :padding="0" class="d-inline-flex">
            <FactionIconWidget :name="skills[selectShowKey].type" size="20px"></FactionIconWidget>
          </ItemSlotBase>
          <span class="ml-2">{{ t(`snb.factions.${skills[selectShowKey].type}.name`) }}</span>
        </div>
        <span class="text-amber">{{ t(`snb.empireSkills.${skills[selectShowKey] && skills[selectShowKey].id}.name`) }}</span>
        <template v-if="skillPointsInput[selectShowKey] > 1">
          <span class="font-weight-bold">
              {{ number.intToRoman(skillPointsInput[selectShowKey] || 0) }}
          </span>
        </template>
      </v-card-title>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('empireSkillSimulation.effects') }}</div>
      <div class="py-2 px-5 mb-5">
        <template v-if="skills[selectShowKey] && skills[selectShowKey].stage && skills[selectShowKey].stage > 1">
          <template v-if="!skillPointsInput[selectShowKey]">
            <!-- 未选择模拟，预览所有 -->
            <p class="opacity-60" v-for="(to, toIndex) in tm(`snb.empireSkills.${skills[selectShowKey] && skills[selectShowKey].id}.effects`)" :key="toIndex">
              {{ number.intToRoman(tIndex || 1) }}: {{ to || t('empireSkillSimulation.effectsNotContent') }}
            </p>
          </template>
          <template v-else>
            <!-- 选择模拟，预览对应 -->
            {{ t(`snb.empireSkills.${skills[selectShowKey] && skills[selectShowKey].id}.effects.${skillPointsInput[selectShowKey] || '1'}`) }}
          </template>
        </template>
        <template v-else-if="skills[selectShowKey] && skills[selectShowKey].stage && skills[selectShowKey].stage == 1">
          {{ t(`snb.empireSkills.${skills[selectShowKey] && skills[selectShowKey].id}.effects.general`) || t('empireSkillSimulation.effectsNotContent') }}
        </template>
      </div>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('empireSkillSimulation.requirements') }}</div>
      <div class="py-2 px-5 mb-5">
        <div v-if="skills[selectShowKey] && skills[selectShowKey].requisite">
          <v-row no-gutters v-for="(i, index) in skills[selectShowKey].requisite" :key="index">
            <v-col cols="auto" class="d-flex justify-center align-center mr-2">
              <rhombus-widget :solid="!!skillPointsInput[skills[i].id]" :activate="skillPointsInput[skills[i].id]"></rhombus-widget>
            </v-col>
            <v-col>
              <u class="cursor-pointer" @click="onMoveNode(skills[i].key)">
                {{ t(`snb.empireSkills.${skills[i].id}.name`) }}
              </u>
            </v-col>
          </v-row>
        </div>
      </div>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('empireSkillSimulation.requiredCost') }}</div>
      <div class="py-2">
        <div v-if="skills[selectShowKey] && skills[selectShowKey].requiredCost">
          <v-list density="compact" nav class="pt-0">
            <v-list-item v-for="(i, key) in skills[selectShowKey].requiredCost" :key="key" class="pt-0">
              <v-row no-gutters align="start">
                <v-col class="d-flex justify-start align-center">
                  <ItemSlotBase size="60">
                    <MaterialIconWidget :id="key" item-type="items"></MaterialIconWidget>
                  </ItemSlotBase>
                  <span class="ml-2">{{ t(`snb.materials.${key}.name`) }}</span>
                </v-col>
                <v-col class="d-flex justify-end">
                  <v-breadcrumbs
                      :items="i"
                      class="pa-0 ma-0">
                    <template v-slot:divider>
                      <v-divider style="min-width: 30px;"></v-divider>
                    </template>
                    <template v-slot:item="{item: v, index: vIndex}">
                      <div class="text-center">
                        <b class="text-amber">{{ v ? v : '?' }}</b>
                        <div class="text-caption opacity-60" style="line-height: .6">{{ t('empireSkillSimulation.stage', {num: vIndex + 1}) }}</div>
                      </div>
                    </template>
                  </v-breadcrumbs>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </div>
      </div>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('empireSkillSimulation.other') }}</div>
      <div class="mx-5 mb-10 opacity-60"
           v-if="skills[selectShowKey] && skills[selectShowKey].id">
        <v-text-field :value="skills[selectShowKey].id" hide-details readonly variant="underlined" density="compact">
          <template v-slot:append-inner>
            <v-icon>mdi-identifier</v-icon>
          </template>
        </v-text-field>
        <v-text-field :value="skills[selectShowKey].key" hide-details readonly variant="underlined" density="compact">
          <template v-slot:append-inner>
            <v-icon size="18" class="mr-1">mdi-key-outline</v-icon>
          </template>
        </v-text-field>
        <v-text-field hide-details
                      variant="underlined"
                      density="compact"
                      readonly
                      :value="t(`snb.seasons.${skills[selectShowKey].bySeason?.id || 'release'}`) || 'none'">
        </v-text-field>


        <v-row no-gutters class="mt-2" align="center">
          <v-col cols="auto" class="mr-2">
            <v-icon icon="mdi-calendar-range" size="19"></v-icon>
            {{ t('empireSkillSimulation.dateAdded') }}
          </v-col>
          <v-col>
            <TimeView :time="skills[selectShowKey].dateAdded" v-if="skills[selectShowKey].dateAdded">
              <Time :time="skills[selectShowKey].dateAdded"></Time>
            </TimeView>
          </v-col>
        </v-row>
        <v-row no-gutters class="mt-2" align="center">
          <v-col cols="auto" class="mr-2">
            <v-icon icon="mdi-calendar-range" size="19"></v-icon>
            {{ t('empireSkillSimulation.lastUpdated') }}
          </v-col>
          <v-col>
            <TimeView :time="skills[selectShowKey].lastUpdated" v-if="skills[selectShowKey].lastUpdated">
              <Time :time="skills[selectShowKey].lastUpdated"></Time>
            </TimeView>
          </v-col>
        </v-row>
      </div>

      <v-divider></v-divider>
      <div class="">
        <v-row align="center" no-gutters>
          <v-col class="text-center">
            <template v-if="skillPointsInput[selectShowKey]">
              {{ t('empireSkillSimulation.stage', {num: skillPointsInput[selectShowKey] || '0'}) }}
            </template>
            <template v-else>
              未激活
            </template>
          </v-col>
          <v-divider vertical></v-divider>
          <v-col cols="auto">
            <v-btn size="50" elevation="0" :disabled="!getIsSkillPointPossible(selectShowKey)" @click="onSetSkillPoint(selectShowKey, 'add')" tile block>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-col>
          <v-divider vertical inset></v-divider>
          <v-col cols="auto">
            <v-btn size="50" elevation="0" :disabled="!getIsSkillPointPossible(selectShowKey)" @click="onSetSkillPoint(selectShowKey, 'rem')" tile block>
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';

import {onMounted, onUnmounted, ref, watch} from 'vue';
import {useI18n} from "vue-i18n";
import {EmpireSkills} from "glow-prow-data/src/entity/EmpireSkills";
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import {useDisplay} from "vuetify/framework";
import {number} from "@/assets/sripts/index";
import {useRoute, useRouter} from "vue-router";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";

interface SkillData {
  id: string;
  requisite: string[];
  stage?: number;
  type?: string;
  key?: string;
}

interface HierarchyNodeData {
  id: string;
  parentId: string | null;
  data: SkillData;
}

const props = defineProps<{
      skills: Record<string, SkillData>;
    }>(),
    skills = EmpireSkills,
    router = useRouter(),
    route = useRoute(),
    {t, tm, te, locale} = useI18n(),
    {mobile} = useDisplay();

let svgRef = ref<SVGSVGElement | null>(null),
    transform = ref({k: 1}),
    show = ref(false),
    selectShowKey = ref<string | null>('manufactoryExpansion-compagnieRoyale-2');

let searchQuery = ref(''),
    searchItems = ref([]),
    foundNodes = ref([]);

// 模拟点数输入，使用 ref 包裹以保持响应性
const skillPointsInput = ref({});

watch(locale, () => {
  drawTree()
})

// 监听 skillPointsInput 的变化，并调用更新函数
watch(skillPointsInput.value, () => {
  updateSkillPointsText();
}, {deep: true});


let root: d3.HierarchyNode<HierarchyNodeData>;
let svg: d3.Selection<SVGElement | null, unknown, null, undefined>;
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

// D3 布局的节点间距
const nodeWidth = 50;
const nodeHeight = 50;

/**
 * 模拟点是否可用
 * @param key 技能的键名
 * @returns boolean 指示是否可以增加或减少模拟点
 */
const getIsSkillPointPossible = (key) => {
  const skill = skills[key];
  if (!skill) return false;

  const requisite = skill.requisite || [];

  // 如果前置条件包含 'root'，则认为该技能是根节点，直接返回 true
  // 这意味着根节点始终可以被激活
  if (requisite.includes('root')) {
    return true;
  }

  let checkResultCount = 0;
  requisite.forEach(i => {
    // 检查前置条件技能是否已激活
    if (skillPointsInput.value[i]) {
      checkResultCount += 1;
    }
  });

  // 如果所有前置条件都已激活，则返回 true
  return checkResultCount === requisite.length;
};

/**
 * 设置模拟点数
 * @param key
 * @param type
 */
const onSetSkillPoint = (key, type = 'add') => {
  const {stage} = skills[key];
  const currentValue = skillPointsInput.value[key] || 0;

  switch (type) {
    case 'add':
      if (currentValue < stage) skillPointsInput.value[key] = currentValue + 1;
      break;
    case 'rem':
      if (currentValue > 0) skillPointsInput.value[key] = currentValue - 1;
      break;
  }
}

/**
 * 聚焦节点
 * @param key
 */
const onMoveNode = (key) => {
  if (key == 'root')
    return;

  root.descendants().forEach(node => {
    if (node.id == key) {
      locateNode(node)
    }
  })
}

/**
 * 处理节点点击
 * @param event
 * @param d
 */
const handleNodeClick = (event: MouseEvent, d: d3.HierarchyNode<HierarchyNodeData>) => {
  event.stopPropagation();

  const {key} = d.data.data;

  if (!key && !d)
    return show.value = false;

  selectShowKey.value = key;
  show.value = true;

  router.push({
    name: route.name,
    query: {...route.query, key}
  })

  locateNode(d);
};

/**
 * 搜索节点
 */
const searchAndLocate = () => {
  if (!searchQuery.value) return;

  const query = searchQuery.value.toLowerCase();
  foundNodes.value = [];

  root.descendants().forEach(node => {
    const skillData = node.data.data;
    const skillName = t(`snb.empireSkills.${node.id}.name`).toLowerCase();
    const categoryName = skillData.type ? t(`snb.factions.${skillData.type}.name`).toLowerCase() : '';

    if (
        node.id.toLowerCase().includes(query) ||
        skillName.includes(query) ||
        (skillData.type && categoryName.includes(query))
    ) {
      foundNodes.value.push({
        title: skillName,
        value: node.id,
        node: node
      });
    }
  });

  if (foundNodes.value.length === 1) {
    locateNode(foundNodes.value[0].node);
  }
};

/**
 * 处理搜索内容输入
 * @param value
 */
const handleSearchInput = (value) => {
  if (typeof value === 'object' && value && value.node) {
    // 用户从下拉列表中选择了一个项
    locateNode(value.node);
  } else {
    // 用户在输入框中输入
    searchAndLocate();
    searchItems.value = foundNodes.value.map(item => ({
      title: item.title,
      value: item.value,
      node: item.node,
    }));
  }
};

/**
 * 定位并居中一个节点到屏幕中间
 * @param node 要居中的 D3 节点数据
 */
const locateNode = (node: d3.HierarchyNode<HierarchyNodeData>) => {
  if (!svgRef.value) return;

  const containerRect = svgRef.value.getBoundingClientRect();
  const svgWidth = containerRect.width;
  const svgHeight = containerRect.height;

  // 目标缩放比例
  const targetScale = 1.8;

  // 使用D3的平移和缩放来居中节点
  // 注意：D3的树状图布局是 y 对应水平，x 对应垂直
  const newX = -node.y * targetScale + svgWidth / 2;
  const newY = -node.x * targetScale + svgHeight / 2;

  svg.transition()
      .duration(750)
      .call(zoom.transform as any, d3.zoomIdentity.translate(newX, newY).scale(targetScale));

  // 移除所有节点的高亮
  d3.select(svgRef.value).selectAll('.node-group .node-rect').classed('highlighted', false);

  // 高亮显示找到的节点
  d3.select(svgRef.value).select(`.node-${node.id} .node-rect`).classed('highlighted', true);

  // 更新信息卡片
  selectShowKey.value = node.data.data.key;
  show.value = true;
};

/**
 * 窗口大小变化时，重新绘制整个图表以适应新尺寸
 */
const handleResize = () => {
  drawTree();
};

/**
 * 更新技能视图信息
 * 根据 skillPointsInput 的值更新节点上的文本
 */
const updateSkillPointsText = () => {
  if (!svgRef.value) return;

  d3.select(svgRef.value).selectAll('.node-group').each(function (d: any) {
    const nodeElement = d3.select(this);
    const skillKey = d.data.data.key;
    const currentPoints = skillPointsInput.value[skillKey] || 0;
    const maxStage = d.data.data.stage || 1;

    // 找到文本元素并更新其内容
    nodeElement.select('.node-label')
        .text(`${t(`snb.empireSkills.${d.data.data.id}.name`)} (${currentPoints}/${maxStage})`);

    // 同时更新节点的激活状态，使其颜色也动态变化
    nodeElement.select('.node-rect')
        .classed('activated', currentPoints > 0);
  });
};

/**
 * 绘制树节点
 */
const drawTree = () => {
  if (!svgRef.value || !props.skills) return;

  // 动态获取容器的实际宽高
  const containerRect = svgRef.value.getBoundingClientRect();
  const dynamicWidth = containerRect.width;
  const dynamicHeight = containerRect.height;

  // 清空 SVG 内容，避免重复绘制
  d3.select(svgRef.value).selectAll('*').remove();

  // --- 1. 数据处理 ---
  const flatData: HierarchyNodeData[] = [];
  const extraLinks: { source: string; target: string }[] = [];
  const validSkillKeys = new Set(Object.keys(props.skills));
  const categoryMap = new Map();

  flatData.push({id: 'root', parentId: null, data: {id: 'root', requisite: [], type: 'root', key: 'root'}});

  for (const [key, skill] of Object.entries(props.skills)) {
    if (key === 'root') continue;

    let primaryParent: string | null = null;
    if (skill.requisite && skill.requisite.length > 0) {
      for (const reqKey of skill.requisite) {
        if (validSkillKeys.has(reqKey)) {
          if (!primaryParent) {
            primaryParent = reqKey;
          } else {
            extraLinks.push({source: reqKey, target: key});
          }
        } else {
          console.warn(`数据警告：技能 "${key}" 的前置条件 "${reqKey}" 不存在于技能列表中。`);
        }
      }
    }

    flatData.push({
      id: key,
      skillPointValue: 0,
      parentId: primaryParent || 'root',
      data: {...skill, key: key}
    });

    if (skill.type) {
      if (!categoryMap.has(skill.type)) {
        categoryMap.set(skill.type, []);
      }
      categoryMap.get(skill.type).push(key);
    }
  }

  // --- 2. D3 布局设置 ---
  // D3 树布局现在使用动态尺寸
  root = d3.stratify<HierarchyNodeData>()
      .id(d => d.id)
      .parentId(d => d.parentId)(flatData);

  const treeLayout = d3.tree<HierarchyNodeData>()
      .size([dynamicHeight, dynamicWidth])
      .nodeSize([90, 300]);

  treeLayout(root);

  // --- 3. D3 渲染 ---
  svg = d3.select(svgRef.value)
      .attr("width", "100%")
      .attr("height", "100%");

  svg.on('click', () => {
    show.value = false;
    selectShowKey.value = null;
    d3.select(svgRef.value).selectAll('.node-group .node-rect').classed('highlighted', false);
  });

  const container = svg.append("g")
      .attr("transform", `translate(0,0)`); // 初始偏移量不再需要，居中计算会处理

  container.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 5)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', 'arrow-head');

  container.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("marker-mid", "url(#arrow)")
      .attr("d", d => {
        const start = {x: d.source.y, y: d.source.x};
        const end = {x: d.target.y, y: d.target.x};
        const mid = {x: (start.x + end.x) / 2, y: (start.y + end.y) / 2};
        return `M${start.x},${start.y} L${mid.x},${mid.y} L${end.x},${end.y}`;
      });

  const categoryGroups = d3.groups(root.descendants().filter(d => d.data.data.type), d => d.data.data.type);

  const categoryLabels = container.append("g")
      .attr("class", "category-labels")
      .selectAll("g")
      .data(categoryGroups)
      .join("g")
      .attr("class", "category-label-group");

  categoryLabels.append("text")
      .text(d => d[0] != 'root' ? categoryName(d[0]) : t(`snb.empireSkills.${d[0]}.name`))
      .attr("class", "category-text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("transform", d => {
        const nodes = d[1];
        const minX = d3.min(nodes, n => n.y);
        const maxX = d3.max(nodes, n => n.y);
        const minY = d3.min(nodes, n => n.x);
        const maxY = d3.max(nodes, n => n.x);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        return `translate(${centerX}, ${centerY})`;
      });

  const nodesById = new Map(root.descendants().map(d => [d.id, d]));
  container.append("g")
      .attr("class", "extra-links")
      .selectAll("path")
      .data(extraLinks)
      .join("path")
      .attr("class", "link extra")
      .attr("marker-mid", "url(#arrow)")
      .attr("d", d => {
        const sourceNode = nodesById.get(d.source);
        const targetNode = nodesById.get(d.target);
        if (!sourceNode || !targetNode) return "";
        const start = {x: sourceNode.y, y: sourceNode.x};
        const end = {x: targetNode.y, y: targetNode.x};
        const mid = {x: (start.x + end.x) / 2, y: (start.y + end.y) / 2};
        return `M${start.x},${start.y} L${mid.x},${mid.y} L${end.x},${end.y}`;
      });

  const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(root.descendants().filter(d => d.id !== 'root'))
      .join("g")
      .attr("class", d => `node-group node-${d.id}`)
      .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("x", -nodeWidth / 2)
      .attr("y", -nodeHeight / 2)
      .attr("rx", 5)
      .attr("class", d => `node-rect ${d.data.data.type || 'default'}`)
      .on('click', handleNodeClick)
      .on('touchstart', handleNodeClick);

  node.append("text")
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("y", 48)
      .on('click', handleNodeClick)
      .on('touchstart', handleNodeClick);

  zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [dynamicWidth, dynamicHeight]])
      .scaleExtent([0.3, 4])
      .on("zoom", ({transform}) => {
        transform.value = transform
        container.attr("transform", transform);
      });

  svg.call(zoom as any);

  // 在这里调用，确保初始文本正确显示
  updateSkillPointsText();
};

/**
 * 大类名称转换
 * @param key
 */
const categoryName = (key) => {
  const keyPath = `snb.factions.${key}.name`;
  return te(keyPath) ? t(keyPath) : key
}

onMounted(() => {
  const {key} = route.query;

  drawTree();

  if (key && skills[key])
    onMoveNode(key)

  // 添加窗口大小变化监听器
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // 移除窗口大小变化监听器，避免内存泄漏
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="less">
.skill-tree-container-cardInfo {
  position: absolute;
  z-index: 100;
  right: 20px;
  top: 30px
}

.skill-tree-container {
  width: 100%;
  height: calc(80vh + 150px);
  overflow: hidden;
}

.skill-tree-search-bar {
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 100;
}

.link {
  stroke: rgba(255, 255, 255, 0.64);
  stroke-width: 1.5px;
  fill: none;
}

.link.extra {
  stroke: rgba(255, 255, 255, 0.64);
}

.arrow-head {
  fill: #fff;
}

.link.extra + .arrow-head {
  fill: #fff;
}

.node-group {
  cursor: pointer;
}

.node-rect {
  fill: #433000;
  stroke: #af8313;
  stroke-width: 1px;
  transition: stroke 0.3s ease, stroke-width 0.3s ease;
}

/* 高亮样式 */
.node-rect.highlighted {
  stroke: #ffeb3b;
  stroke-width: 3px;
  filter: drop-shadow(0 0 5px #ffeb3b);
  animation: pulse-highlight 1.5s infinite alternate;
}

@keyframes pulse-highlight {
  from {
    stroke-width: 3px;
    stroke: #b4a628;

  }
  to {
    stroke-width: 3px;
    stroke: #fff7af;
  }
}

.node-label {
  fill: #abb2bf;
  font-family: sans-serif;
  font-size: 13px;
  font-weight: bold;
  pointer-events: none;
}

.category-text {
  fill: #abb2bf;
  font-family: sans-serif;
  font-size: 100px;
  font-weight: bold;
  pointer-events: none;
  opacity: 0.25;
  text-transform: uppercase;
}
</style>
