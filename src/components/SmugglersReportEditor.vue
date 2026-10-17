<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {Items, Materials} from 'glow-prow-data';
import {useI18nReadName} from '@/assets/sripts/i18n_read_name';
import {useNoticeStore} from '~/stores/noticeStore';

import type {SmugglersReportEditorProps} from '@/assets/types/Smugglers';
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue';
import ItemName from '@/components/snbWidget/itemName.vue';
import ItemIconWidget from '@/components/snbWidget/itemIconWidget.vue';
import MaterialIconWidget from '@/components/snbWidget/materialIconWidget.vue';
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue';
import EmptyView from '@/components/EmptyView.vue';
import MaterialName from "@/components/snbWidget/materialName.vue";

const {t} = useI18n();
const notice = useNoticeStore();
const {item: readItemName, material: readMaterialName} = useI18nReadName();

const props = defineProps<SmugglersReportEditorProps>();
const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

// 本地周报数据
const localData = ref({
  inSeason: [] as any[],
  weekly: [] as any[],
  common: [] as any[],
});

// 当前输入的物品标识
const selectedWeeklyItem = ref('culverin1');

// 物品搜索关键词
const itemSearchQuery = ref('');

// 当前选中的货币标识
const selectedCurrency = ref('silver');

// 当前输入的货币价值或数量
const selectedWorth = ref<number | string>(1000);

// 当前正在编辑的条目索引
const editingIndex = ref<number | null>(null);

// 拖拽源条目索引
const dragIndex = ref<number | null>(null);

// 拖拽悬停目标条目索引
const dragOverIndex = ref<number | null>(null);

// 监听物品ID选择防呆：如果从下拉中选出了对象，提取出字符串ID
watch(selectedWeeklyItem, (val: any) => {
  if (val && typeof val === 'object' && val.id) {
    selectedWeeklyItem.value = val.id;
  }
});

// 货币类别材料选项集合
const currencyOptions = computed(() => {
  const materialsList = Object.values(Materials) as any[];
  return materialsList
    .filter((m: any) => m && m.category === 'currency')
    .map((m: any) => {
      const rawName = readMaterialName(m.id).name();
      const hasValidName = rawName && !rawName.startsWith('snb.');
      return {
        id: m.id,
        title: hasValidName ? `${rawName} (${m.id})` : m.id,
        name: hasValidName ? rawName : m.id,
        rarity: m.rarity
      };
    });
});

// 物品搜索匹配候选列表
const filteredItemOptions = computed(() => {
  const query = (itemSearchQuery.value || '').trim().toLowerCase();
  const list: { id: string; name: string; title: string }[] = [];
  const itemsList = Object.values(Items) as any[];

  for (const it of itemsList) {
    if (!it || !it.id) continue;
    const id = it.id;
    const name = readItemName(id).name() || '';
    const nameMatch = name.toLowerCase().includes(query);
    const idMatch = id.toLowerCase().includes(query);

    if (!query || nameMatch || idMatch) {
      list.push({
        id,
        name: name || id,
        title: name ? `${name} (${id})` : id
      });
      if (list.length >= 10) {
        break;
      }
    }
  }
  return list;
});

// 物品标识验证规则
const itemRules = [
  (v: string) => !!(v && v.trim()) || t('smugglersReport.itemIdRequired'),
  (v: string) => !v || v.trim().length <= 100 || t('smugglersReport.editor.itemIdLengthError')
];

// 货币选择验证规则
const currencyRules = [
  (v: string) => !!v || t('smugglersReport.currencyRequired')
];

// 价值数量验证规则
const worthRules = [
  (v: any) => v !== '' && v !== null && v !== undefined || t('smugglersReport.worthRequired'),
  (v: any) => Number(v) >= 0 || t('smugglersReport.editor.worthMinError')
];

// 同步外部传入数据到本地
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localData.value.inSeason = newValue.inSeason || [];
    localData.value.weekly = newValue.weekly || [];
    localData.value.common = newValue.common || [];
  }
}, {immediate: true});

// 监听本地数据变更并抛出事件
watch(localData, (newValue) => {
  emit('update:modelValue', {...newValue});
}, {deep: true});

/**
 * 校验当前输入表单数据是否合规
 * @returns 验证通过返回 true，否则返回 false
 */
