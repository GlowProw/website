<script setup lang="ts">
import {onMounted, onUnmounted, ref, watch, computed} from 'vue';
import * as d3 from 'd3';
import type {Mastery, SeasonMasteryTree, MasteryEdge} from 'glow-prow-data';

const props = withDefaults(defineProps<{
  nodes: Record<string, Mastery>;
  edges: MasteryEdge[];
  selectedNode: Mastery | null;
  selectedNodeIds: Set<string>;
  regularPointsSpent: number;
  scaleExtent: [number, number];
  isDebug?: boolean;
  getNodeIconUrl: (skill: string) => string;
  isNodeActive: (id: string) => boolean;
  isNodeAvailable: (id: string) => boolean;
}>(), {
  isDebug: false,
});

const emit = defineEmits<{
  (e: 'select-node', node: Mastery | null): void;
  (e: 'toggle-activation', nodeId: string): void;
  (e: 'update:transform', transform: { k: number; x: number; y: number }): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// 视口变换
const currentTransform = ref(d3.zoomIdentity.translate(0, 0).scale(0.85));

// D3 缩放行为
let zoomBehavior: d3.ZoomBehavior<HTMLCanvasElement, unknown> | null = null;

// 交互状态
const hoveredNode = ref<Mastery | null>(null);
const isDraggingNode = ref(false);
let draggedNode: Mastery | null = null;
let mouseDownPos = { x: 0, y: 0 };
let hasMovedSignificantly = false;

// 图标缓存
const imageCache = new Map<string, HTMLImageElement>();

function getImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  if (imageCache.has(url)) {
    const img = imageCache.get(url)!;
    return img.complete && img.naturalWidth !== 0 ? img : null;
  }
  const img = new Image();
  img.onload = () => {
    requestRender();
  };
  img.onerror = () => {
    // 忽略加载错误
  };
  img.src = url;
  imageCache.set(url, img);
  return img.complete && img.naturalWidth !== 0 ? img : null;
}

// 动画与渲染队列
let animFrameId: number | null = null;

function requestRender() {
  if (animFrameId) return;
  animFrameId = requestAnimationFrame(() => {
    animFrameId = null;
    render();
  });
}

// 颜色渐变缓存
const gradientCache = new Map<string, CanvasGradient>();

function getCategoryGradient(ctx: CanvasRenderingContext2D, category: string, y: number, r: number): CanvasGradient {
  const key = `${category}_${Math.round(y)}_${r}`;
  let grad = gradientCache.get(key);
  if (!grad) {
    grad = ctx.createLinearGradient(0, y - r, 0, y + r);
    switch (category) {
      case 'defensive':
        grad.addColorStop(0, '#0c1824');
        grad.addColorStop(0.56, '#142536');
        grad.addColorStop(1, '#1d344b');
        break;
      case 'offensive':
        grad.addColorStop(0, '#220b12');
        grad.addColorStop(0.56, '#36121c');
        grad.addColorStop(1, '#4e1a28');
        break;
      case 'impetus':
        grad.addColorStop(0, '#241b09');
        grad.addColorStop(0.56, '#382b10');
        grad.addColorStop(1, '#503d16');
        break;
      default:
        grad.addColorStop(0, '#0b1b10');
        grad.addColorStop(0.56, '#142c1b');
        grad.addColorStop(1, '#1e3f28');
        break;
    }
    gradientCache.set(key, grad);
  }
  return grad;
}

