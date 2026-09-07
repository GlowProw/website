<script setup lang="ts">
import {onMounted, onUnmounted, ref, watch} from 'vue';
import * as d3 from 'd3';
import {useI18n} from 'vue-i18n';
import {useAssetsStore} from '~/stores/assetsStore';
import {useCDNAssetsServiceStore} from '~/stores/cdnAssetsStore';
import StylizedLineBackground from '@/components/StylizedLineBackground.vue';

interface HierarchyNodeData {
  id: string;
  parentId: string | null;
  data: any;
  skillPointValue?: number;
}

const props = withDefaults(defineProps<{
  skills: Record<string, any>;
  selectedKey?: string | null;
  skillPointsInput: Record<string, number>;
  scaleExtent: [number, number];
  isDebug?: boolean;
}>(), {
  selectedKey: null,
  isDebug: false,
});

const emit = defineEmits<{
  (e: 'select-node', key: string | null): void;
  (e: 'update:transform', transform: { k: number; x: number; y: number }): void;
}>();

const {t, locale} = useI18n();
const {currentService: currentImageService} = useCDNAssetsServiceStore();
const {serializationMap} = useAssetsStore();

// @ts-ignore
const factionImages = import.meta.glob('@glow-prow-assets/factions/*.webp', {eager: true});
const factionLocalMap = serializationMap(factionImages);

const canvasContainerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const svgTransform = ref({k: 1, x: 0, y: 0});
const nodeRadius = 30;
const hoveredNode = ref<d3.HierarchyNode<HierarchyNodeData> | null>(null);
const isDraggingNode = ref(false);
let draggedNode: d3.HierarchyPointNode<HierarchyNodeData> | null = null;
let mouseDownPos = {x: 0, y: 0};
let hasMovedSignificantly = false;

let root: d3.HierarchyNode<HierarchyNodeData> | null = null;
let zoom: d3.ZoomBehavior<HTMLCanvasElement, unknown> | null = null;
let extraLinksData: { source: string; target: string }[] = [];
let categoryGroupsData: [string, d3.HierarchyPointNode<HierarchyNodeData>[]][] = [];
let nodesById = new Map<string, d3.HierarchyPointNode<HierarchyNodeData>>();

// 阵营图标缓存
const factionImageCache = new Map<string, HTMLImageElement>();
const factionConvertDictionary: Record<string, string> = {
  "theHelmEmpire": "theHelm",
  "rogues": "pirates"
};

function getFactionImage(factionType: string): HTMLImageElement | null {
  if (!factionType || factionType === 'root') return null;
  const key = factionConvertDictionary[factionType] || factionType;
  if (factionImageCache.has(key)) {
    const img = factionImageCache.get(key)!;
    return img.complete && img.naturalWidth !== 0 ? img : null;
  }
  const raw = factionLocalMap[key];
  const localSrc = (typeof raw === 'object' && raw?.default) ? raw.default : (typeof raw === 'string' ? raw : '');
  const url = localSrc || currentImageService.url({
    'glow-prow': {
      id: key,
      category: 'factions'
    }
  }, 'glow-prow');
  if (!url) return null;

  const img = new Image();
  img.onload = () => requestRender();
  img.src = url;
  factionImageCache.set(key, img);
  return img.complete && img.naturalWidth !== 0 ? img : null;
}

let animFrameId: number | null = null;

function requestRender() {
  if (animFrameId) return;
  animFrameId = requestAnimationFrame(() => {
    animFrameId = null;
    renderCanvas();
  });
}

function screenToWorld(clientX: number, clientY: number) {
  const canvas = canvasRef.value;
  if (!canvas) return {wx: 0, wy: 0};
  const rect = canvas.getBoundingClientRect();
  const screenX = clientX - rect.left;
  const screenY = clientY - rect.top;
  const k = svgTransform.value.k || 1;
  const wx = (screenX - svgTransform.value.x) / k;
  const wy = (screenY - svgTransform.value.y) / k;
  return {wx, wy};
}

