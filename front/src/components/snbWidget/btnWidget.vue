<template>
  <div class="long-press-button-container">
    <svg :width="size" :height="size" class="progress-ring">
      <circle
          class="progress-ring-track"
          :stroke="trackColor"
          :stroke-width="strokeWidth"
          :r="radius"
          :cx="center"
          :cy="center"
      />
      <circle
          class="progress-ring-bar"
          :stroke="progressColor"
          :stroke-width="strokeWidth"
          :r="radius"
          :cx="center"
          :cy="center"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
          transform="rotate(-90)"
          :transform-origin="`${center} ${center}`"
      />
    </svg>

    <button
        class="long-press-button"
        @mousedown="startPress"
        @mouseup="endPress"
        @mouseleave="cancelPress"
        @touchstart.prevent="startPress"
        @touchend="endPress"
        @touchcancel="cancelPress"
        :disabled="isProcessing"
    >
      <slot>{{ buttonText }}</slot>
    </button>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, onUnmounted, ref} from 'vue';

export default defineComponent({
  name: 'LongPressButton',
  props: {
    /**
     * @description 按钮和进度条的整体尺寸 (px)
     */
    size: {
      type: Number,
      default: 40,
    },
    /**
     * @description 进度条的粗细 (px)
     */
    strokeWidth: {
      type: Number,
      default: 5,
    },
    /**
     * @description 进度条背景色
     */
    trackColor: {
      type: String,
      default: '#e0e0e0',
    },
    /**
     * @description 进度条颜色
     */
    progressColor: {
      type: String,
      default: '#4CAF50',
    },
    /**
     * @description 长按持续时间 (毫秒)
     */
    duration: {
      type: Number,
      default: 2000, // 默认 2 秒
    },
    /**
     * @description 按钮内文本，如果使用 slot 则无效
     */
    buttonText: {
      type: String,
      default: '按住',
    }
  },
  emits: ['long-press-complete', 'press-cancelled'],
  setup(props, {emit}) {
    const isPressing = ref(false);
    const progress = ref(0); // 0 到 100
    let pressStartTime: number | null = null;
    let animationFrameId: number | null = null;
    let pressTimeoutId: number | null = null;

    const radius = computed(() => (props.size / 2) - (props.strokeWidth / 2));
    const center = computed(() => props.size / 2);
    const circumference = computed(() => 2 * Math.PI * radius.value);
    const progressOffset = computed(() => circumference.value * (1 - progress.value / 100));

    const isProcessing = computed(() => progress.value > 0 && progress.value < 100);

    const updateProgress = () => {
      if (!isPressing.value || !pressStartTime) {
        return;
      }

      const elapsed = Date.now() - pressStartTime;
      const newProgress = Math.min(100, (elapsed / props.duration) * 100);
      progress.value = newProgress;

      if (newProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // 进度完成
        isPressing.value = false;
        emit('long-press-complete');
        resetState();
      }
    };

    const startPress = () => {
      if (isProcessing.value) return; // 避免重复触发

      isPressing.value = true;
      pressStartTime = Date.now();
      progress.value = 0; // 重置进度
      animationFrameId = requestAnimationFrame(updateProgress);

      // 设置一个超时，确保在动画结束之前触发完整回调 (以防动画帧丢失)
      pressTimeoutId = window.setTimeout(() => {
        if (isPressing.value && progress.value < 100) {
          progress.value = 100; // 强制设置为100%
          emit('long-press-complete');
          resetState();
        }
      }, props.duration + 50); // 稍微加一点缓冲时间
    };

    const resetState = () => {
      isPressing.value = false;
      progress.value = 0;
      pressStartTime = null;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (pressTimeoutId) {
        clearTimeout(pressTimeoutId);
        pressTimeoutId = null;
      }
    };

    const endPress = () => {
      if (isPressing.value && progress.value < 100) {
        // 在完成前松开，取消
        cancelPress();
      } else if (isPressing.value && progress.value >= 100) {
        // 完成后松开，直接重置
        resetState();
      } else {
        resetState(); // 确保重置状态
      }
    };

    const cancelPress = () => {
      if (isPressing.value && progress.value < 100) {
        emit('press-cancelled');
      }
      resetState();
    };

    onUnmounted(() => {
      // 组件卸载时清除计时器和动画帧
      resetState();
    });

    return {
      isPressing,
      progress,
      radius,
      center,
      circumference,
      progressOffset,
      isProcessing,
      startPress,
      endPress,
      cancelPress,
    };
  },
});
</script>

<style scoped>
.long-press-button-container {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
}

.long-press-button {
  width: calc(v-bind(size) * 1px - v-bind(strokeWidth) * 2px - 8px); /* 按钮比容器小一点 */
  height: calc(v-bind(size) * 1px - v-bind(strokeWidth) * 2px - 8px);
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  font-size: 16px;
  border: none;
  cursor: pointer;
  outline: none;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.1s ease; /* 增加点击反馈 */
}

.long-press-button:hover {
  background-color: #0056b3;
}

.long-press-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateY(-180deg); /* 翻转使进度条顺时针增长 */
}

.progress-ring-track,
.progress-ring-bar {
  fill: none;
  transition: stroke-dashoffset 0.1s linear; /* 平滑过渡 */
}

.progress-ring-track {
  opacity: 0.3;
}
</style>
