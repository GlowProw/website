<template>
  <div class="canvas-container overlapping-circles" ref="container">
    <div class="canvas-container overlapping-pattern">
      <div
          class="canvas"
          ref="canvas"
          :style="{
        transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
        width: `${canvasWidth}px`,
        height: `${contentHeight}px`,
        'pointer-events': isDragging ? 'none' : 'auto'
      }"
          @wheel.prevent="handleWheel"
          @mousedown="startDrag">
        <div class="content-wrapper content-layer"
             :style="{ pointerEvents: 'auto' }"
             ref="contentWrapper">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AutoHeightCanvas',
  props: {
    canvasWidth: {
      type: Number,
      default: 1200
    },
    minScale: {
      type: Number,
      default: 0.1
    },
    maxScale: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      scale: 1,
      position: {x: 0, y: 0},
      contentHeight: 600, // 初始高度，会被更新
      isDragging: false,
      startPos: {x: 0, y: 0},
      resizeObserver: null
    }
  },
  mounted() {
    this.initCanvas()
    window.addEventListener('mousemove', this.handleDrag)
    window.addEventListener('mouseup', this.stopDrag)
  },
  beforeDestroy() {
    window.removeEventListener('mousemove', this.handleDrag)
    window.removeEventListener('mouseup', this.stopDrag)
    if (this.resizeObserver) this.resizeObserver.disconnect()
  },
  methods: {
    initCanvas() {
      // 初始居中
      this.centerCanvas()

      // 监听内容高度变化
      this.$nextTick(() => {
        this.updateContentHeight()
        this.setupResizeObserver()
      })
    },

    // 使用 ResizeObserver 监听内容高度变化
    setupResizeObserver() {
      if (typeof ResizeObserver === 'undefined') return

      this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          this.contentHeight = entry.contentRect.height
        }
      })

      this.resizeObserver.observe(this.$refs.contentWrapper)
    },

    // 更新内容高度
    updateContentHeight() {
      if (this.$refs.contentWrapper) {
        this.contentHeight = this.$refs.contentWrapper.offsetHeight
      }
    },

    // 初始居中
    centerCanvas() {
      const container = this.$refs.container
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      this.position = {
        x: (containerWidth - this.canvasWidth * this.scale) / 2 / this.scale,
        y: (containerHeight - this.contentHeight * this.scale) / 2 / this.scale
      }
    },

    // 拖拽相关方法（保持不变）
    startDrag(e) {
      if (e.button !== 0) return
      this.isDragging = true
      this.startPos = {
        x: e.clientX - this.position.x,
        y: e.clientY - this.position.y
      }
      this.$refs.canvas.style.cursor = 'grabbing'
    },

    handleDrag(e) {
      if (!this.isDragging) return

      this.position.x = e.clientX - this.startPos.x
      this.position.y = e.clientY - this.startPos.y

      this.updateBackgroundPosition((-this.position.x + 100) * .5, (-this.position.y + 100) * .5)
    },

    stopDrag() {
      this.isDragging = false
      if (this.$refs.canvas && this.$refs.canvas.style.cursor)
        this.$refs.canvas.style.cursor = 'grab'
    },

    // 缩放处理
    handleWheel(e) {
      const delta = -e.deltaY
      const scaleFactor = 0.001
      const newScale = this.scale * (1 + delta * scaleFactor)

      this.scale = Math.max(
          this.minScale,
          Math.min(this.maxScale, newScale)
      )

      // 缩放时保持鼠标位置为中心
      const container = this.$refs.container
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      this.position.x = mouseX / this.scale - (mouseX - this.position.x * this.scale) / this.scale
      this.position.y = mouseY / this.scale - (mouseY - this.position.y * this.scale) / this.scale
    },

    // 重置视图
    resetView() {
      this.scale = 1
      this.centerCanvas()
    },

    // 动态背景
    updateBackgroundPosition(x, y) {
      const elementCircles = document.querySelector('.overlapping-circles');

      elementCircles.style.transition = '--offset-x 0.3s ease, --offset-y 0.3s ease';
      elementCircles.style.setProperty('--offset-x', `${x}px`);
      elementCircles.style.setProperty('--offset-y', `${y}px`);
    }
  }
}
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  cursor: grab;
  pointer-events: none;
}

.canvas:active {
  cursor: grabbing;
}

.content-wrapper {
  width: 100%;
  display: inline-block;
}

.content-layer {
  pointer-events: auto;
}

.overlapping-pattern {
  --offset-x: 0px;
  --offset-y: 0px;
  --size: 100px;
  --color: rgba(255, 255, 255, 0.05);

  background-image: linear-gradient(to right,
  transparent calc(var(--size) + 0px),
  var(--color) calc(var(--size) + 1px),
  var(--color) calc(var(--size) + 2px),
  transparent calc(var(--size) + 3px)),
  linear-gradient(to bottom,
      transparent calc(var(--size) + 0px),
      var(--color) calc(var(--size) + 1px),
      var(--color) calc(var(--size) + 2px),
      transparent calc(var(--size) + 3px));

  background-size: 236px 236px;
  background-repeat: repeat;
  background-position: var(--offset-x) var(--offset-y);
}

.overlapping-circles {
  --offset-x: 0px;
  --offset-y: 0px;
  --size: 212px;
  --color: rgba(255, 216, 2, 0.1);

  background-image: radial-gradient(
      circle at calc(50%) calc(50%),
      transparent calc(var(--size) + 0px),
      var(--color) calc(var(--size) + 1px),
      transparent calc(var(--size) + 3px)
  );

  background-size: calc(var(--size) + 210px) calc(var(--size) + 210px);
  background-repeat: repeat;
  background-position: var(--offset-x) var(--offset-y);
}
</style>
