<template>
  <v-row
      class="action-button"
      @mousedown="!activeShortcut && startAction($event, 'mouse')"
      @touchstart.passive="startAction($event, 'touch')"
      @mouseup="endAction"
      @mouseleave="endAction"
      @touchend.passive="endAction">
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
          <v-icon v-if="!activeShortcut" :icon="icon" :size="iconSize"></v-icon>
          <span v-else>{{ activeShortcut.toUpperCase() }}</span>
        </div>
      </v-progress-circular>
    </v-col>
    <v-col cols="auto">
      <slot></slot>
    </v-col>
  </v-row>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useHotkeysStore } from '~/stores/hotkeysStore'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: [Number, String],
    default: 30
  },
  holdDuration: {
    type: Number,
    default: 1000
  },
  hotkeyAction: {
    type: String,
    default: null
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
const hotkeysStore = useHotkeysStore()

const isHolding = ref(false)
const progress = ref(0)
const holdTimer = ref<any>(null)
const actionButton = ref<any>(null)
const startTime = ref(0)
const keyAlreadyPressed = ref(false)
const activationSource = ref<string | null>(null)

const iconSize = computed(() => Number(props.size) / 2)

/**
 * 当前生效的快捷键（优先使用全局自定义绑定的动作键，其次回退到 props 默认键）
 */
const activeShortcut = computed<string | null>(() => {
  if (props.hotkeyAction) {
    const custom = hotkeysStore.getKey(props.hotkeyAction)
    if (custom) return custom
  }
  return props.keyboardShortcut || null
})

/**
 * 当前动作的触发方式，未绑定动作时按按住处理
 */
const activeMode = computed<'press' | 'hold'>(() => {
  if (!props.hotkeyAction) return 'hold'
  return hotkeysStore.getMode(props.hotkeyAction)
})

/**
 * 启动监听与清理键盘事件
 */
const updateKeyboardListeners = (enabled: boolean) => {
  if (typeof window === 'undefined') return
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (enabled && activeShortcut.value && !props.disabled) {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  }
}

watch(
  [activeShortcut, () => props.disabled],
  ([shortcut, disabled]) => {
    updateKeyboardListeners(!disabled && !!shortcut)
  }
)

onMounted(() => {
  updateKeyboardListeners(!props.disabled && !!activeShortcut.value)
})

onBeforeUnmount(() => {
  updateKeyboardListeners(false)
  if (holdTimer.value) {
    clearInterval(holdTimer.value)
  }
})

/**
 * 开始按钮长按或按键动作
 * @param event 触发事件
 * @param source 触发源（mouse / touch / keyboard）
 */
const startAction = (event: any, source: string) => {
  if (isHolding.value && props.disabled) return

  activationSource.value = source
  isHolding.value = true
  progress.value = 0
  startTime.value = Date.now()

  // 按下即触发模式不进入蓄力进度
  if (activeMode.value === 'press') {
    completeAction()
    return
  }

  holdTimer.value = setInterval(() => {
    const elapsed = Date.now() - startTime.value
    progress.value = Math.min((elapsed / props.holdDuration) * 100, 100)

    if (elapsed >= props.holdDuration) {
      completeAction()
    }
  }, 16)
}

/**
 * 结束长按动作
 */
const endAction = () => {
  if (!isHolding.value || activationSource.value === 'keyboard') return

  clearInterval(holdTimer.value)

  if (progress.value >= 90) {
    completeAction()
  } else {
    resetAction()
  }
}

/**
 * 完成动作并派发事件
 */
const completeAction = () => {
  clearInterval(holdTimer.value)
  isHolding.value = false
  progress.value = 100

  setTimeout(() => {
    emit('action-complete')
    resetAction()
  }, props.completeAnimationDuration)
}

/**
 * 重置状态
 */
const resetAction = () => {
  isHolding.value = false
  progress.value = 0
  activationSource.value = null
}

/**
 * 校验键盘事件是否与目标快捷键或组合键相匹配
 * @param e 键盘事件
 * @param shortcut 目标按键字符串（支持单键与组合键，如 's', 'cmd+k', 'ctrl+s'）
 */
const matchShortcutEvent = (e: KeyboardEvent, shortcut: string): boolean => {
  if (!shortcut) return false
  const target = shortcut.toLowerCase().trim()
  const parts = target.split('+').map(p => p.trim())
  const mainKey = parts[parts.length - 1]

  const needCtrl = parts.includes('ctrl')
  const needMeta = parts.includes('cmd') || parts.includes('meta') || parts.includes('win')
  const needAlt = parts.includes('alt') || parts.includes('option')
  const needShift = parts.includes('shift')

  if (needCtrl && !e.ctrlKey) return false
  if (needMeta && !e.metaKey) return false
  if (needAlt && !e.altKey) return false
  if (needShift && !e.shiftKey) return false

  // 若无修饰键要求但按下了 ctrl/meta/alt，避免输入组合键时误触发单键
  if (!needCtrl && !needMeta && !needAlt && (e.ctrlKey || e.metaKey || e.altKey)) {
    return false
  }

  const pressedKey = e.key.toLowerCase()
  if (mainKey === 'space') return pressedKey === ' '
  return pressedKey === mainKey
}

/**
 * 键盘按下处理
 * @param e 键盘事件
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (!activeShortcut.value || keyAlreadyPressed.value) return

  // 避免在文本输入框中打字时误触发按钮
  const target = e.target as HTMLElement | null
  if (target) {
    const tag = target.tagName.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || target.isContentEditable) {
      return
    }
  }

  if (!matchShortcutEvent(e, activeShortcut.value)) {
    return
  }

  // 仅响应可见的按钮，避免未展开的悬浮卡片内实例同时被触发
  const el = actionButton.value?.$el as HTMLElement | undefined
  if (el && el.getClientRects().length === 0) {
    return
  }

  e.preventDefault()
  keyAlreadyPressed.value = true
  activationSource.value = 'keyboard'

  // 按下即触发模式直接完成，不进入长按
  if (activeMode.value === 'press') {
    completeAction()
    return
  }

  startAction(null, 'keyboard')
  actionButton.value?.$el?.focus?.()
}

/**
 * 键盘抬起处理
 * @param e 键盘事件
 */
const handleKeyUp = (e: KeyboardEvent) => {
  if (activeShortcut.value && matchShortcutEvent(e, activeShortcut.value)) {
    keyAlreadyPressed.value = false

    if (activeMode.value === 'press') {
      return
    }

    if (activationSource.value === 'keyboard') {
      if (progress.value >= 90) {
        completeAction()
      } else {
        resetAction()
      }
    }
  }
}

defineOptions({
  name: 'BtnWidget'
})
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
