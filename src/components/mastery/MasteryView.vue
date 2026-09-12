<script setup lang="ts">
import {onMounted, onUnmounted, ref, watch, computed} from 'vue';
import {useI18n} from 'vue-i18n';
import * as d3 from 'd3';
import type {Mastery, SeasonMasteryTree, MasteryEdge} from 'glow-prow-data';

const {t} = useI18n();

const props = withDefaults(defineProps<{
  nodes: Record<string, Mastery>;
  edges?: MasteryEdge[];
  selectedNode: Mastery | null;
  selectedNodeIds: Set<string>;
  regularPointsSpent: number;
  scaleExtent: [number, number];
  isDebug?: boolean;
  getNodeIconUrl: (skill: string) => string;
  getSkillName?: (skillKey: string, nodeKey?: string) => string;
  isNodeActive: (id: string) => boolean;
  isNodeAvailable: (id: string) => boolean;
  initialScale?: number;
  initialTx?: number;
  initialTy?: number;
  dpr?: number;
  readonly?: boolean;
  // 是否允许拖拽/缩放画布（与 readonly 解耦：只读详情页仍可平移查看）
  draggable?: boolean;
}>(), {
  isDebug: false,
  readonly: false,
  draggable: true,
  edges: () => [],
});

// 自动从 nodes.requisite 生成连线 (若外部未传入 edges)
const resolvedEdges = computed<MasteryEdge[]>(() => {
  if (props.edges && props.edges.length > 0) return props.edges;
  const edges: MasteryEdge[] = [];
  const edgeSet = new Set<string>();
  const nodeMap = props.nodes;
  for (const [nodeKey, node] of Object.entries(nodeMap)) {
    if (node.requisite && node.requisite.length > 0) {
      for (const reqKey of node.requisite) {
        const resolvedSource = nodeMap[reqKey]
          ? reqKey
          : Object.keys(nodeMap).find(k => nodeMap[k].id === reqKey) || reqKey;
        const edgeId = `${resolvedSource}->${nodeKey}`;
        if (!edgeSet.has(edgeId) && nodeMap[resolvedSource]) {
          edgeSet.add(edgeId);
          edges.push({ id: edgeId, source: resolvedSource, target: nodeKey });
        }
      }
    }
  }
  return edges;
});

