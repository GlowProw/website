<template>
  <v-row
      class="action-button"
      @mousedown="!keyboardShortcut && startAction($event, 'mouse')"
      @touchstart="startAction($event, 'touch')"
      @mouseup="endAction"
      @mouseleave="endAction"
      @touchend="endAction">
    <v-col
        cols="auto"
        ref="actionButton"
        class="position-relative"
        :class="{ 'active': isHolding }">
      <v-progress-circular
          :size="size"
          :width="2"
          :model-value="progress"
          :bg-color="lineColor"
          :color="color">
        <div class="shortcut-display">
          <v-icon v-if="!keyboardShortcut" :icon="icon" :size="iconSize"></v-icon>
          <span v-else>{{ keyboardShortcut.toUpperCase() }}</span>
        </div>
      </v-progress-circular>
    </v-col>
    <v-col cols="auto">
      <slot></slot>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 30
  },
  holdDuration: {
    type: Number,
    default: 1000
  },
  keyboardShortcut: {
    type: String,
    default: null
  },
  completeAnimationDuration: {
    type: Number,
    default: 300
  },
  lineColor: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'var(--main-color)'
  },
  icon: {
    type: String,
    default: 'mdi-mouse-left-click-outline'
  }
})

const emit = defineEmits(['action-complete'])

const isHolding = ref(false)
const progress = ref(0)
const holdTimer = ref(null)
const actionButton = ref(null)
const startTime = ref(0)
const keyAlreadyPressed = ref(false)
const activationSource = ref(null) // 'mouse', 'touch' or 'keyboard'

const iconSize = computed(() => props.size / 2)

onMounted(() => {
  if (props.keyboardShortcut && !props.disabled) {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  }
})

onBeforeUnmount(() => {
  if (props.keyboardShortcut && !props.disabled) {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }
  clearInterval(holdTimer.value)
})

const startAction = (event, source) => {
  if (isHolding.value && props.disabled) return

  activationSource.value = source

  isHolding.value = true
  progress.value = 0
  startTime.value = Date.now()

  holdTimer.value = setInterval(() => {
    const elapsed = Date.now() - startTime.value
    progress.value = Math.min((elapsed / props.holdDuration) * 100, 100)

    if (elapsed >= props.holdDuration) {
      completeAction()
    }
  }, 16)
}

const endAction = () => {
  if (!isHolding.value || activationSource.value === 'keyboard') return

  clearInterval(holdTimer.value)

  if (progress.value >= 90) {
    completeAction()
  } else {
    resetAction()
  }
}

const completeAction = () => {
  clearInterval(holdTimer.value)
  isHolding.value = false
  progress.value = 100

  setTimeout(() => {
    emit('action-complete')
    resetAction()
  }, props.completeAnimationDuration)
}

const resetAction = () => {
  isHolding.value = false
  progress.value = 0
  activationSource.value = null
}

const handleKeyDown = (e) => {
  if (!props.keyboardShortcut ||
      e.key.toLowerCase() !== props.keyboardShortcut.toLowerCase() ||
      keyAlreadyPressed.value) {
    return
  }

  e.preventDefault()
  keyAlreadyPressed.value = true
  activationSource.value = 'keyboard'
  startAction(null, 'keyboard')
  actionButton.value?.$el.focus()
}

const handleKeyUp = (e) => {
  if (props.keyboardShortcut && e.key.toLowerCase() === props.keyboardShortcut.toLowerCase()) {
    keyAlreadyPressed.value = false

    if (activationSource.value === 'keyboard') {
      if (progress.value >= 90) {
        completeAction()
      } else {
        resetAction()
      }
    }
  }
}
</script>

<style scoped>
.action-button {
  position: relative;
  transition: all 0.3s ease;
  user-select: none;
  display: inline-flex;
  cursor: pointer !important;
}

.action-button.active {
  transform: scale(0.95);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.shortcut-display {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-weight: bold;
  font-size: calc(v-bind(size) / 2.5);
}

.action-button :deep(.v-progress-circular) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.action-button :deep(.v-progress-circular__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