const validateFormInput = (): boolean => {
  const trimmedId = selectedWeeklyItem.value?.trim();
  if (!trimmedId) {
    notice.warning(t('smugglersReport.itemIdRequired'));
    return false;
  }
  if (!selectedCurrency.value) {
    notice.warning(t('smugglersReport.currencyRequired'));
    return false;
  }
  if (selectedWorth.value === '' || selectedWorth.value === null || isNaN(Number(selectedWorth.value))) {
    notice.warning(t('smugglersReport.worthRequired'));
    return false;
  }
  return true;
};

/**
 * 添加周物品至列表末尾
 */
const addWeeklyItem = () => {
  if (!validateFormInput()) return;

  const newItem = {
    id: selectedWeeklyItem.value.trim(),
    currency: selectedCurrency.value,
    worth: Number(selectedWorth.value)
  };

  localData.value.weekly.push(newItem);
  resetEditorForm();
};

/**
 * 保存正在编辑的周物品数据
 */
const saveEditingItem = () => {
  if (editingIndex.value === null) return;
  if (!validateFormInput()) return;

  localData.value.weekly[editingIndex.value] = {
    id: selectedWeeklyItem.value.trim(),
    currency: selectedCurrency.value,
    worth: Number(selectedWorth.value)
  };

  notice.success(t('basic.button.editSuccess') || t('smugglersReport.account.commentEditSuccess'));
  resetEditorForm();
};

/**
 * 开启指定索引周物品的重新编辑状态
 * @param index 目标周物品索引
 */
const startEditItem = (index: number) => {
  const target = localData.value.weekly[index];
  if (!target) return;

  editingIndex.value = index;
  selectedWeeklyItem.value = target.id;
  selectedCurrency.value = target.currency;
  selectedWorth.value = target.worth;
};

/**
 * 在指定索引项前方或后方插入周物品
 * @param index 参考目标项索引
 * @param position 插入位置（'before' 之前，'after' 之后）
 */
const insertItemAt = (index: number, position: 'before' | 'after') => {
  if (!validateFormInput()) return;

  const newItem = {
    id: selectedWeeklyItem.value.trim(),
    currency: selectedCurrency.value,
    worth: Number(selectedWorth.value)
  };

  const targetIdx = position === 'before' ? index : index + 1;
  localData.value.weekly.splice(targetIdx, 0, newItem);
  resetEditorForm();
};

/**
 * 调整周物品上下顺序
 * @param index 当前移动项索引
 * @param delta 偏移量（-1 为上移，1 为下移）
 */
const moveItem = (index: number, delta: number) => {
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= localData.value.weekly.length) return;

  const moved = localData.value.weekly.splice(index, 1)[0];
  localData.value.weekly.splice(targetIndex, 0, moved);
};

/**
 * 删除指定索引的周物品
 * @param index 待删除项索引
 */
const removeWeeklyItem = (index: number) => {
  localData.value.weekly.splice(index, 1);
  if (editingIndex.value === index) {
    resetEditorForm();
  } else if (editingIndex.value !== null && editingIndex.value > index) {
    editingIndex.value -= 1;
  }
};

/**
 * 重置编辑表单输入状态
 */
const resetEditorForm = () => {
  editingIndex.value = null;
  selectedWeeklyItem.value = '';
  itemSearchQuery.value = '';
  selectedWorth.value = 1000;
};

/**
 * 处理拖拽开始事件
 * @param event 原生拖拽事件
 * @param index 拖拽条目索引
 */
const onDragStart = (event: DragEvent, index: number) => {
  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
};

/**
 * 处理拖拽悬停事件
 * @param event 原生拖拽事件
 * @param index 悬停目标条目索引
 */
const onDragOver = (event: DragEvent, index: number) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverIndex.value = index;
};

/**
 * 处理拖拽释放事件
 * @param event 原生拖拽事件
 * @param targetIndex 目标条目索引
 */
const onDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault();
  if (dragIndex.value !== null && dragIndex.value !== targetIndex) {
    const moved = localData.value.weekly.splice(dragIndex.value, 1)[0];
    localData.value.weekly.splice(targetIndex, 0, moved);
  }
  dragIndex.value = null;
  dragOverIndex.value = null;
};

/**
 * 处理拖拽结束事件
 */
const onDragEnd = () => {
  dragIndex.value = null;
  dragOverIndex.value = null;
};