const emit = defineEmits<{
  (e: 'select-node', node: Mastery | null): void;
  (e: 'toggle-activation', nodeId: string): void;
  (e: 'update:transform', transform: { k: number; x: number; y: number }): void;
  (e: 'debug-add-node', position: { x: number; y: number }): void;
  (e: 'debug-insert-node', payload: { parentKey: string; childKey: string; position: { x: number; y: number } }): void;
  (e: 'debug-delete-node', node: Mastery): void;
  (e: 'debug-toggle-requisite', payload: { node: Mastery; requisiteKey: string }): void;
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
  img.crossOrigin = 'anonymous';
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

  const dpr = props.dpr ?? (window.devicePixelRatio || 1);
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

  // 批量绘制连线
  // 分别存储三种状态的路径，减少 stroke 状态切换
  const activeEdges: MasteryEdge[] = [];
  const availableEdges: MasteryEdge[] = [];
  const lockedEdges: MasteryEdge[] = [];

  const edgesList = resolvedEdges.value;
  for (let i = 0; i < edgesList.length; i++) {
    const e = edgesList[i];
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
    ctx.save();
    if (props.readonly) ctx.globalAlpha = 0.3;
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
    ctx.restore();
  }

  // 绘制可用前置相连线
  if (availableEdges.length > 0) {
    ctx.save();
    if (props.readonly) ctx.globalAlpha = 0.1;
    ctx.beginPath();
    for (const e of availableEdges) {
      const s = nodeMap[e.source].position;
      const tg = nodeMap[e.target].position;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tg.x, tg.y);
    }
    ctx.strokeStyle = '#999999';
    if (props.readonly) ctx.strokeStyle = 'rgba(70, 70, 70, 0.45)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
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

  // 绘制节点
  const nodesList = Object.values(nodeMap);
  for (let i = 0; i < nodesList.length; i++) {
    const node = nodesList[i];
    const {x, y} = node.position;
    const isActive = props.isNodeActive(node.key || node.id);
    const isAvailable = props.isNodeAvailable(node.key || node.id);
    const isSelected = Boolean(props.selectedNode && (props.selectedNode.key === node.key || props.selectedNode.id === node.id && !node.key));
    const isHovered = Boolean(hoveredNode.value && (hoveredNode.value.key === node.key || hoveredNode.value.id === node.id && !node.key));

    ctx.save();
    if (props.readonly && !isActive) ctx.globalAlpha = 0.1;
    ctx.translate(x, y);

    const grad = getCategoryGradient(ctx, node.category, 0, 27);

    if (node.role === 'seasonalPerk') {
      // 赛季特长节点 (菱形)
      const size = 27;
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
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.strokeStyle = '#fff275';
        ctx.lineWidth = 2.8;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
      } else if (isActive) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.6;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = '#806016';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      // 描边后立刻重置阴影，避免影响后续图标和文本
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 中心图标 (内边 5px)
      const iconUrl = props.getNodeIconUrl((node as any).skill || node.id);
      const img = getImage(iconUrl);
      if (img) {
        const iconSize = 17;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, iconSize, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, -iconSize, -iconSize, iconSize * 2, iconSize * 2);
        ctx.restore();
      }

      // 点数门槛角标
      ctx.beginPath();
      ctx.arc(18, 18, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.strokeStyle = '#806016';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(node.cost), 18, 18.5);

    } else if (node.role === 'keyBuff') {
      // 关键核心节点 (双层金边大圆)
      const rOuter = 27;
      const rInner = 23;
      const iconR = rInner - 5; // 18，内边 5px

      // 外层圆底色
      ctx.beginPath();
      ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
      ctx.fillStyle = (isActive || isSelected || isHovered) ? '#3a2b05' : (isAvailable ? '#222222' : '#181818');
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
        ctx.shadowBlur = 12;
      } else if (isActive) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 10;
      } else if (isAvailable) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 内层分类渐变圆
      ctx.beginPath();
      ctx.arc(0, 0, rInner, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = (isActive || isSelected || isHovered) ? '#735914' : (isAvailable ? '#444444' : '#2e2e2e');
      ctx.lineWidth = 1;
      ctx.stroke();

      // 中心图标 (内边 5px，圆形裁剪)
      const iconUrl = props.getNodeIconUrl((node as any).skill || node.id);
      const img = getImage(iconUrl);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, iconR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, -iconR, -iconR, iconR * 2, iconR * 2);
        ctx.restore();
      }

    } else {
      // 普通属性节点
      const r = 20;
      const innerR = r - 5; // 15，内边 5px

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3.0;
        ctx.shadowColor = '#ffeb3b';
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.strokeStyle = '#fff275';
        ctx.lineWidth = 2.6;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
      } else if (isActive) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.6;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 8;
      } else if (isAvailable) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 中心图标 (内边 5px，圆形裁剪)
      const iconUrl = props.getNodeIconUrl((node as any).skill || node.id);
      const img = getImage(iconUrl);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, innerR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, -innerR, -innerR, innerR * 2, innerR * 2);
        ctx.restore();
      }
    }

    // 节点下方显示名称
    const skillName = props.getSkillName ? props.getSkillName(node.id, node.key) : ((node as any).name || (node as any).label || node.id);
    if (skillName) {
      const bottomY = (node.role === 'keyBuff' || node.role === 'seasonalPerk') ? 28 : 20;
      const textY = bottomY + 10;

      ctx.save();
      // 确保绝对不发光
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      let textColor = 'rgba(215, 215, 215, 0.9)';
      if (isSelected) {
        textColor = '#ffeb3b';
      } else if (isHovered) {
        textColor = '#fff275';
      } else if (isActive) {
        textColor = '#ffd700';
      } else if (isAvailable) {
        textColor = '#ffffff';
      } else {
        textColor = 'rgba(165, 165, 165, 0.7)';
      }

      // 轻微深色底描边提高对比度，绝无发光
      ctx.strokeStyle = 'rgba(15, 15, 15, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.strokeText(skillName, 0, textY);

      ctx.fillStyle = textColor;
      ctx.fillText(skillName, 0, textY);
      ctx.restore();
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
    const r = node.role === 'keyBuff' ? 31 : (node.role === 'seasonalPerk' ? 31 : 23);
    const dist = Math.hypot(wx - node.position.x, wy - node.position.y);
    if (dist <= r) {
      return node;
    }
  }
  return null;
}