// 核心 Canvas 绘制函数
function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 应用当前视口变换
  const t = currentTransform.value;
  ctx.scale(dpr, dpr);
  ctx.translate(t.x, t.y);
  ctx.scale(t.k, t.k);

  const activeIds = props.selectedNodeIds;
  const nodeMap = props.nodes;

  // 1. 批量绘制连线
  // 分别存储三种状态的路径，减少 stroke 状态切换
  const activeEdges: MasteryEdge[] = [];
  const availableEdges: MasteryEdge[] = [];
  const lockedEdges: MasteryEdge[] = [];

  for (let i = 0; i < props.edges.length; i++) {
    const e = props.edges[i];
    const sourceNode = nodeMap[e.source];
    const targetNode = nodeMap[e.target];
    if (!sourceNode || !targetNode) continue;

    const sourceActive = props.isNodeActive(e.source);
    const targetActive = props.isNodeActive(e.target);

    if (sourceActive && targetActive) {
      activeEdges.push(e);
    } else if (sourceActive || targetActive) {
      availableEdges.push(e);
    } else {
      lockedEdges.push(e);
    }
  }

  // 绘制锁定连线
  if (lockedEdges.length > 0) {
    ctx.beginPath();
    for (const e of lockedEdges) {
      const s = nodeMap[e.source].position;
      const tg = nodeMap[e.target].position;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tg.x, tg.y);
    }
    ctx.strokeStyle = 'rgba(70, 70, 70, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 绘制可用前置相连线
  if (availableEdges.length > 0) {
    ctx.beginPath();
    for (const e of availableEdges) {
      const s = nodeMap[e.source].position;
      const tg = nodeMap[e.target].position;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tg.x, tg.y);
    }
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }

  // 绘制已激活点亮连线
  if (activeEdges.length > 0) {
    ctx.save();
    ctx.beginPath();
    for (const e of activeEdges) {
      const s = nodeMap[e.source].position;
      const tg = nodeMap[e.target].position;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tg.x, tg.y);
    }
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.6;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }

  // 2. 绘制节点
  const nodesList = Object.values(nodeMap);
  for (let i = 0; i < nodesList.length; i++) {
    const node = nodesList[i];
    const {x, y} = node.position;
    const isActive = props.isNodeActive(node.key || node.id);
    const isAvailable = props.isNodeAvailable(node.key || node.id);
    const isSelected = Boolean(props.selectedNode && (props.selectedNode.key === node.key || props.selectedNode.id === node.id && !node.key));
    const isHovered = Boolean(hoveredNode.value && (hoveredNode.value.key === node.key || hoveredNode.value.id === node.id && !node.key));

    ctx.save();
    ctx.translate(x, y);

    const grad = getCategoryGradient(ctx, node.category, 0, 24);

    if (node.role === 'seasonalPerk') {
      // --- 赛季特长节点 (菱形) ---
      const size = 24;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3.2;
        ctx.shadowColor = '#ffeb3b';
        ctx.shadowBlur = 16;
      } else if (isHovered) {
        ctx.strokeStyle = '#fff275';
        ctx.lineWidth = 3.0;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
      } else if (isActive) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = '#806016';
        ctx.lineWidth = 2.0;
      }
      ctx.stroke();

      // 中心图标
      const iconUrl = props.getNodeIconUrl((node as any).skill || node.id);
      const img = getImage(iconUrl);
      if (img) {
        ctx.drawImage(img, -14, -14, 28, 28);
      }

      // 点数门槛角标
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.strokeStyle = '#806016';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(node.cost), 16, 16.5);

    } else if (node.role === 'keyBuff') {
      // --- 关键核心节点 (双层金边大圆) ---
      // 外层金边
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#3a2b05';
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3.4;
        ctx.shadowColor = '#ffeb3b';
        ctx.shadowBlur = 16;
      } else if (isHovered) {
        ctx.strokeStyle = '#fff275';
        ctx.lineWidth = 3.0;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
      } else if (isActive) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.2;
      }
      ctx.stroke();

      // 内层分类渐变圆
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#735914';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 中心图标
      const iconUrl = props.getNodeIconUrl((node as any).skill || node.id);
      const img = getImage(iconUrl);
      if (img) {
        ctx.drawImage(img, -14, -14, 28, 28);
      }

    } else {
      // --- 普通属性节点 (小圆) ---
      const r = 16;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3.0;
        ctx.shadowColor = '#ffeb3b';
        ctx.shadowBlur = 16;
      } else if (isHovered) {
        ctx.strokeStyle = '#fff275';
        ctx.lineWidth = 2.6;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
      } else if (isActive) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.6;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 8;
      } else if (isAvailable) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
      } else {
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1.2;
      }
      ctx.stroke();

      // 中心图标
      const iconUrl = props.getNodeIconUrl((node as any).skill || node.id);
      const img = getImage(iconUrl);
      if (img) {
        ctx.drawImage(img, -11, -11, 22, 22);
      }
    }

    ctx.restore();
  }

  ctx.restore();
}

// 屏幕坐标转画布世界坐标
function screenToWorld(clientX: number, clientY: number) {
  const canvas = canvasRef.value;
  if (!canvas) return { wx: 0, wy: 0 };
  const rect = canvas.getBoundingClientRect();
  const t = currentTransform.value;
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const wx = (x - t.x) / t.k;
  const wy = (y - t.y) / t.k;
  return { wx, wy };
}

// 命中检测
function findNodeAtWorld(wx: number, wy: number): Mastery | null {
  const nodes = Object.values(props.nodes);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const r = node.role === 'keyBuff' ? 28 : (node.role === 'seasonalPerk' ? 28 : 20);
    const dist = Math.hypot(wx - node.position.x, wy - node.position.y);
    if (dist <= r) {
      return node;
    }
  }
  return null;
}

