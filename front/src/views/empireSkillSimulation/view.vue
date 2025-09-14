<template>
  <div class="skill-tree-container position-relative">
    <svg ref="svgRef"></svg>

    <v-card border class="skill-tree-search-bar">
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

    <v-card v-show="show" border elevation="12" width="450" class="skill-tree-container-cardinfo">
      <v-card-title class="py-3 font-weight-bold d-flex align-center" :title="t(`snb.empireSkills.${selectShowKey}.name`)">
        <FactionIconWidget class="my-2 mr-2" :name="skills[selectShowKey].type" size="25px" v-if="skills[selectShowKey] && skills[selectShowKey].type"></FactionIconWidget>
        {{ t(`snb.empireSkills.${selectShowKey}.name`) }}
      </v-card-title>
      <div class="ml-12 mt-n5 mb-4 opacity-60 text-caption" v-if="skills[selectShowKey] && skills[selectShowKey].id">
        id: {{ skills[selectShowKey].id }}
      </div>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2">{{ t('empireSkillSimulation.effects') }}</div>
      <div class="py-2 px-5 mb-5">{{ t(`snb.empireSkills.${selectShowKey}.effects`) }}</div>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2">{{ t('empireSkillSimulation.requirements') }}</div>
      <div class="py-2 px-5 mb-5">
        <div v-if="skills[selectShowKey] && skills[selectShowKey].requisite">
          <v-row no-gutters v-for="(i, index) in skills[selectShowKey].requisite" :key="index">
            <v-col cols="auto" class="d-flex justify-center align-center mr-2">
              <rhombus-widget :solid="false"></rhombus-widget>
            </v-col>
            <v-col>
              {{ skills[i].id }}
            </v-col>
          </v-row>
        </div>
      </div>

      <div class="card-enlargement-flavor px-10 mx-n6 py-2">{{ t('empireSkillSimulation.requiredCost') }}</div>
      <div class="py-2 mb-5">
        <div v-if="skills[selectShowKey] && skills[selectShowKey].requiredCost">
          <v-list density="compact" nav>
            <v-list-item v-for="(i, key) in skills[selectShowKey].requiredCost" :key="key">
              <v-row no-gutters align="start">
                <v-col class="d-flex justify-start align-center">
                  <ItemSlotBase size="60">
                    <MaterialIconWidget :id="key" item-type="items"></MaterialIconWidget>
                  </ItemSlotBase>
                  <span class="ml-2">{{ t(`snb.materials.${key}.name`) }}</span>
                </v-col>
                <v-col cols="auto">
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
    </v-card>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import * as d3 from 'd3';
import {useI18n} from "vue-i18n";
import {EmpireSkills} from "glow-prow-data/src/entity/EmpireSkills";
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

// --- 类型定义 ---
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
    {t} = useI18n();

let svgRef = ref<SVGSVGElement | null>(null),
    transform = ref({k: 1}),
    show = ref(true),
    selectShowKey = ref<string | null>('advancedGinProcessing');

const searchQuery = ref('');
const searchItems = ref([]);
const foundNodes = ref([]);

let root: d3.HierarchyNode<HierarchyNodeData>;
let svg: d3.Selection<SVGElement | null, unknown, null, undefined>;
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
const width = 1800;
const height = 2200;
const marginTop = 50;
const marginLeft = 150;
const nodeWidth = 60;
const nodeHeight = 60;

// --- 事件处理函数 ---
const handleNodeClick = (event: MouseEvent, d: d3.HierarchyNode<HierarchyNodeData>) => {
  event.stopPropagation();
  selectShowKey.value = d.data.data.key;
  show.value = true;
  locateNode(d); // 增加点击居中功能
};

const handleNodeHover = (event: MouseEvent, d: d3.HierarchyNode<HierarchyNodeData>) => {
  // console.log(`Hovered over node: ${d.data.data.key}`);
};

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

const locateNode = (node: d3.HierarchyNode<HierarchyNodeData>) => {
  // 获取当前 transform 的缩放和平移信息
  const currentTransform = d3.zoomTransform(svg.node());

  // 计算目标缩放比例，这里选择 1.2
  const targetScale = 1.2;
  const containerRect = svgRef.value.getBoundingClientRect();
  const svgWidth = containerRect.width;
  const svgHeight = containerRect.height;

  // 计算新的平移量，使节点居中
  // 这里需要考虑 D3 树布局的坐标系（x,y）以及初始平移量
  const targetX = -node.y * targetScale + (width / 2) - marginLeft - nodeWidth;
  const targetY = -node.x * targetScale + (height / 2) - marginTop - nodeHeight - 650;

  // 使用 D3 的过渡效果平滑地平移和缩放
  svg.transition()
      .duration(750)
      .call(zoom.transform as any, d3.zoomIdentity.translate(targetX, targetY).scale(targetScale));

  // 移除所有节点的高亮
  d3.select(svgRef.value).selectAll('.node-group .node-rect').classed('highlighted', false);

  // 高亮显示找到的节点
  d3.select(svgRef.value).select(`.node-${node.id} .node-rect`).classed('highlighted', true);

  // 更新信息卡片
  selectShowKey.value = node.data.data.key;
  show.value = true;
};

// --- LIFECYCLE HOOK ---
onMounted(() => {
  if (!svgRef.value || !props.skills) return;

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
  const marginRight = 50;
  const marginBottom = 50;

  root = d3.stratify<HierarchyNodeData>()
      .id(d => d.id)
      .parentId(d => d.parentId)(flatData);

  const treeLayout = d3.tree<HierarchyNodeData>()
      .size([height - marginTop - marginBottom, width - marginLeft - marginRight])
      .nodeSize([100, 220]);

  treeLayout(root);

  // --- 3. D3 渲染 ---
  svg = d3.select(svgRef.value)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

  svg.on('click', () => {
    show.value = false;
    selectShowKey.value = null;
    d3.select(svgRef.value).selectAll('.node-group .node-rect').classed('highlighted', false);
  });

  const container = svg.append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`);

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
      .on('touchstart', handleNodeClick)
      .on('mouseover', handleNodeHover);

  node.append("text")
      .text(d => d.data.data.id)
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("y", 48)
      .on('click', handleNodeClick)
      .on('touchstart', handleNodeClick)
      .on('mouseover', handleNodeHover);

  const categoryGroups = d3.groups(root.descendants().filter(d => d.data.data.type), d => d.data.data.type);

  const categoryLabels = container.append("g")
      .attr("class", "category-labels")
      .selectAll("g")
      .data(categoryGroups)
      .join("g")
      .attr("class", "category-label-group");

  categoryLabels.append("text")
      .text(d => d[0] != 'root' ? t(`snb.factions.${d[0]}.name`) : d[0])
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

  zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.6, 1.8])
      .on("zoom", ({transform}) => {
        transform.value = transform
        container.attr("transform", transform);
      });

  svg.call(zoom as any);
});
</script>

<style lang="less">
.skill-tree-container-cardinfo {
  position: absolute;
  z-index: 100;
  right: 20px;
  top: 30px
}

.skill-tree-container {
  width: 100%;
  height: calc(70vh + 100px);
  overflow: hidden;
}

.skill-tree-search-bar {
  position: absolute;
  top: 30px;
  left: 30px;
  width: 450px;
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
  stroke: #af8313;
  stroke-width: 1px;
  transition: stroke 0.3s ease, stroke-width 0.3s ease;
}

.node-rect.theHelm,
.node-rect.compagnieRoyale,
.node-rect.clanOfFara {
  fill: #433000;
}

.node-rect.default {
  fill: #4b5263;
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