// 点到线段的距离（世界坐标），同时返回投影是否落在线段内部及投影坐标
function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return {dist: Math.hypot(px - x1, py - y1), inside: false, cx: x1, cy: y1};
  let u = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  u = Math.max(0, Math.min(1, u));
  const cx = x1 + u * dx;
  const cy = y1 + u * dy;
  return {dist: Math.hypot(px - cx, py - cy), inside: u > 0 && u < 1, cx, cy};
}

// 命中某条连线（用于在两节点之间插入新节点）
function findEdgeAtWorld(wx: number, wy: number): MasteryEdge | null {
  const threshold = 10 / currentTransform.value.k; // 屏幕约 10px
  const nodeClearance = 26; // 避开节点圆附近，让节点命中优先
  let best: MasteryEdge | null = null;
  let bestDist = threshold;
  for (const edge of resolvedEdges.value) {
    const s = props.nodes[edge.source];
    const tg = props.nodes[edge.target];
    if (!s || !tg) continue;
    const seg = distanceToSegment(wx, wy, s.position.x, s.position.y, tg.position.x, tg.position.y);
    if (!seg.inside) continue;
    // 投影点不能太靠近任一端点节点
    const nearEndpoint = Math.hypot(seg.cx - s.position.x, seg.cy - s.position.y) < nodeClearance
        || Math.hypot(seg.cx - tg.position.x, seg.cy - tg.position.y) < nodeClearance;
    if (nearEndpoint) continue;
    if (seg.dist < bestDist) {
      bestDist = seg.dist;
      best = edge;
    }
  }
  return best;
}

// 事件监听与交互
function onMouseDown(event: MouseEvent) {
  if (props.readonly) return;
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
  if (props.readonly) return;
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
  if (props.readonly) return;
  if (isDraggingNode.value) {
    isDraggingNode.value = false;
    draggedNode = null;
    requestRender();
  }
}

function onMouseLeave() {
  if (props.readonly) return;
  if (hoveredNode.value) {
    hoveredNode.value = null;
    if (canvasRef.value) {
      canvasRef.value.style.cursor = props.draggable ? 'grab' : 'default';
    }
    requestRender();
  }
}

function onClick(event: MouseEvent) {
  if (props.readonly) return;
  // 如果是大幅度拖动平移，忽略点击
  if (hasMovedSignificantly) return;

  const { wx, wy } = screenToWorld(event.clientX, event.clientY);
  const hit = findNodeAtWorld(wx, wy);

  if (hit) {
    emit('select-node', hit);
    // 单击即切换激活：
    // - 常规节点：已激活或与起点相连可达时直接加/退点
    // - 赛季特长：点数达标即激活/取消，同一条件(tier)下只能选中一个，互斥由控制器保证
    const nodeId = hit.key || hit.id;
    if (props.isNodeActive(nodeId) || props.isNodeAvailable(nodeId)) {
      emit('toggle-activation', nodeId);
    }
  } else {
    emit('select-node', null);
  }
  requestRender();
}

interface DebugContextMenu {
  // 屏幕坐标（fixed 定位）
  sx: number;
  sy: number;
  // 世界坐标（新增节点用）
  wx: number;
  wy: number;
  node: Mastery | null;
  // 命中的连线（在两节点之间插入节点用）
  edge: MasteryEdge | null;
}

const contextMenu = ref<DebugContextMenu | null>(null);

// 菜单定位
const menuStyle = computed(() => {
  const m = contextMenu.value;
  if (!m) return {};
  const menuW = 240;
  const menuH = 300;
  const left = Math.max(8, Math.min(m.sx, window.innerWidth - menuW - 8));
  const top = Math.max(8, Math.min(m.sy, window.innerHeight - menuH - 8));
  return { left: `${left}px`, top: `${top}px` };
});