function findNodeAtWorld(wx: number, wy: number): d3.HierarchyPointNode<HierarchyNodeData> | null {
  if (!root) return null;
  const descendants = root.descendants().filter(d => d.id !== 'root') as d3.HierarchyPointNode<HierarchyNodeData>[];
  for (let i = descendants.length - 1; i >= 0; i--) {
    const n = descendants[i];
    const dist = Math.hypot(wx - n.y, wy - n.x);
    if (dist <= nodeRadius + 4) {
      return n;
    }
  }
  return null;
}

function onMouseDown(event: MouseEvent) {
  mouseDownPos = {x: event.clientX, y: event.clientY};
  hasMovedSignificantly = false;

  const {wx, wy} = screenToWorld(event.clientX, event.clientY);
  const hit = findNodeAtWorld(wx, wy);

  if (props.isDebug && hit && event.button === 0) {
    isDraggingNode.value = true;
    draggedNode = hit;
  }
}

function onMouseMove(event: MouseEvent) {
  if (Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y) > 4) {
    hasMovedSignificantly = true;
  }

  const {wx, wy} = screenToWorld(event.clientX, event.clientY);

  if (isDraggingNode.value && draggedNode) {
    draggedNode.y = Math.round(wx);
    draggedNode.x = Math.round(wy);
    requestRender();
    return;
  }

  const hit = findNodeAtWorld(wx, wy);
  if (hit !== hoveredNode.value) {
    hoveredNode.value = hit;
    if (canvasRef.value) {
      canvasRef.value.style.cursor = hit ? 'pointer' : 'default';
    }
    requestRender();
  }
}

function onMouseUp() {
  if (isDraggingNode.value) {
    isDraggingNode.value = false;
    draggedNode = null;
    requestRender();
  }
}

