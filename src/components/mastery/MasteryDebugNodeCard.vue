<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {MasteryCategories, MasteryRoles, type Mastery, type MasteryCategory, type MasteryRole} from 'glow-prow-data';

const {t} = useI18n();

const props = defineProps<{
  node: Mastery | null;
  nodes: Record<string, Mastery>;
  mobile: boolean;
  getSkillName: (key: string, id?: string) => string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'changed'): void;
  (e: 'rename-key', payload: { oldKey: string; newKey: string }): void;
  (e: 'delete-node', key: string): void;
  (e: 'add-requisite', payload: { nodeKey: string; requisiteKey: string }): void;
  (e: 'remove-requisite', payload: { nodeKey: string; requisiteKey: string }): void;
  (e: 'apply-effects', payload: { nodeKey: string; effects: any[] }): void;
}>();

// 草稿态：key 重命名与 effects JSON 需要显式提交
const keyDraft = ref('');
const effectsText = ref('[]');
const effectsError = ref('');
const effectsDirty = ref(false);
const addReqValue = ref<string | null>(null);

const categoryItems = MasteryCategories.map(v => ({ value: v, title: t(`mastery.categorys.${v}`) }));
const roleItems = MasteryRoles.map(v => ({ value: v, title: t(`codex.mastery.roles.${v}`) }));

// 同步草稿（节点切换或 key 被重命名后）
watch(() => props.node?.key, () => {
  keyDraft.value = props.node?.key || '';
  try {
    effectsText.value = JSON.stringify((props.node as any)?.effects ?? [], null, 2);
  } catch {
    effectsText.value = '[]';
  }
  effectsError.value = '';
  effectsDirty.value = false;
  addReqValue.value = null;
}, {immediate: true});

// 前置节点选择项──
const requisiteKeys = computed<string[]>(() => {
  if (!props.node) return [];
  return Array.isArray(props.node.requisite) ? props.node.requisite : [];
});

const availableParentItems = computed(() => {
  if (!props.node) return [];
  const used = new Set(requisiteKeys.value);
  return Object.values(props.nodes)
      .filter(n => n.key !== props.node!.key && n.id !== (props.node as any).id && !used.has(n.key) && !used.has(n.id))
      .map(n => ({
        value: n.key,
        title: `${n.key} · ${props.getSkillName(n.id, n.key)}`
      }));
});

function resolveReqName(reqKey: string): string {
  const n = props.nodes[reqKey] || Object.values(props.nodes).find(x => x.key === reqKey || x.id === reqKey);
  if (!n) return reqKey;
  return props.getSkillName(n.id, n.key);
}

// 字段提交──
function setField(field: string, value: any) {
  if (!props.node) return;
  (props.node as any)[field] = value;
  emit('changed');
}

function setPosition(axis: 'x' | 'y', value: string | number) {
  if (!props.node) return;
  const num = Number(value);
  if (Number.isNaN(num)) return;
  (props.node as any).position = {...(props.node as any).position, [axis]: num};
  emit('changed');
}

function toDateInput(d: any): string {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
}

function setDateField(field: 'dateAdded' | 'lastUpdated', value: string) {
  if (!props.node || !value) return;
  (props.node as any)[field] = new Date(`${value}T00:00:00`);
  emit('changed');
}

function commitRename() {
  if (!props.node) return;
  const newKey = keyDraft.value.trim();
  if (!newKey || newKey === props.node.key) {
    keyDraft.value = props.node.key;
    return;
  }
  emit('rename-key', {oldKey: props.node.key, newKey});
}

function onAddRequisite() {
  if (!props.node || !addReqValue.value) return;
  emit('add-requisite', {nodeKey: props.node.key, requisiteKey: addReqValue.value});
  addReqValue.value = null;
}

function onRemoveRequisite(reqKey: string) {
  if (!props.node) return;
  emit('remove-requisite', {nodeKey: props.node.key, requisiteKey: reqKey});
}

function applyEffects() {
  if (!props.node) return;
  try {
    const parsed = JSON.parse(effectsText.value);
    if (!Array.isArray(parsed)) {
      effectsError.value = t('mastery.debugCard.effectsMustBeArray');
      return;
    }
    emit('apply-effects', {nodeKey: props.node.key, effects: parsed});
    effectsError.value = '';
    effectsDirty.value = false;
  } catch (e: any) {
    effectsError.value = e?.message || t('mastery.debugCard.effectsInvalid');
  }
}

function onDeleteNode() {
  if (!props.node) return;
  emit('delete-node', props.node.key);
}

function onCategoryUpdate(value: any) {
  setField('category', value as MasteryCategory);
}

function onRoleUpdate(value: any) {
  setField('role', value as MasteryRole);
}
</script>