// 当前选中的另一个节点能否作为右键节点的前置
const menuParentNode = computed<Mastery | null>(() => {
  const m = contextMenu.value;
  if (!m?.node || !props.selectedNode) return null;
  if (props.selectedNode.key === m.node.key) return null;
  return props.selectedNode;
});

// 前置关系是否已存在
const menuParentLinked = computed<boolean>(() => {
  const m = contextMenu.value;
  const parent = menuParentNode.value;
  if (!m?.node || !parent) return false;
  return (m.node.requisite || []).some(r => r === parent.key || r === parent.id);
});

// localNodes 为浅拷贝普通对象（缺 Mastery 的 _entityType），这里按最小结构接收
const menuNodeName = (node: { key: string; id: string } | null) => {
  if (!node) return '';
  return props.getSkillName?.(node.id, node.key) || node.key || node.id;
};

// 「设为前置 / 取消连线」菜单项文案（避免在模板属性中拼接字符串）
const menuParentLabel = computed(() => {
  const name = menuNodeName(menuParentNode.value);
  return menuParentLinked.value
      ? t('mastery.debug.removeParentLink', { name })
      : t('mastery.debug.setAsParent', { name });
});

// 命中连线时，「在两节点之间插入节点」菜单项文案
const menuEdgeLabel = computed(() => {
  const edge = contextMenu.value?.edge;
  if (!edge) return '';
  const s = props.nodes[edge.source];
  const tg = props.nodes[edge.target];
  return t('mastery.debug.insertBetween', {
    from: menuNodeName(s || null),
    to: menuNodeName(tg || null)
  });
});

// 选中节点 A 后右键节点 B：在 A 与 B 之间插入节点的菜单项文案
const menuInsertBetweenLabel = computed(() => {
  const m = contextMenu.value;
  const parent = menuParentNode.value;
  if (!m?.node || !parent) return '';
  return t('mastery.debug.insertBetween', {
    from: menuNodeName(parent),
    to: menuNodeName(m.node)
  });
});

function onContextMenu(event: MouseEvent) {
  if (!props.isDebug) return;
  event.preventDefault();

  const { wx, wy } = screenToWorld(event.clientX, event.clientY);
  const hit = findNodeAtWorld(wx, wy);
  // 节点优先；未命中节点时检测连线
  const hitEdge = hit ? null : findEdgeAtWorld(wx, wy);
  // 右键不改变当前选中节点：保留「先选中 A，再右键 B」的菜单入口（在 A/B 间插入、设为前置）；
  // 需要编辑 B 时由「编辑节点」菜单项负责选中
  contextMenu.value = { sx: event.clientX, sy: event.clientY, wx, wy, node: hit, edge: hitEdge };
}

function closeContextMenu() {
  contextMenu.value = null;
}

// 仅响应主键（左键）点击外部关闭：右键呼出菜单的同一手势可能因节点卡片等元素
// 即时挂载而产生余波 click（button=2），不能让它把刚打开的菜单关掉
function onDocumentClickForMenu(event: MouseEvent) {
  if (event.button === 0) closeContextMenu();
}

function onMenuEditNode() {
  const m = contextMenu.value;
  // 右键时不抢占选中，点「编辑节点」才选中并打开调试卡片
  if (m?.node) emit('select-node', m.node as Mastery);
  closeContextMenu();
}

function onMenuAddNode() {
  const m = contextMenu.value;
  emit('debug-add-node', { x: m?.wx ?? 0, y: m?.wy ?? 0 });
  closeContextMenu();
}

// 在命中连线上插入：分割 source → target 连线
function onMenuInsertOnEdge() {
  const m = contextMenu.value;
  if (m?.edge) {
    emit('debug-insert-node', {
      parentKey: m.edge.source,
      childKey: m.edge.target,
      position: { x: m.wx, y: m.wy }
    });
  }
  closeContextMenu();
}