function onClick(event: MouseEvent) {
  if (hasMovedSignificantly) return;

  const {wx, wy} = screenToWorld(event.clientX, event.clientY);
  const hit = findNodeAtWorld(wx, wy);

  if (hit) {
    const {key} = hit.data.data;
    emit('select-node', key || null);
    locateNode(hit);
  } else {
    emit('select-node', null);
  }
  requestRender();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  const len = 8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(len / 2, 0);
  ctx.lineTo(-len / 2, -4);
  ctx.lineTo(-len / 2, 4);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

function renderCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  const tForm = svgTransform.value;
  ctx.translate(tForm.x, tForm.y);
  ctx.scale(tForm.k, tForm.k);

  if (!root) {
    ctx.restore();
    return;
  }

  // 1. 绘制背景分类大标题水印
  ctx.save();
  ctx.font = 'bold 96px sans-serif';
  ctx.fillStyle = 'rgba(171, 178, 191, 0.12)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (const [factionKey, nodes] of categoryGroupsData) {
    if (nodes.length === 0) continue;
    let minX = Infinity;
    let minY = Infinity;
    for (const n of nodes) {
      if (n.y < minX) minX = n.y;
      if (n.x < minY) minY = n.x;
    }
    const factionTitle = t(`snb.factions.${factionKey}.name`);
    ctx.fillText(factionTitle, minX - 40, minY + 30);
  }
  ctx.restore();

  // 2. 绘制树连线
  const links = root.links().filter(l => l.source.id !== 'root');

  for (const l of links) {
    const s = l.source as d3.HierarchyPointNode<HierarchyNodeData>;
    const tNode = l.target as d3.HierarchyPointNode<HierarchyNodeData>;

    const sx = s.y;
    const sy = s.x;
    const tx = tNode.y;
    const ty = tNode.x;

    const isCompleted = (props.skillPointsInput[s.id] || 0) > 0;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    const midX = (sx + tx) / 2;
    ctx.lineTo(midX, sy);
    ctx.lineTo(midX, ty);
    ctx.lineTo(tx, ty);

    ctx.strokeStyle = isCompleted ? '#ffd700' : 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = isCompleted ? 2.5 : 1.5;
    ctx.stroke();

    const arrowX = tx - nodeRadius - 6;
    drawArrowHead(ctx, arrowX, ty, 0);
    ctx.restore();
  }

  // 3. 绘制额外连线 (extraLinks)
  for (const el of extraLinksData) {
    const s = nodesById.get(el.source);
    const tNode = nodesById.get(el.target);
    if (!s || !tNode) continue;

    const sx = s.y;
    const sy = s.x;
    const tx = tNode.y;
    const ty = tNode.x;

    const isCompleted = (props.skillPointsInput[s.id] || 0) > 0;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);

    ctx.strokeStyle = isCompleted ? '#ffd700' : 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = isCompleted ? 2.5 : 1.5;
    ctx.stroke();

    const angle = Math.atan2(ty - sy, tx - sx);
    const arrowX = tx - Math.cos(angle) * (nodeRadius + 6);
    const arrowY = ty - Math.sin(angle) * (nodeRadius + 6);
    drawArrowHead(ctx, arrowX, arrowY, angle);
    ctx.restore();
  }

  // 4. 绘制技能节点
  const descendants = root.descendants().filter(d => d.id !== 'root') as d3.HierarchyPointNode<HierarchyNodeData>[];

  for (const d of descendants) {
    const cx = d.y;
    const cy = d.x;

    const currentPoints = props.skillPointsInput[d.id] || 0;
    const maxStage = d.data.data.stage || 1;
    const isHighlighted = props.selectedKey === d.data.data.key;
    const isHovered = hoveredNode.value?.id === d.id;

    ctx.save();

    // 选中或悬停时的光晕
    if (isHighlighted) {
      ctx.shadowColor = '#ffeb3b';
      ctx.shadowBlur = 24;
    } else if (isHovered) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
    } else if (currentPoints > 0) {
      ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
      ctx.shadowBlur = 12;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, nodeRadius, 0, Math.PI * 2);

    if (currentPoints > 0) {
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, nodeRadius);
      grad.addColorStop(0, '#75580a');
      grad.addColorStop(1, '#3b2901');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, nodeRadius);
      grad.addColorStop(0, '#2d2105');
      grad.addColorStop(1, '#161002');
      ctx.fillStyle = grad;
    }
    ctx.fill();

    if (isHighlighted) {
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 3;
    } else if (currentPoints > 0) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
    } else if (isHovered) {
      ctx.strokeStyle = '#ffcf40';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = '#af8313';
      ctx.lineWidth = 1.2;
    }
    ctx.stroke();
    ctx.restore();

    // 阵营小徽章
    const factionType = d.data.data.type;
    const fImg = getFactionImage(factionType);
    if (fImg) {
      const iconSize = 28;
      ctx.drawImage(fImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
    }

    // 节点文字说明
    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const skillTitle = t(`snb.empireSkills.${d.data.data.id}.name`);
    const labelText = `${skillTitle} (${currentPoints}/${maxStage})`;

    if (isHighlighted) {
      ctx.fillStyle = '#ffffff';
    } else if (currentPoints > 0) {
      ctx.fillStyle = '#ffecb3';
    } else {
      ctx.fillStyle = '#abb2bf';
    }
    ctx.fillText(labelText, cx, cy + 36);
    ctx.restore();
  }

  ctx.restore();
}

function locateNode(node: d3.HierarchyNode<HierarchyNodeData>) {
  if (!canvasRef.value || node.x === undefined || node.y === undefined) return;

  const containerRect = canvasRef.value.getBoundingClientRect();
  const svgWidth = containerRect.width;
  const svgHeight = containerRect.height;
  const targetScale = 1.8;

  const newX = -node.y * targetScale + svgWidth / 2;
  const newY = -node.x * targetScale + svgHeight / 2;

  if (zoom && canvasRef.value) {
    d3.select(canvasRef.value)
        .transition()
        .duration(450)
        .call(zoom.transform as any, d3.zoomIdentity.translate(newX, newY).scale(targetScale));
  }
}

function locateNodeByKey(key: string) {
  if (!root || !key || key === 'root') return;
  const node = root.descendants().find(d => d.id === key);
  if (node) {
    locateNode(node);
  }
}

