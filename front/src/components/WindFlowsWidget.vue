<template>
  <div class="wind-flow-container">
    <svg
        ref="svgElement"
        width="150"
        height="50"
        class="wind-flow-svg"
        :style="{ backgroundColor: background }"
    >
      <defs>
        <linearGradient
            id="windGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
          <stop offset="0%" :stop-color="color" stop-opacity="0" />
          <stop offset="50%" :stop-color="color" :stop-opacity="opacity" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g ref="windPaths"></g>
    </svg>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

export default {
  name: 'WindFlow',
  props: {
    color: {
      type: String,
      default: '#fff'
    },
    opacity: {
      type: Number,
      default: 0.8,
      validator: value => value >= 0 && value <= 1
    },
    speed: {
      type: Number,
      default: 1.0,
      validator: value => value > 0
    },
    background: {
      type: String,
      default: 'transparent'
    }
  },
  setup(props) {
    const svgElement = ref(null);
    const windPaths = ref(null);
    const paths = ref([]);
    let animationFrameId = null;

    // 小尺寸画布专用参数
    const smallCanvasConfig = {
      pathCount: 3,
      strokeWidth: 2,
      amplitude: 12,
      frequency: 0.1,
      segments: 15
    };

    // 初始化路径
    const initPaths = () => {
      // 清除现有路径
      while (windPaths.value?.firstChild) {
        windPaths.value.removeChild(windPaths.value.firstChild);
      }

      paths.value = [];

      // 创建新路径
      for (let i = 0; i < smallCanvasConfig.pathCount; i++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("stroke", "url(#windGradient)");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-width", (i + 1) * smallCanvasConfig.strokeWidth);
        path.setAttribute("stroke-linecap", "round");
        paths.value.push(path);
        windPaths.value.appendChild(path);
      }
    };

    // 更新路径数据
    const updatePaths = () => {
      if (!svgElement.value) return;

      const width = svgElement.value.width.baseVal.value;
      const height = svgElement.value.height.baseVal.value;
      const time = Date.now() * 0.001 * props.speed;

      paths.value.forEach((path, index) => {
        // 调整偏移量计算以适应小画布
        const offset = (time * (5 + index * 2)) % (width * 1.5) - width * 0.5;

        let d = `M ${-width * 0.5 + offset} ${height / 2}`;

        for (let i = 0; i <= smallCanvasConfig.segments; i++) {
          const x = i * (width * 1.5 / smallCanvasConfig.segments) - width * 0.5 + offset;
          const y = height / 2 +
              Math.sin(i * smallCanvasConfig.frequency * 5 + time * 2) * smallCanvasConfig.amplitude +
              Math.sin(i * smallCanvasConfig.frequency * 3 + time) * smallCanvasConfig.amplitude * 0.3;

          if (i === 0) {
            d += ` M ${x} ${y}`;
          } else {
            d += ` L ${x} ${y}`;
          }
        }

        path.setAttribute("d", d);
      });

      animationFrameId = requestAnimationFrame(updatePaths);
    };

    // 启动动画
    const startAnimation = () => {
      stopAnimation();
      initPaths();
      updatePaths();
    };

    // 停止动画
    const stopAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    onMounted(() => {
      startAnimation();
    });

    onBeforeUnmount(() => {
      stopAnimation();
    });

    return {
      svgElement,
      windPaths
    };
  }
};
</script>

<style scoped>
.wind-flow-container {
  display: inline-block;
  overflow: hidden;
}

.wind-flow-svg {
  display: block;
}
</style>
