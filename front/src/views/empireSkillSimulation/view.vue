<template>
  <div class="skill-tree-container">
    <svg ref="svgRef"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';

// --- 类型定义 (与之前相同) ---
interface SkillData {
  id: string;
  requisite: string[];
  stage: number;
  type: string;
}

interface HierarchyNodeData {
  id: string;
  parentId: string | null; // 用于 d3.stratify 的父节点ID
  data: SkillData;
}

// --- PROPS (与之前相同) ---
const props = defineProps<{
  skills: Record<string, SkillData>;
}>();

// --- REFS (与之前相同) ---
const svgRef = ref<SVGSVGElement | null>(null);

// --- LIFECYCLE HOOK ---
onMounted(() => {
  if (!svgRef.value) return;

  // --- 1. 数据处理 ---
  // 将您的数据转换为 d3.tree 需要的层级结构。
  // 对于有多个前置条件的节点，我们选择第一个作为其“主要父节点”用于布局，
  // 其他的作为“额外连线”稍后绘制。
  const flatData: HierarchyNodeData[] = [];
  const extraLinks: { source: string; target: string }[] = [];

  flatData.push({ key: 'root', parentId: null, data: {} as SkillData });

  for (const skill of Object.values(props.skills)) {
    if (skill.requisite && skill.requisite.length > 0) {
      // 使用第一个前置作为布局的父节点
      console.log(skill.requisite[0])
      flatData.push({ key: skill.key, parentId: skill.requisite[0], data: skill });
      // 其他的前置作为额外连线
      for (let i = 1; i < skill.requisite.length; i++) {
        extraLinks.push({ source: skill.requisite[i], target: skill.key });
      }
    }
  }

  // --- 2. D3 布局设置 ---
  const width = 1800;
  const height = 2200; // 增加高度以容纳更深的树
  const marginTop = 50;
  const marginRight = 50;
  const marginBottom = 50;
  const marginLeft = 150;

  // 使用 d3.stratify 将扁平数据（带parentId）转换为层级数据
  const root = d3.stratify<HierarchyNodeData>()
      .id(d => d.key)
      .parentId(d => d.parentId)(flatData);

  // 创建一个树状布局生成器
  const treeLayout = d3.tree<HierarchyNodeData>()
      .size([
        height - marginTop - marginBottom,
        width - marginLeft - marginRight
      ])
      .nodeSize([100, 220]); // nodeSize([垂直间距, 水平间距])

  // 应用布局算法，计算每个节点的位置 (x, y)
  treeLayout(root);

  // --- 3. D3 渲染 ---
  const svg = d3.select(svgRef.value)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

  const container = svg.append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`);

  // 定义箭头样式 (与之前相同)
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

  // --- 绘制连线 ---

  // a) 绘制主要的树结构连线
  container.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("marker-mid", "url(#arrow)")
      .attr("d", d => {
        // d3.tree 默认 y 是水平，x 是垂直，我们需要交换它们来得到一个从上到下的树
        const start = { x: d.source.y, y: d.source.x };
        const end = { x: d.target.y, y: d.target.x };
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        return `M${start.x},${start.y} L${mid.x},${mid.y} L${end.x},${end.y}`;
      });

  // b) 绘制额外的连线 (用于处理多前置节点)
  const nodesById = new Map(root.descendants().map(d => [d.key, d]));
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

        // 同样，交换 x 和 y
        const start = { x: sourceNode.y, y: sourceNode.x };
        const end = { x: targetNode.y, y: targetNode.x };
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        return `M${start.x},${start.y} L${mid.x},${mid.y} L${end.x},${end.y}`;
      });


  // --- 绘制节点 ---
  const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(root.descendants().filter(d => d.key !== 'root')) // 过滤掉虚拟根节点
      .join("g")
      .attr("class", "node-group")
      // 交换 x 和 y 坐标，并应用布局
      .attr("transform", d => `translate(${d.y},${d.x})`);

  const nodeWidth = 180;
  const nodeHeight = 50;

  node.append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("x", -nodeWidth / 2)
      .attr("y", -nodeHeight / 2)
      .attr("rx", 5)
      .attr("class", d => `node-rect ${d.data.data.type || 'default'}`);

  node.append("text")
      .text(d => d.id || 'not id')
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central");

  // --- 6. 缩放/平移功能 (与之前相同) ---
  svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 3])
      .on("zoom", ({ transform }) => {
        // 为了让缩放中心更自然，我们调整一下 transform
        const newTransform = transform.translate(marginLeft, marginTop);
        container.attr("transform", newTransform);
      }));

  // 初始时将根节点居中
  const initialZoom = d3.zoomIdentity
      .translate(width / 2 - root.y - marginLeft, height / 4 - root.x - marginTop)
      .scale(0.8);
  svg.call(d3.zoom().transform, initialZoom);

});
</script>

<style>
/* 样式可以保持不变，也可以微调 */
.skill-tree-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.link {
  stroke: #4a5a6a;
  stroke-width: 1.5px;
  fill: none;
}

/* 让额外连线样式不同，以便区分 */
.link.extra {
  stroke-dasharray: 4 4;
  stroke: #7a6a4a;
}

.arrow-head {
  fill: #4a5a6a;
}
.extra + .arrow-head {
  fill: #7a6a4a;
}


.node-group {
  cursor: pointer;
  transition: transform 0.1s ease-in-out;
}

.node-rect {
  stroke: #567;
  stroke-width: 2px;
}

.node-rect.theHelm { fill: #3a5b75; }
.node-rect.compagnieRoyale { fill: #754c3a; }
.node-rect.default { fill: #333; }

.node-label {
  fill: #e5e9f0;
  font-family: sans-serif;
  font-size: 13px; /* 稍微调大字体 */
  font-weight: bold;
  pointer-events: none;
}
</style>
