<template>
  <Teleport to="body">
    <Transition name="ctx-menu">
      <v-card
          border
          v-if="visible"
          ref="menuRef"
          elevation="35"
          class="map-ctx-menu py-2"
          :style="{ top: safeY + 'px', left: safeX + 'px' }"
          @click.stop
          @contextmenu.prevent>
        <template v-for="(item, i) in items" :key="i">
          <div v-if="item.type === 'divider'" class="ctx-divider" />
          <button
              v-else
              class="ctx-item"
              :class="{ 'ctx-item--disabled': item.disabled, 'ctx-item--danger': item.danger }"
              :disabled="item.disabled"
              @click="onItemClick(item)">
            <span v-if="item.icon" class="ctx-icon">{{ item.icon }}</span>
            <span class="ctx-label">{{ item.label }}</span>
            <span v-if="item.badge" class="ctx-badge">{{ item.badge }}</span>
          </button>
        </template>
      </v-card>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';

export interface ContextMenuItem {
  type?: 'item' | 'divider';
  label?: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
  danger?: boolean;
  action?: () => void;
}

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const menuRef = ref<HTMLElement | null>(null);
const safeX = ref(props.x);
const safeY = ref(props.y);

/** 获取真正的 DOM 元素（兼容 HTML 元素与 Component $el） */
const getMenuEl = (): HTMLElement | null => {
  if (!menuRef.value) return null;
  return (menuRef.value as any).$el || menuRef.value;
};

/** 保证菜单不超出视口 */
const adjustPosition = async () => {
  await nextTick();
  const el = getMenuEl();
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  safeX.value = props.x + rect.width > vw ? props.x - rect.width : props.x;
  safeY.value = props.y + rect.height > vh ? props.y - rect.height : props.y;
};

watch(() => [props.visible, props.x, props.y], async ([vis]) => {
  safeX.value = props.x;
  safeY.value = props.y;
  if (vis) {
    await adjustPosition();
  }
});

const onItemClick = (item: ContextMenuItem) => {
  if (item.disabled) return;
  item.action?.();
  emit('close');
};

const onOutsideClick = (e: MouseEvent | TouchEvent) => {
  const el = getMenuEl();
  if (!el) return;
  const target = e.target as Node;
  if (!el.contains(target)) {
    emit('close');
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close');
};

watch(() => props.visible, (vis) => {
  if (vis) {
    setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
      document.addEventListener('touchstart', onOutsideClick);
      document.addEventListener('keydown', onKeydown);
    }, 0);
  } else {
    document.removeEventListener('click', onOutsideClick);
    document.removeEventListener('touchstart', onOutsideClick);
    document.removeEventListener('keydown', onKeydown);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick);
  document.removeEventListener('touchstart', onOutsideClick);
  document.removeEventListener('keydown', onKeydown);
});

defineOptions({ name: 'MapContextMenu' });
</script>

<style scoped>
.map-ctx-menu {
  position: fixed;
  z-index: 9999;
  min-width: 210px;
  user-select: none;
  pointer-events: all;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(230, 235, 245, 0.92);
  font-size: 13.5px;
  font-family: inherit;
  text-align: left;
  transition: background 0.13s ease, color 0.13s ease;
  white-space: nowrap;
}

.ctx-item:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.ctx-item:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
}

.ctx-item--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.ctx-item--danger {
  color: rgba(255, 100, 90, 0.88);
}

.ctx-item--danger:hover:not(:disabled) {
  background: rgba(255, 60, 50, 0.12);
  color: #ff6b6b;
}

.ctx-icon {
  font-size: 16px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
  opacity: 0.85;
}

.ctx-label {
  flex: 1;
}

.ctx-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(200, 210, 230, 0.7);
}

.ctx-divider {
  margin: 5px 10px;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

/* 动画 */
.ctx-menu-enter-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.ctx-menu-leave-active {
  transition: opacity 0.1s ease, transform 0.08s ease;
}
.ctx-menu-enter-from {
  opacity: 0;
  transform: scale(0.94) translateY(-4px);
}
.ctx-menu-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