defineOptions({
  name: 'SmugglersReportEditor'
});
</script>

<template>
  <div class="smugglers-report-editor">
    <AffixBoxHasTitleView>
      <template v-slot:title>
        <div class="d-flex align-center justify-space-between w-100">
          <span>{{ t('smugglersReport.weeklyItems') }}</span>
          <span class="opacity-60">{{ t('smugglersReport.editor.totalCount', { count: localData.weekly.length }) }}</span>
        </div>
      </template>

      <v-card-text class="pa-3">
        <!-- 顶部编辑状态提示条 S -->
        <v-alert
            v-if="editingIndex !== null"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3 text-caption d-flex align-center justify-space-between">
          <span>{{ t('smugglersReport.editor.editingItem', { index: editingIndex + 1 }) }}</span>
          <v-btn size="x-small" variant="text" color="primary" @click="resetEditorForm">
            {{ t('basic.button.cancel') }}
          </v-btn>
        </v-alert>
        <!-- 顶部编辑状态提示条 E -->

        <!-- 输入与快速选择栏 S -->
        <v-row dense class="align-center mb-3">
          <!-- 物品输入与搜索选择 -->
          <v-col cols="12" sm="4">
            <v-combobox
                variant="outlined"
                density="comfortable"
                :label="t('smugglersReport.itemId')"
                v-model="selectedWeeklyItem"
                v-model:search="itemSearchQuery"
                :items="filteredItemOptions"
                item-title="title"
                item-value="id"
                :return-object="false"
                :rules="itemRules"
                hide-no-data
                :placeholder="t('smugglersReport.editor.itemPlaceholder')">
              <template #selection>
                <div class="d-flex align-center" v-if="selectedWeeklyItem">
                  <ItemSlotBase size="22px" class="mr-1">
                    <ItemIconWidget :id="selectedWeeklyItem" :is-open-detail="false" :is-show-tooltip="false" size="20px"></ItemIconWidget>
                  </ItemSlotBase>
                  <span class="text-caption text-truncate">{{ selectedWeeklyItem }}</span>
                </div>
              </template>
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :title="item.name" :subtitle="item.id">
                  <template #prepend>
                    <ItemSlotBase size="28px" class="mr-2">
                      <ItemIconWidget :id="item.id" :is-open-detail="false" :is-show-tooltip="false" size="26px"></ItemIconWidget>
                    </ItemSlotBase>
                  </template>
                </v-list-item>
              </template>
            </v-combobox>
          </v-col>

          <!-- 货币下拉选择 -->
          <v-col cols="12" sm="3">
            <v-select
                density="compact"
                variant="outlined"
                :label="t('smugglersReport.currency')"
                v-model="selectedCurrency"
                :items="currencyOptions"
                item-title="title"
                item-value="id"
                :rules="currencyRules">
              <template #selection>
                <div class="d-flex align-center" v-if="selectedCurrency">
                  <ItemSlotBase size="22px" class="mr-1">
                    <MaterialIconWidget :id="selectedCurrency" size="20px"></MaterialIconWidget>
                  </ItemSlotBase>
                  <span class="text-caption text-truncate">{{ readMaterialName(selectedCurrency).name() || selectedCurrency }}</span>
                </div>
              </template>
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :title="item.name" :subtitle="item.id">
                  <template #prepend>
                    <ItemSlotBase size="28px" class="mr-2">
                      <MaterialIconWidget :id="item.id" size="26px"></MaterialIconWidget>
                    </ItemSlotBase>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- 价值/数量输入 -->
          <v-col cols="12" sm="3">
            <v-text-field
                type="number"
                density="comfortable"
                variant="outlined"
                :label="t('smugglersReport.worth')"
                v-model.number="selectedWorth"
                :rules="worthRules">
            </v-text-field>
          </v-col>
          <v-col cols="auto" lg>
            <!-- 添加或更新按钮栏 S -->
            <div class="d-flex align-center justify-end ga-2 mb-4">
              <v-btn
                  v-if="editingIndex !== null"
                  variant="text"
                  @click="resetEditorForm">
                {{ t('basic.button.cancel') }}
              </v-btn>
              <v-btn
                  v-if="editingIndex !== null"
                  color="amber"
                  variant="tonal"
                  prepend-icon="mdi-check"
                  @click="saveEditingItem">
                {{ t('basic.button.edit') }}
              </v-btn>
              <v-btn
                  v-else
                  color="primary"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="addWeeklyItem">
                {{ t('basic.button.insert') }}
              </v-btn>
            </div>
            <!-- 添加或更新按钮栏 E -->
          </v-col>
        </v-row>



        <!-- 周物品展示与排序列表 S -->
        <div v-if="localData.weekly.length > 0" class="d-flex flex-column ga-2">
          <v-card
              v-for="(item, index) in localData.weekly"
              :key="item.id + '-' + index"
              border
              rounded="lg"
              :class="['weekly-item-card pa-2 transition-all', {'border-amber active-editing': editingIndex === index, 'drag-over-item': dragOverIndex === index}]"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragover="onDragOver($event, index)"
              @drop="onDrop($event, index)"
              @dragend="onDragEnd">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2">
              <!-- 左侧手柄与物品基本信息 -->
              <div class="d-flex align-center min-width-0 flex-grow-1">
                <v-icon
                    size="20"
                    color="medium-emphasis"
                    class="cursor-grab mr-2 flex-shrink-0 drag-handle"
                    :title="t('smugglersReport.editor.dragTip')">
                  mdi-drag
                </v-icon>

                <ItemSlotBase size="70px" class="mr-2 flex-shrink-0">
                  <ItemIconWidget :id="item.id"></ItemIconWidget>
                </ItemSlotBase>

                <div class="min-width-0 flex-grow-1">
                  <div class="d-flex align-center ga-2">
                    <u class="font-weight-bold text-h5 u"><ItemName :id="item.id"></ItemName></u>
                    <v-chip size="x-small" variant="tonal" color="grey">#{{ index + 1 }}</v-chip>
                  </div>
                  <div class="d-flex align-center ga-2 mt-1 ml-n1">
                    <ItemSlotBase size="30px" class="mr-1">
                      <MaterialIconWidget :id="item.currency"></MaterialIconWidget>
                    </ItemSlotBase>
                    <MaterialName :id="item.currency"></MaterialName> x {{ item.worth || 0 }}
                  </div>
                </div>
              </div>

              <!-- 右侧快捷操作栏 -->
              <div class="d-flex align-center ga-1 flex-shrink-0">
                <!-- 上移 -->
                <v-btn
                    icon="mdi-arrow-up"
                    size="x-small"
                    variant="text"
                    :disabled="index === 0"
                    :title="t('smugglersReport.editor.moveUp')"
                    @click="moveItem(index, -1)">
                </v-btn>

                <!-- 下移 -->
                <v-btn
                    icon="mdi-arrow-down"
                    size="x-small"
                    variant="text"
                    :disabled="index === localData.weekly.length - 1"
                    :title="t('smugglersReport.editor.moveDown')"
                    @click="moveItem(index, 1)">
                </v-btn>

                <!-- 在前面插入 -->
                <v-btn
                    icon="mdi-table-row-plus-before"
                    size="x-small"
                    variant="text"
                    color="primary"
                    :title="t('smugglersReport.editor.insertBefore')"
                    @click="insertItemAt(index, 'before')">
                </v-btn>

                <!-- 在后面插入 -->
                <v-btn
                    icon="mdi-table-row-plus-after"
                    size="x-small"
                    variant="text"
                    color="primary"
                    :title="t('smugglersReport.editor.insertAfter')"
                    @click="insertItemAt(index, 'after')">
                </v-btn>

                <!-- 编辑 -->
                <v-btn
                    icon="mdi-pencil"
                    size="x-small"
                    variant="text"
                    color="amber"
                    :title="t('smugglersReport.editor.editItem')"
                    @click="startEditItem(index)">
                </v-btn>

                <!-- 删除 -->
                <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    color="error"
                    :title="t('basic.button.delete')"
                    @click="removeWeeklyItem(index)">
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <EmptyView v-else></EmptyView>
        <!-- 周物品展示与排序列表 E -->
      </v-card-text>
    </AffixBoxHasTitleView>
  </div>
</template>

<style scoped lang="less">
.smugglers-report-editor {
  .min-width-0 {
    min-width: 0;
  }

  .cursor-grab {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  .weekly-item-card {
    transition: all 0.2s ease;

    &.active-editing {
      background-color: rgba(255, 193, 7, 0.05);
    }

    &.drag-over-item {
      transform: scale(1.01);
    }
  }
}
</style>
