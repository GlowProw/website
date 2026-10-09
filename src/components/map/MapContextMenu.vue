<template>
  <Teleport to="body">
    <Transition name="ctx-menu">
      <v-card
          v-if="visible"
          ref="menuRef"
          border
          rounded="lg"
          elevation="24"
          class="map-ctx-menu pa-1"
          :style="{ top: safeY + 'px', left: safeX + 'px' }"
          @click.stop
          @contextmenu.prevent>
        <v-list density="compact" min-width="260" class="pa-0">
          <template v-for="(item, i) in items" :key="i">
            <v-divider v-if="item.type === 'divider'" class="my-1" />

            <!-- 二级菜单父项：与 HeaderAccount 语言切换菜单同款悬停 v-menu -->
            <v-menu
                v-else-if="item.children && item.children.length"
                :model-value="subIndex === i"
                open-on-hover
                :open-on-click="false"
                :location="subLocation"
                :close-on-content-click="true"
                @update:model-value="(v) => onSubOpenChange(i, v)">
              <template v-slot:activator="{ props: subProps }">
                <v-list-item
                    v-bind="subProps"
                    :disabled="item.disabled"
                    :color="itemColor(item)"
                    rounded="lg"
                    density="compact">
                  <template v-slot:prepend>
                    <v-icon size="18">{{ item.icon }}</v-icon>
                  </template>
                  <v-list-item-title class="ctx-title">{{ item.label }}</v-list-item-title>
                  <template v-slot:append>
                    <span v-if="item.badge" class="ctx-badge">{{ item.badge }}</span>
                    <v-icon icon="mdi-chevron-right" size="small" class="opacity-60"></v-icon>
                  </template>
                </v-list-item>
              </template>

              <v-list density="compact" min-width="210" class="pa-1" border rounded="lg">
                <template v-for="(child, ci) in item.children" :key="ci">
                  <v-divider v-if="child.type === 'divider'" class="my-1" />
                  <v-list-item
                      v-else
                      :disabled="child.disabled"
                      :color="itemColor(child)"
                      rounded="lg"
                      density="compact"
                      @click="onItemClick(child)">
                    <template v-slot:prepend>
                      <v-icon size="18">{{ child.icon }}</v-icon>
                    </template>
                    <v-list-item-title class="ctx-title">{{ child.label }}</v-list-item-title>
                    <template v-slot:append v-if="child.badge">
                      <span class="ctx-badge">{{ child.badge }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-list>
            </v-menu>

            <!-- 普通菜单项 -->
            <v-list-item
                v-else
                :disabled="item.disabled"
                :color="itemColor(item)"
                rounded="lg"
                density="compact"
                @click="onItemClick(item)">
              <template v-slot:prepend>
                <v-icon size="18">{{ item.icon }}</v-icon>
              </template>
              <v-list-item-title class="ctx-title">{{ item.label }}</v-list-item-title>
              <template v-slot:append v-if="item.badge">
                <span class="ctx-badge">{{ item.badge }}</span>
              </template>
            </v-list-item>
          </template>
        </v-list>
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
  color?: 'default' | 'amber';
  action?: () => void;
  children?: ContextMenuItem[];
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

const menuRef = ref<any>(null);
const safeX = ref(props.x);
const safeY = ref(props.y);

// ───────────────────────────── 子菜单状态 ─────────────────────────────

const subIndex = ref(-1);
/** 子菜单展开方向（靠右展开 right top，空间不足翻左侧 left top） */
const subLocation = ref<'right top' | 'left top'>('right top');

const itemColor = (item: ContextMenuItem): string | undefined => {
  if (item.disabled) return undefined;
  if (item.danger) return 'error';
  if (item.color === 'amber') return 'amber';
  return undefined;
};

/** v-menu 受控开关：禁用项不允许展开；展开时按视口剩余空间决定左右方向 */
const onSubOpenChange = (i: number, open: boolean): void => {
  if (!open) {
    subIndex.value = -1;
    return;
  }
  const item = props.items[i];
  if (item?.disabled || !item.children || item.children.length === 0) return;
  subLocation.value = props.x + 220 + 210 > window.innerWidth ? 'left top' : 'right top';
  subIndex.value = i;
};

/** 获取真正的 DOM 元素（兼容 HTML 元素与 Component $el） */
const getEl = (refInst: any): HTMLElement | null => {
  if (!refInst) return null;
  return refInst.$el || refInst;
};

const getMenuEl = (): HTMLElement | null => getEl(menuRef.value);

/** 保证菜单不超出视口 */
const adjustPosition = async (): Promise<void> => {
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
  subIndex.value = -1;
  if (vis) {
    await adjustPosition();
  }
});

const onItemClick = (item: ContextMenuItem): void => {
  if (item.disabled) return;
  item.action?.();
  emit('close');
};

const onOutsideClick = (e: MouseEvent | TouchEvent): void => {
  const target = e.target as Node;
  const menuEl = getMenuEl();
  // 子菜单通过 v-menu 传送至 body，.v-overlay__content 内的点击不算外部点击
  const inSubOverlay = (target as HTMLElement).closest?.('.v-overlay__content');
  if (!menuEl?.contains(target) && !inSubOverlay) {
    emit('close');
  }
};

const onKeydown = (e: KeyboardEvent): void => {
  if (e.key !== 'Escape') return;
  // 子菜单展开时先收子菜单（v-menu 自身也会关闭），再次按 Esc 才关整个菜单
  if (subIndex.value >= 0) {
    subIndex.value = -1;
    return;
  }
  emit('close');
};

watch(() => props.visible, (vis) => {
  if (vis) {
    setTimeout(() => {
      document.addEventListener('mousedown', onOutsideClick);
      document.addEventListener('touchstart', onOutsideClick);
      document.addEventListener('keydown', onKeydown);
    }, 0);
  } else {
    document.removeEventListener('mousedown', onOutsideClick);
    document.removeEventListener('touchstart', onOutsideClick);
    document.removeEventListener('keydown', onKeydown);
    subIndex.value = -1;
  }
});

onUnmounted(() => {
  document.removeEventListener('mousedown', onOutsideClick);
  document.removeEventListener('touchstart', onOutsideClick);
  document.removeEventListener('keydown', onKeydown);
});

defineOptions({ name: 'MapContextMenu' });
</script>

<style scoped>
.map-ctx-menu {
  position: fixed;
  z-index: 9999;
  user-select: none;
  pointer-events: all;
}

.ctx-title {
  font-size: 13.5px;
  white-space: nowrap;
}

.ctx-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

/* 菜单整体出现动画 */
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