<template>
  <v-card
      v-if="node"
      border
      elevation="12"
      :width="mobile ? 'calc(100% - 60px)' : 450"
      :style="{ 'top': mobile ? '140px' : '70px' }"
      class="mastery-debug-node-card skill-tree-container-cardInfo overflow-y-auto">
    <template v-slot:title>
      <div class="d-flex align-center ga-2">
        <v-icon color="error" size="20">mdi-bug-check-outline</v-icon>
        <span class="text-error text-h6">{{ t('mastery.debugCard.title') }}</span>
      </div>
    </template>

    <template v-slot:append>
      <v-btn variant="tonal" icon @click="emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>

    <!-- 基础信息 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('mastery.debugCard.sectionBasic') }}</div>
    <div class="py-3 px-5 mb-3">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
          v-model="keyDraft"
          density="compact"
          variant="outlined"
          hide-details
          class="mt-2"
          :label="t('mastery.debugCard.fieldKey')"
          @keyup.enter="commitRename">
        <template v-slot:append>
          <v-btn variant="tonal" @click="commitRename">
            <v-icon icon="mdi-key-change" size="16"></v-icon>
          </v-btn>
        </template>
          </v-text-field>
          <div class="mb-1 d-flex align-center text-caption my-2 ga-2 flex-wrap">
            <v-select
                :model-value="node.category"
                :items="categoryItems"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="flex-grow-1"
                @update:model-value="onCategoryUpdate"
            ></v-select>
            <v-select
                :model-value="node.role"
                :items="roleItems"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="flex-grow-1"
                @update:model-value="onRoleUpdate"
            ></v-select>
          </div>
        </v-col>
        <v-col cols="12">
          <v-text-field
              :model-value="node.id"
              :label="t('mastery.debugCard.fieldId')"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setField('id', $event)"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :model-value="node.cost"
              :label="t('mastery.debugCard.fieldCost')"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setField('cost', Number($event))"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :model-value="node.ring"
              :label="t('mastery.debugCard.fieldRing')"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setField('ring', Number($event))"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :model-value="node.group"
              :label="t('mastery.debugCard.fieldGroup')"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setField('group', String($event ?? ''))"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :model-value="node.direction"
              :label="t('mastery.debugCard.fieldDirection')"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setField('direction', String($event ?? ''))"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :model-value="toDateInput(node.dateAdded)"
              label="dateAdded"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setDateField('dateAdded', $event)"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :model-value="toDateInput(node.lastUpdated)"
              label="lastUpdated"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setDateField('lastUpdated', $event)"
          ></v-text-field>
        </v-col>
      </v-row>
    </div>

    <!-- 坐标 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('mastery.debugCard.sectionPosition') }}</div>
    <div class="py-3 px-5 mb-3">
      <v-row dense>
        <v-col cols="6">
          <v-text-field
              :model-value="Math.round(node.position?.x ?? 0)"
              :label="t('mastery.debug.coordX')"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setPosition('x', $event)"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :model-value="Math.round(node.position?.y ?? 0)"
              :label="t('mastery.debug.coordY')"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setPosition('y', $event)"
          ></v-text-field>
        </v-col>
      </v-row>
      <p class="text-caption opacity-60 mb-0">{{ t('mastery.debugCard.dragHint') }}</p>
    </div>

    <!-- 前置关系 / 连线 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('mastery.debugCard.sectionRequisites') }}</div>
    <div class="py-3 px-5 mb-3">
      <div v-if="requisiteKeys.length" class="d-flex flex-wrap ga-2 mb-3">
        <v-chip
            v-for="reqKey in requisiteKeys"
            :key="reqKey"
            size="small"
            color="amber"
            variant="tonal"
            closable
            @click:close="onRemoveRequisite(reqKey)"
        >
          <v-icon start size="14">mdi-arrow-up-bold-outline</v-icon>
          {{ resolveReqName(reqKey) }}
          <span class="opacity-60 ml-1">({{ reqKey }})</span>
        </v-chip>
      </div>
      <div v-else class="text-caption opacity-60 mb-3">{{ t('mastery.debugCard.noRequisites') }}</div>
      <v-select
          v-model="addReqValue"
          :items="availableParentItems"
          item-title="title"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          :placeholder="t('mastery.debugCard.addRequisitePlaceholder')"
          @update:model-value="onAddRequisite"
      ></v-select>
      <p class="text-caption opacity-60 mb-0 mt-2">{{ t('mastery.debugCard.requisiteHint') }}</p>
    </div>

    <!-- 效果 JSON -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('mastery.debugCard.sectionEffects') }}</div>
    <div class="py-3 px-5 mb-3">
      <v-textarea
          v-model="effectsText"
          rows="6"
          density="compact"
          variant="outlined"
          hide-details
          class="mastery-effects-editor"
          @update:model-value="effectsDirty = true"
      ></v-textarea>
      <div class="d-flex align-center ga-2 mt-2">
        <v-btn size="small" color="amber" variant="tonal" @click="applyEffects">
          <v-icon start icon="mdi-code-json" size="16"></v-icon>
          {{ t('mastery.debugCard.applyEffects') }}
        </v-btn>
        <span v-if="effectsDirty && !effectsError" class="text-amber-lighten-3 text-caption">{{ t('mastery.debugCard.effectsDirty') }}</span>
        <span v-if="effectsError" class="text-error text-caption">{{ effectsError }}</span>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <v-divider></v-divider>
    <div class="node-card-actions">
      <v-row align="center" no-gutters>
        <v-col class="text-left px-5 text-caption opacity-70">
          {{ node.id }}
        </v-col>
        <v-divider vertical></v-divider>
        <v-col cols="auto">
          <v-btn
              height="50"
              elevation="0"
              tile
              color="error"
              variant="tonal"
              :title="t('mastery.debug.deleteNode')"
              @click="onDeleteNode">
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<style scoped lang="less">
.mastery-debug-node-card.skill-tree-container-cardInfo {
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
  backdrop-filter: blur(20px);
  position: absolute;
  z-index: 120;
  right: 30px;
  top: 70px;
  max-height: calc(100vh - 120px);

  .skill-tree-title {
    marker: none;
    background-color: hsl(from #000 h s l / .3);
  }
}

.node-card-actions {
  background-color: hsl(from #000 h s l / .2);
}

.mastery-effects-editor :deep(textarea) {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 12px;
}
</style>