// 在已选中节点与右键节点之间插入
function onMenuInsertBetweenSelected() {
  const m = contextMenu.value;
  const parent = menuParentNode.value;
  if (m?.node && parent) {
    emit('debug-insert-node', {
      parentKey: parent.key,
      childKey: m.node.key,
      position: { x: m.wx, y: m.wy }
    });
  }
  closeContextMenu();
}

function onMenuDeleteNode() {
  const m = contextMenu.value;
  if (m?.node) emit('debug-delete-node', m.node as Mastery);
  closeContextMenu();
}

function onMenuToggleRequisite() {
  const m = contextMenu.value;
  const parent = menuParentNode.value;
  if (m?.node && parent) {
    emit('debug-toggle-requisite', { node: m.node as Mastery, requisiteKey: parent.key });
  }
  closeContextMenu();
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeContextMenu();
}

// 菜单打开时：点击其它区域 / 缩放平移 即关闭
watch(contextMenu, (val) => {
  if (val) {
    // bubble 阶段监听：菜单 v-card 上有 @click.stop，点菜单内部不会冒泡到这里；
    // 切勿用 capture，否则会先于菜单项 handler 执行、提前清空 contextMenu 导致点击失效
    document.addEventListener('click', onDocumentClickForMenu);
    document.addEventListener('keydown', onDocumentKeydown);
  } else {
    document.removeEventListener('click', onDocumentClickForMenu);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});

// 画布平移/缩放时关闭菜单
watch(currentTransform, () => {
  if (contextMenu.value) closeContextMenu();
});

// 此时尺寸为 0，切换页签变为可见时通过 ResizeObserver 补偿一次尺寸计算
let resizeObserver: ResizeObserver | null = null;
let hasInitiallySized = false;

// 尺寸自适应
function resizeCanvas() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;

  const width = container.clientWidth || container.offsetWidth;
  const height = container.clientHeight || container.offsetHeight;
  if (!width || !height) return;

  const dpr = props.dpr ?? (window.devicePixelRatio || 1);

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // 首次获得有效尺寸（含从隐藏切换为可见）时重置视图居中
  if (!hasInitiallySized) {
    hasInitiallySized = true;
    resetView();
    return;
  }

  requestRender();
}

// 控制方法
function setTransform(k: number, x: number, y: number, duration = 300) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const newTransform = d3.zoomIdentity.translate(x, y).scale(k);

  if (!zoomBehavior || props.readonly || duration === 0) {
    currentTransform.value = newTransform;
    emit('update:transform', { k, x: Math.round(x), y: Math.round(y) });
    // 即便只读/无过渡，只要挂载了缩放行为（draggable），也需同步 d3 内部状态，
    // 否则首次滚轮/拖拽会从 d3 初始的 identity 状态起跳导致画面跳变
    if (zoomBehavior) {
      d3.select(canvas).call(zoomBehavior.transform as any, newTransform);
    }
    requestRender();
    return;
  }

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
  const width = container.clientWidth || container.offsetWidth;
  const height = container.clientHeight || container.offsetHeight;
  const cx = width / 2;
  const cy = height / 2;
  const targetK = props.initialScale ?? 1.5;
  const targetX = props.initialTx ?? cx;
  const targetY = props.initialTy ?? cy;
  setTransform(targetK, targetX, targetY, props.readonly ? 0 : 500);
}

function locateNode(node: Mastery) {
  const container = containerRef.value;
  if (!container || !node) return;
  const width = container.clientWidth || container.offsetWidth;
  const height = container.clientHeight || container.offsetHeight;
  const cx = width / 2;
  const cy = height / 2;
  const targetScale = 2.0;

  const newX = -node.position.x * targetScale + cx;
  const newY = -node.position.y * targetScale + cy;

  setTransform(targetScale, newX, newY, 500);
}