// 事件监听与交互
function onMouseDown(event: MouseEvent) {
  mouseDownPos = { x: event.clientX, y: event.clientY };
  hasMovedSignificantly = false;

  const { wx, wy } = screenToWorld(event.clientX, event.clientY);
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

  const { wx, wy } = screenToWorld(event.clientX, event.clientY);

  if (isDraggingNode.value && draggedNode) {
    draggedNode.position.x = Math.round(wx);
    draggedNode.position.y = Math.round(wy);
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

function onMouseUp(event: MouseEvent) {
  if (isDraggingNode.value) {
    isDraggingNode.value = false;
    draggedNode = null;
    requestRender();
  }
}

function onMouseLeave() {
  if (hoveredNode.value) {
    hoveredNode.value = null;
    if (canvasRef.value) {
      canvasRef.value.style.cursor = 'default';
    }
    requestRender();
  }
}

function onClick(event: MouseEvent) {
  // 如果是大幅度拖动平移，忽略点击
  if (hasMovedSignificantly) return;

  const { wx, wy } = screenToWorld(event.clientX, event.clientY);
  const hit = findNodeAtWorld(wx, wy);

  if (hit) {
    emit('select-node', hit);
    // 双击或直接点击可激活节点时切换点数
    if (hit.role !== 'seasonalPerk' && (props.isNodeActive(hit.key || hit.id) || props.isNodeAvailable(hit.key || hit.id))) {
      emit('toggle-activation', hit.key || hit.id);
    }
  } else {
    emit('select-node', null);
  }
  requestRender();
}

// 尺寸自适应
function resizeCanvas() {
  const container = containerRef.value;
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

// 控制方法
function setTransform(k: number, x: number, y: number, duration = 300) {
  const canvas = canvasRef.value;
  if (!canvas || !zoomBehavior) return;

  const newTransform = d3.zoomIdentity.translate(x, y).scale(k);
  d3.select(canvas)
      .transition()
      .duration(duration)
      .call(zoomBehavior.transform as any, newTransform);
}

function setScale(targetK: number, duration = 300) {
  const canvas = canvasRef.value;
  if (!canvas || !zoomBehavior) return;

  const clamped = Math.max(props.scaleExtent[0], Math.min(props.scaleExtent[1], targetK));
  d3.select(canvas)
      .transition()
      .duration(duration)
      .call(zoomBehavior.scaleTo as any, clamped);
}

function zoomStep(delta: number) {
  const currentK = currentTransform.value.k;
  const targetK = Math.max(props.scaleExtent[0], Math.min(props.scaleExtent[1], currentK + delta));
  setScale(targetK, 250);
}

function resetView() {
  const container = containerRef.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  setTransform(1.5, cx, cy, 500);
}

function locateNode(node: Mastery) {
  const container = containerRef.value;
  if (!container || !node) return;
  const rect = container.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const targetScale = 2.0;

  const newX = -node.position.x * targetScale + cx;
  const newY = -node.position.y * targetScale + cy;

  setTransform(targetScale, newX, newY, 500);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  resizeCanvas();

  zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent(props.scaleExtent)
      .filter((event: MouseEvent) => {
        if (isDraggingNode.value) return false;
        // 允许滚轮与左键拖动画布
        return (!event.ctrlKey || event.type === 'wheel') && !event.button;
      })
      .on('zoom', ({ transform: t }) => {
        currentTransform.value = t;
        emit('update:transform', { k: t.k, x: Math.round(t.x), y: Math.round(t.y) });
        requestRender();
      });

  d3.select(canvas).call(zoomBehavior as any);

  // 初始居中
  resetView();

  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (animFrameId) cancelAnimationFrame(animFrameId);
});

// 响应属性变化重绘
watch([() => props.nodes, () => props.edges, () => props.selectedNodeIds, () => props.selectedNode, () => props.regularPointsSpent], () => {
  requestRender();
}, { deep: true });

defineExpose({
  setTransform,
  setScale,
  zoomStep,
  resetView,
  locateNode,
  requestRender
});
</script>

<template>
  <div class="mastery-canvas-container" ref="containerRef">
    <canvas
        ref="canvasRef"
        class="mastery-canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @click="onClick"
    ></canvas>
  </div>
</template>

<style scoped lang="less">
.mastery-canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: transparent;
}

.mastery-canvas {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
}
</style>
