<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, useId, watch} from 'vue';

interface StreamItem {
  laneY: number;
  length: number;
  speedFactor: number;
  strokeWidth: number;
  totalSpan: number;
  progress: number;
  amplitude: number;
  wavelength: number;
  waveSpeed: number;
  phase: number;
  pathElement: SVGPathElement;
}

const props = withDefaults(defineProps<{
  // 气流流光颜色
  color?: string;
  // 整体基础透明度
  opacity?: number;
  // 动态速度乘数
  speed?: number;
  // 画布背景色
  background?: string;
  // 气流轨迹数量
  pathCount?: number;
  // 画布宽度
  width?: number;
  // 画布高度
  height?: number;
  // 基础笔触粗细
  strokeWidth?: number;
}>(), {
  color: '#ffffff',
  opacity: 0.8,
  speed: 1.0,
  background: 'transparent',
  pathCount: 4,
  width: 150,
  height: 60,
  strokeWidth: 1.8
});

// 组件唯一渐变滤镜标识
const gradientId = useId();

// SVG 容器与气流分组引用
const svgElement = ref<SVGSVGElement | null>(null);
const windPathsGroup = ref<SVGGElement | null>(null);

// 动画帧句柄与时间戳记录
let animationFrameId: number | null = null;
let lastTimestamp = 0;
let accumulatedTime = 0;

// 当前活跃的气流流线集合
let activeStreams: StreamItem[] = [];

/**
 * 初始化所有气流的几何参数与 DOM 节点
 */
const initStreams = () => {
  if (!windPathsGroup.value) return;

  // 清空现有的所有路径元素
  while (windPathsGroup.value.firstChild) {
    windPathsGroup.value.removeChild(windPathsGroup.value.firstChild);
  }

  activeStreams = [];
  const count = Math.max(1, props.pathCount);
  const baseSpeed = 75;

  for (let i = 0; i < count; i++) {
    // 气流线段长度与纵向车道分布
    const length = 46 + (i % 3) * 14;
    const laneY = 14 + (i / Math.max(1, count - 1)) * (props.height - 28);
    // 超出可视区域前后各留有充足边距，确保出入画布完全在视线外
    const totalSpan = props.width + length + 80;
    // 错落有致的初始进场进度
    const progress = (i / count) * totalSpan;
    const speedFactor = 0.85 + ((i * 3) % 5) * 0.12;
    const streamStrokeWidth = props.strokeWidth * (0.8 + (i % 2) * 0.4);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', `url(#${gradientId})`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', streamStrokeWidth.toFixed(1));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    windPathsGroup.value.appendChild(path);

    activeStreams.push({
      laneY,
      length,
      speedFactor,
      strokeWidth: streamStrokeWidth,
      totalSpan,
      progress,
      amplitude: 3.2 + (i % 3) * 0.8,
      wavelength: 0.045 + (i % 2) * 0.015,
      waveSpeed: 3.2 + i * 0.6,
      phase: i * 1.6,
      pathElement: path
    });
  }
};

/**
 * 逐帧计算并更新气流流线平滑曲线
 * @param now 当前时间戳
 */
const updateStreams = (now: number) => {
  if (!lastTimestamp) lastTimestamp = now;
  // 限制最大步长，避免页面失焦切回后发生瞬时暴冲
  const dt = Math.min((now - lastTimestamp) * 0.001, 0.08);
  lastTimestamp = now;
  accumulatedTime += dt;

  const baseSpeed = 75;
  const currentSpeed = Math.max(0.1, props.speed);

  for (let i = 0; i < activeStreams.length; i++) {
    const stream = activeStreams[i];

    // 沿流动方向推进进度，无缝模运算闭环
    stream.progress = (stream.progress + baseSpeed * stream.speedFactor * currentSpeed * dt) % stream.totalSpan;

    // 起点位于画布左侧外部，保证出现时完全无痕
    const xHead = stream.progress - 40;
    const xTail = xHead - stream.length;

    // 计算流线中心点距离边缘的淡入淡出衰减，消除切出边界的突兀感
    const midX = (xHead + xTail) * 0.5;
    let fade = 1.0;
    const edgeMargin = 25;
    if (midX < edgeMargin) {
      fade = Math.max(0, midX / edgeMargin);
    } else if (midX > props.width - edgeMargin) {
      fade = Math.max(0, (props.width - midX) / edgeMargin);
    }
    // 缓动曲线衰减
    fade = fade * fade * (3 - 2 * fade);
    stream.pathElement.setAttribute('opacity', (fade * props.opacity).toFixed(3));

    // 生成流线连续点序列
    const samples = 14;
    const points: {x: number; y: number}[] = [];

    for (let j = 0; j <= samples; j++) {
      const u = j / samples;
      const x = xTail + u * stream.length;
      // 两端收缩的包络振幅，呈现类似空气动力学的流线锥度
      const taper = Math.sin(Math.PI * u);
      // 行波计算：波动相位随风速前行，与气流流动感自然呼应
      const wave = Math.sin(x * stream.wavelength - accumulatedTime * stream.waveSpeed * Math.sqrt(currentSpeed) + stream.phase);
      const y = stream.laneY + stream.amplitude * taper * wave;
      points.push({x, y});
    }

    // 利用二次贝塞尔平滑连接相邻分段，消除折线棱角
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let j = 1; j < points.length - 1; j++) {
      const xc = (points[j].x + points[j + 1].x) * 0.5;
      const yc = (points[j].y + points[j + 1].y) * 0.5;
      d += ` Q ${points[j].x.toFixed(1)} ${points[j].y.toFixed(1)} ${xc.toFixed(1)} ${yc.toFixed(1)}`;
    }
    d += ` L ${points[points.length - 1].x.toFixed(1)} ${points[points.length - 1].y.toFixed(1)}`;

    stream.pathElement.setAttribute('d', d);
  }

  animationFrameId = requestAnimationFrame(updateStreams);
};

/**
 * 启动动画循环
 */
const startAnimation = () => {
  stopAnimation();
  initStreams();
  lastTimestamp = 0;
  animationFrameId = requestAnimationFrame(updateStreams);
};

/**
 * 停止当前动画
 */
const stopAnimation = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

watch(() => props.pathCount, () => {
  initStreams();
});

watch(() => [props.width, props.height], () => {
  initStreams();
});

onMounted(() => {
  startAnimation();
});

onBeforeUnmount(() => {
  stopAnimation();
});
</script>

<template>
  <div class="wind-flow-container">
    <svg
        ref="svgElement"
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        class="wind-flow-svg"
        :style="{ backgroundColor: background }">
      <defs>
        <linearGradient
            :id="gradientId"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
          <stop offset="0%" :stop-color="color" stop-opacity="0"/>
          <stop offset="25%" :stop-color="color" :stop-opacity="opacity"/>
          <stop offset="75%" :stop-color="color" :stop-opacity="opacity"/>
          <stop offset="100%" :stop-color="color" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <g ref="windPathsGroup"></g>
    </svg>
  </div>
</template>

<style scoped lang="less">
.wind-flow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  pointer-events: none;
  user-select: none;
}

.wind-flow-svg {
  display: block;
  overflow: visible;
}
</style>