async function preloadAllIcons(): Promise<void> {
  const urls: string[] = [];
  for (const node of Object.values(props.nodes || {})) {
    const iconUrl = props.getNodeIconUrl((node as any).skill || node.id);
    if (iconUrl && !urls.includes(iconUrl)) {
      urls.push(iconUrl);
    }
  }

  await Promise.all(urls.map(url => {
    if (imageCache.has(url)) {
      const existing = imageCache.get(url)!;
      if (existing.complete && existing.naturalWidth !== 0) return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.set(url, img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  }));

  requestRender();
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  resizeCanvas();

  // 拖拽/缩放能力由 draggable 独立控制（只读页同样允许平移画布查看）
  if (props.draggable) {
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
  } else {
    const targetK = props.initialScale ?? 1.0;
    const targetX = props.initialTx ?? 0;
    const targetY = props.initialTy ?? 0;
    currentTransform.value = d3.zoomIdentity.translate(targetX, targetY).scale(targetK);
  }

  // 初始居中
  resetView();

  window.addEventListener('resize', resizeCanvas);

  // 观察容器尺寸：处理挂载于 v-show/display:none 容器、切为可见时的尺寸补偿
  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
  resizeObserver?.disconnect();
  resizeObserver = null;
  document.removeEventListener('click', onDocumentClickForMenu);
  document.removeEventListener('keydown', onDocumentKeydown);
  if (animFrameId) cancelAnimationFrame(animFrameId);
});

// 响应属性变化重绘
watch([() => props.nodes, resolvedEdges, () => props.selectedNodeIds, () => props.selectedNode, () => props.regularPointsSpent], () => {
  requestRender();
}, { deep: true });

watch([() => props.initialScale, () => props.initialTx, () => props.initialTy], () => {
  if (props.initialScale !== undefined) {
    resetView();
  }
});

defineExpose({
  setTransform,
  setScale,
  zoomStep,
  resetView,
  locateNode,
  requestRender,
  preloadAllIcons,
  canvasRef
});
</script>

<template>
  <div class="mastery-canvas-container" ref="containerRef">
    <canvas
        ref="canvasRef"
        class="mastery-canvas"
        :class="{ 'is-draggable': draggable }"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @click="onClick"
        @contextmenu="onContextMenu"
    ></canvas>

    <!-- Debug 右键菜单（传送到 body，fixed 定位避免被容器裁切） -->
    <Teleport to="body">
      <v-card
          v-if="contextMenu && isDebug"
          class="mastery-debug-menu"
          :style="menuStyle"
          @click.stop
          @contextmenu.prevent.stop="closeContextMenu"
      >
        <v-list density="compact" nav>
          <!-- 命中连线：在两节点之间插入 -->
          <v-list-item
              v-if="contextMenu.edge"
              prepend-icon="mdi-call-split"
              :title="menuEdgeLabel"
              @click="onMenuInsertOnEdge"
          ></v-list-item>

          <v-list-item
              v-if="contextMenu.node"
              :prepend-icon="'mdi-pencil-outline'"
              :title="t('mastery.debug.editNode')"
              @click="onMenuEditNode"
          ></v-list-item>

          <!-- 选中另一节点后右键节点：在二者之间插入 -->
          <v-list-item
              v-if="contextMenu.node && menuParentNode"
              prepend-icon="mdi-call-split"
              :title="menuInsertBetweenLabel"
              @click="onMenuInsertBetweenSelected"
          ></v-list-item>

          <v-list-item
              prepend-icon="mdi-plus-circle-outline"
              :title="t('mastery.debug.addNodeHere')"
              @click="onMenuAddNode"
          ></v-list-item>
          <v-list-item
              v-if="contextMenu.node && menuParentNode"
              :prepend-icon="menuParentLinked ? 'mdi-link-variant-off' : 'mdi-arrow-up-bold-outline'"
              :title="menuParentLabel"
              @click="onMenuToggleRequisite"
          ></v-list-item>
          <v-divider v-if="contextMenu.node"></v-divider>
          <v-list-item
              v-if="contextMenu.node"
              prepend-icon="mdi-delete-outline"
              :title="t('mastery.debug.deleteNode')"
              class="text-error"
              @click="onMenuDeleteNode"
          ></v-list-item>
        </v-list>
      </v-card>
    </Teleport>
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

.mastery-canvas.is-draggable {
  cursor: grab;
}

.mastery-canvas.is-draggable:active {
  cursor: grabbing;
}

.mastery-debug-menu {
  position: fixed;
  z-index: 2000;
  width: 220px;
  border-radius: 8px;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
}
</style>