function setSvgScale(scale: number) {
  if (!canvasRef.value || !zoom) return;
  const targetScale = Math.max(props.scaleExtent[0], Math.min(props.scaleExtent[1], scale));
  d3.select(canvasRef.value)
      .transition()
      .duration(450)
      .call(zoom.scaleTo as any, targetScale);
}

function zoomStep(delta: number) {
  if (!canvasRef.value || !zoom) return;
  d3.select(canvasRef.value)
      .transition()
      .duration(300)
      .call(zoom.scaleBy as any, delta > 0 ? 1.25 : 0.8);
}

function resizeCanvas() {
  const container = canvasContainerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;

  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  requestRender();
}

function drawTree() {
  if (!canvasRef.value || !props.skills) return;

  const containerRect = canvasRef.value.getBoundingClientRect();
  const dynamicWidth = containerRect.width || 800;
  const dynamicHeight = containerRect.height || 600;

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

  root = d3.stratify<HierarchyNodeData>()
      .id(d => d.id)
      .parentId(d => d.parentId)(flatData);

  const treeLayout = d3.tree<HierarchyNodeData>()
      .size([dynamicHeight, dynamicWidth])
      .nodeSize([90, 180]);

  treeLayout(root);

  extraLinksData = extraLinks;
  nodesById = new Map((root.descendants() as d3.HierarchyPointNode<HierarchyNodeData>[]).map(d => [d.id, d]));
  categoryGroupsData = d3.groups(
      root.descendants().filter(d => d.data.data.type) as d3.HierarchyPointNode<HierarchyNodeData>[],
      d => d.data.data.type
  );

  const canvas = canvasRef.value;
  if (canvas) {
    zoom = d3.zoom<HTMLCanvasElement, unknown>()
        .scaleExtent(props.scaleExtent)
        .filter((event: MouseEvent) => {
          if (isDraggingNode.value) return false;
          return (!event.ctrlKey || event.type === 'wheel') && !event.button;
        })
        .on("zoom", ({transform}) => {
          svgTransform.value = transform;
          emit('update:transform', transform);
          requestRender();
        });

    d3.select(canvas).call(zoom as any);
  }

  requestRender();
}

function getNodeCoords(key: string) {
  if (!root) return null;
  return root.descendants().find(d => d.id === key) || null;
}

function exportDebugConfig(): Record<string, any> | null {
  if (!root) return null;
  const exported: Record<string, any> = {};
  root.descendants().filter(d => d.id !== 'root').forEach(d => {
    exported[d.id] = {
      id: d.data.data.id,
      requisite: d.data.data.requisite,
      x: Math.round(d.y),
      y: Math.round(d.x)
    };
  });
  return exported;
}

function getAllDescendants() {
  if (!root) return [];
  return root.descendants().filter(d => d.id !== 'root');
}

watch(locale, () => {
  drawTree();
});

watch(() => props.skillPointsInput, () => {
  requestRender();
}, {deep: true});

watch(() => props.selectedKey, () => {
  requestRender();
});

watch(() => props.skills, () => {
  drawTree();
}, {deep: true});

onMounted(() => {
  resizeCanvas();
  drawTree();

  window.addEventListener('resize', () => {
    resizeCanvas();
    drawTree();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (animFrameId) cancelAnimationFrame(animFrameId);
});

defineExpose({
  locateNodeByKey,
  setSvgScale,
  zoomStep,
  requestRender,
  drawTree,
  getNodeCoords,
  exportDebugConfig,
  getAllDescendants,
  svgTransform
});
</script>

<template>
  <div class="position-relative h-100 w-100 overflow-hidden" ref="canvasContainerRef">
    <StylizedLineBackground
        class="skill-tree-line-bg"
        :offset-x="svgTransform.x"
        :offset-y="svgTransform.y"
    >
      <canvas
          ref="canvasRef"
          class="skill-tree-canvas"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @click="onClick"
      ></canvas>
    </StylizedLineBackground>
  </div>
</template>

<style scoped lang="less">
.skill-tree-line-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.skill-tree-canvas {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
}
</style>
