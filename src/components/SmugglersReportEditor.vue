<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {Commodities, Items, Materials} from 'glow-prow-data';
import {useI18nReadName} from '@/assets/sripts/i18n_read_name';
import {useNoticeStore} from '~/stores/noticeStore';

import ItemName from '@/components/snbWidget/itemName.vue';
import ItemIconWidget from '@/components/snbWidget/itemIconWidget.vue';
import MaterialIconWidget from '@/components/snbWidget/materialIconWidget.vue';
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue';
import EmptyView from '@/components/EmptyView.vue';
import MaterialName from "@/components/snbWidget/materialName.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n();
const notice = useNoticeStore();
const {item: readItemName, material: readMaterialName, commoditie: readCommodityName} = useI18nReadName();

const props = withDefaults(defineProps<{
  modelValue?: any;
  activeCategory?: string;
  categories?: string[];
}>(), {
  modelValue: () => ({weekly: []}),
  activeCategory: 'weekly',
  categories: () => ['weekly']
});

const emit = defineEmits<{
  'update:modelValue': [value: any];
  'update:activeCategory': [value: string];
  'update:categories': [value: string[]];
}>();

// 标记是否为组件内部发出的数据更新
const isInternalUpdate = ref(false);

// 当前激活的分类 tab，默认 weekly
const currentCategory = ref(props.activeCategory || 'weekly');

// 监听外部分类变化
watch(() => props.activeCategory, (val) => {
  if (val && val !== currentCategory.value) {
    currentCategory.value = val;
  }
});

// 监听当前分类变化并通知外部
watch(currentCategory, (val) => {
  emit('update:activeCategory', val);
  resetEditorForm();
});

// 已启用的分类列表，weekly 默认始终启用
const enabledCategories = ref<string[]>(['weekly']);

// 本地周报各分类数据
const localData = ref<Record<string, any[]>>({
  weekly: [],
  inSeason: [],
  common: [],
  abyssal: [],
});

// 当前输入的物品标识
const selectedItem = ref('culverin1');

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

// 分类标签拖拽源索引
const catDragIndex = ref<number | null>(null);

// 分类标签拖拽悬停目标索引
const catDragOverIndex = ref<number | null>(null);

// 监听物品ID选择防呆：如果从下拉中选出了对象，提取出字符串ID
watch(selectedItem, (val: any) => {
  if (val && typeof val === 'object' && val.id) {
    selectedItem.value = val.id;
  }
});

// 同步外部传入数据到本地并识别已启用的分类
watch(() => props.modelValue, (newValue) => {
  if (isInternalUpdate.value) {
    isInternalUpdate.value = false;
    return;
  }

  if (!newValue) return;

  const allKnown = ['weekly', 'inSeason', 'abyssal', 'common'];

  for (const key of allKnown) {
    localData.value[key] = Array.isArray(newValue[key]) ? [...newValue[key]] : [];
  }

  let finalCategories: string[];
  if (Array.isArray(newValue.categoryOrder)) {
    // 分类顺序一旦保存过就以它为准，weekly 也可能被移除
    finalCategories = newValue.categoryOrder.filter((c: string) => allKnown.includes(c));
  } else {
    // 无排序记录时按数据内容推断，全部为空则回落到 weekly
    const present = allKnown.filter(key => localData.value[key].length > 0);
    finalCategories = present.length > 0 ? present : ['weekly'];
  }

  enabledCategories.value = finalCategories;
  emit('update:categories', [...finalCategories]);

  if (!finalCategories.includes(currentCategory.value)) {
    currentCategory.value = finalCategories[0] || 'weekly';
  }
}, {immediate: true});

/**
 * 派发最新的周报数据与已启用分类列表给父组件
 */
const emitUpdate = () => {
  isInternalUpdate.value = true;
  const payload: any = {
    // weekly 键始终保留以满足后端创建校验，未启用时输出空数组
    weekly: [...(localData.value.weekly || [])]
  };

  for (const cat of enabledCategories.value) {
    if (cat === 'weekly') continue;
    payload[cat] = [...(localData.value[cat] || [])];
  }

  // 持久化分类排序到 content，供展示侧回显
  payload.categoryOrder = [...enabledCategories.value];

  emit('update:modelValue', payload);
  emit('update:categories', [...enabledCategories.value]);
};

// 当前操作分类的物品数组
const currentItemList = computed({
  get: () => {
    return localData.value[currentCategory.value] || [];
  },
  set: (val: any[]) => {
    localData.value[currentCategory.value] = val;
    emitUpdate();
  }
});

// 可选分类定义元数据
const allCategoryMeta: Record<string, { key: string; name: string; title: string }> = {
  inSeason: {
    key: 'inSeason',
    name: t('smugglersReport.inSeason'),
    title: t('smugglersReport.inSeasonItems')
  },
  weekly: {
    key: 'weekly',
    name: t('smugglersReport.weekly'),
    title: t('smugglersReport.weeklyItems')
  },
  abyssal: {
    key: 'abyssal',
    name: t('smugglersReport.abyssal'),
    title: t('smugglersReport.abyssalItems')
  },
  common: {
    key: 'common',
    name: t('smugglersReport.common'),
    title: t('smugglersReport.commonItems')
  }
};

// 当前分类的完整标题
const currentCategoryTitle = computed(() => {
  return allCategoryMeta[currentCategory.value]?.title || allCategoryMeta.weekly.title;
});

// 尚未创建的可选分类列表
const availableOptionalCategories = computed(() => {
  return [
    {key: 'weekly', name: t('smugglersReport.weekly'), title: t('smugglersReport.weekly')},
    {key: 'common', name: t('smugglersReport.common'), title: t('smugglersReport.commonItems')},
    {key: 'abyssal', name: t('smugglersReport.abyssal'), title: t('smugglersReport.abyssalItems')},
    {key: 'inSeason', name: t('smugglersReport.inSeason'), title: t('smugglersReport.inSeasonItems')},
  ].filter(c => !enabledCategories.value.includes(c.key));
});

/**
 * 创建新分类标签并自动切换过去
 * @param categoryKey 分类唯一键
 */
const createCategory = (categoryKey: string) => {
  if (!enabledCategories.value.includes(categoryKey)) {

    enabledCategories.value.push(categoryKey);
    if (!localData.value[categoryKey]) {
      localData.value[categoryKey] = [];
    }

    currentCategory.value = categoryKey;
    emitUpdate();

    notice.success(t('basic.tips.createSuccess'), {mode: 'minimal'});
  }
};

/**
 * 移除已创建的可选分类
 * 分类下已有物品数据时在确认提示中附带将删除的数量
 * @param categoryKey 分类唯一键
 */
const removeCategory = (categoryKey: string) => {
  const itemCount = (localData.value[categoryKey] || []).length;
  const confirmText = itemCount > 0
      ? t('smugglersReport.removeCategoryWithDataConfirm', {count: itemCount})
      : t('smugglersReport.removeCategoryConfirm');

  if (confirm(confirmText)) {
    enabledCategories.value = enabledCategories.value.filter(k => k !== categoryKey);

    delete localData.value[categoryKey];

    if (currentCategory.value === categoryKey) {
      currentCategory.value = enabledCategories.value[0] || 'weekly';
    }
    emitUpdate();
  }
};

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

// 可选实体来源，覆盖物品、材料、杂货三类可插入的标识
const itemSources: { entity: 'item' | 'material' | 'commodity'; dict: Record<string, any>; readName: (id: string) => { name: () => string } }[] = [
  {entity: 'item', dict: Items, readName: readItemName},
  {entity: 'material', dict: Materials, readName: readMaterialName},
  {entity: 'commodity', dict: Commodities, readName: readCommodityName}
];

/**
 * 判定标识所属的实体类型，用于渲染对应类型的图标与名称组件
 * @param id 实体标识
 * @returns 实体类型标识
 */
const resolveEntity = (id: string): 'item' | 'material' | 'commodity' => {
  if (id && id in Items) return 'item';
  if (id && id in Materials) return 'material';
  if (id && id in Commodities) return 'commodity';
  return 'item';
};

// 当前选中标识的实体类型
const selectedEntity = computed(() => resolveEntity(selectedItem.value));

// 物品、材料、杂货统一检索候选列表
const filteredItemOptions = computed(() => {
  const query = (itemSearchQuery.value || '').trim().toLowerCase();
  const list: { id: string; name: string; title: string; entity: 'item' | 'material' | 'commodity' }[] = [];
  const picked = new Set<string>();

  for (const source of itemSources) {
    for (const it of Object.values(source.dict) as any[]) {
      if (!it || !it.id || picked.has(it.id)) continue;

      const id = it.id;
      const name = source.readName(id).name() || '';
      if (query && !name.toLowerCase().includes(query) && !id.toLowerCase().includes(query)) continue;

      picked.add(id);
      list.push({
        id,
        name: name || id,
        title: name ? `${name} (${id})` : id,
        entity: source.entity
      });
      if (list.length >= 20) {
        return list;
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

/**
 * 校验当前输入表单数据是否合规
 * @returns 验证通过返回 true，否则返回 false
 */
const validateFormInput = (): boolean => {
  const trimmedId = selectedItem.value?.trim();
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
 * 添加物品至当前激活分类末尾
 */
const addItem = () => {
  if (!validateFormInput()) return;

  const newItem = {
    id: selectedItem.value.trim(),
    currency: selectedCurrency.value,
    worth: Number(selectedWorth.value)
  };

  currentItemList.value = [...currentItemList.value, newItem];
  resetEditorForm();
};

/**
 * 保存正在编辑的物品数据
 */
const saveEditingItem = () => {
  if (editingIndex.value === null) return;
  if (!validateFormInput()) return;

  const nextList = [...currentItemList.value];
  nextList[editingIndex.value] = {
    id: selectedItem.value.trim(),
    currency: selectedCurrency.value,
    worth: Number(selectedWorth.value)
  };

  currentItemList.value = nextList;
  notice.success(t('basic.tips.updateSuccess'));
  resetEditorForm();
};

/**
 * 开启指定索引物品的重新编辑状态
 * @param index 目标物品索引
 */
const startEditItem = (index: number) => {
  const target = currentItemList.value[index];
  if (!target) return;

  editingIndex.value = index;
  selectedItem.value = target.id;
  selectedCurrency.value = target.currency;
  selectedWorth.value = target.worth;
};

/**
 * 在指定索引项前方或后方插入物品
 * @param index 参考目标项索引
 * @param position 插入位置（'before' 之前，'after' 之后）
 */
const insertItemAt = (index: number, position: 'before' | 'after') => {
  if (!validateFormInput()) return;

  const newItem = {
    id: selectedItem.value.trim(),
    currency: selectedCurrency.value,
    worth: Number(selectedWorth.value)
  };

  const nextList = [...currentItemList.value];
  const targetIdx = position === 'before' ? index : index + 1;
  nextList.splice(targetIdx, 0, newItem);
  currentItemList.value = nextList;
  resetEditorForm();
};

/**
 * 调整物品上下顺序
 * @param index 当前移动项索引
 * @param delta 偏移量（-1 为上移，1 为下移）
 */
const moveItem = (index: number, delta: number) => {
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= currentItemList.value.length) return;

  const nextList = [...currentItemList.value];
  const moved = nextList.splice(index, 1)[0];
  nextList.splice(targetIndex, 0, moved);
  currentItemList.value = nextList;
};

/**
 * 删除指定索引的物品
 * @param index 待删除项索引
 */
const removeItem = (index: number) => {
  const nextList = [...currentItemList.value];
  nextList.splice(index, 1);
  currentItemList.value = nextList;

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
  selectedItem.value = '';
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
    const nextList = [...currentItemList.value];
    const moved = nextList.splice(dragIndex.value, 1)[0];
    nextList.splice(targetIndex, 0, moved);
    currentItemList.value = nextList;
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

/**
 * 处理分类标签拖拽开始
 * @param event 原生拖拽事件
 * @param index 拖拽分类索引
 */
const onCategoryDragStart = (event: DragEvent, index: number) => {
  catDragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
};

/**
 * 处理分类标签拖拽悬停
 * @param event 原生拖拽事件
 * @param index 悬停目标分类索引
 */
const onCategoryDragOver = (event: DragEvent, index: number) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  catDragOverIndex.value = index;
};

/**
 * 处理分类标签拖拽释放，重排分类顺序
 * @param event 原生拖拽事件
 * @param targetIndex 目标分类索引
 */
const onCategoryDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault();
  if (catDragIndex.value !== null && catDragIndex.value !== targetIndex) {
    const nextCats = [...enabledCategories.value];
    const moved = nextCats.splice(catDragIndex.value, 1)[0];
    nextCats.splice(targetIndex, 0, moved);
    enabledCategories.value = nextCats;
    emitUpdate();
  }
  catDragIndex.value = null;
  catDragOverIndex.value = null;
};

/**
 * 处理分类标签拖拽结束
 */
const onCategoryDragEnd = () => {
  catDragIndex.value = null;
  catDragOverIndex.value = null;
};

defineOptions({
  name: 'SmugglersReportEditor'
});
</script>

<template>
  <div class="smugglers-report-editor">
    <!-- 分类标签切换与创建下拉栏 S -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-2">
      <v-tabs
          v-model="currentCategory"
          density="comfortable"
          color="amber"
          class="font-weight-bold flex-grow-1">
        <v-tab
            v-for="(catKey, idx) in enabledCategories"
            :key="catKey"
            :value="catKey"
            draggable="true"
            :class="{'drag-over-cat': catDragOverIndex === idx}"
            @dragstart="onCategoryDragStart($event, idx)"
            @dragover="onCategoryDragOver($event, idx)"
            @drop="onCategoryDrop($event, idx)"
            @dragend="onCategoryDragEnd">
          <span>{{ allCategoryMeta[catKey]?.name || catKey }}</span>

          <template v-slot:prepend>
            <v-icon
                size="20"
                icon="mdi-drag-vertical"
                class="drag-indicator-icon mr-1 opacity-40"
            ></v-icon>
          </template>

          <template v-slot:append>
            <v-btn
                icon="mdi-close"
                variant="tonal"
                density="comfortable"
                size="x-small"
                class="ml-1"
                @click.stop="removeCategory(catKey)">
            </v-btn>
          </template>
        </v-tab>
      </v-tabs>
      <!-- 添加可选分类下拉菜单 S -->
      <v-menu v-if="availableOptionalCategories.length > 0" location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn
              v-bind="props"
              size="small"
              variant="text"
              border
              prepend-icon="mdi-plus">
            {{ t('smugglersReport.addCategory') }}
          </v-btn>
        </template>
        <v-list min-width="260" class="pa-1" border rounded="lg">
          <v-list-item
              v-for="cat in availableOptionalCategories"
              :key="cat.key"
              @click="createCategory(cat.key)">
            <v-list-item-title>{{ cat.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <!-- 添加可选分类下拉菜单 E -->
    </div>
    <v-divider class="mb-3"></v-divider>
    <!-- 分类标签切换与创建下拉栏 E -->

    <!-- 当前分类编辑面板 S -->
    <AffixBoxHasTitleView :offset-top="0">
      <template v-slot:title>
        {{ currentCategoryTitle }} {{ t('smugglersReport.editor.totalCount', {count: currentItemList.length}) }}
      </template>

      <v-card-text class="pa-3">
        <!-- 顶部编辑状态提示条 S -->
        <v-alert
            v-if="editingIndex !== null"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3 text-caption d-flex align-center justify-space-between">
          <span>{{ t('smugglersReport.editor.editingItem', {index: editingIndex + 1}) }}</span>
          <v-btn size="x-small" variant="text" color="primary" @click="resetEditorForm">
            {{ t('basic.button.cancel') }}
          </v-btn>
        </v-alert>
        <!-- 顶部编辑状态提示条 E -->

        <!-- 输入与快速选择栏 S -->
        <v-row dense class="align-center mb-3">
          <!-- 物品输入与搜索选择 -->
          <v-col cols="12" sm="12">
            <v-combobox
                variant="outlined"
                density="comfortable"
                :label="t('smugglersReport.itemId')"
                v-model="selectedItem"
                v-model:search="itemSearchQuery"
                :items="filteredItemOptions"
                item-title="title"
                item-value="id"
                :return-object="false"
                :rules="itemRules"
                hide-no-data
                :placeholder="t('smugglersReport.editor.itemPlaceholder')">
              <template #selection>
                <div class="d-flex align-center" v-if="selectedItem">
                  <ItemSlotBase size="22px" class="mr-1">
                    <MaterialIconWidget
                        v-if="selectedEntity === 'material'"
                        :id="selectedItem"
                        :is-open-detail="false"
                        :is-show-tooltip="false"
                        size="20px"></MaterialIconWidget>
                    <CommoditieIconWidget
                        v-else-if="selectedEntity === 'commodity'"
                        :id="selectedItem"
                        :is-open-detail="false"
                        :is-show-tooltip="false"></CommoditieIconWidget>
                    <ItemIconWidget
                        v-else
                        :id="selectedItem"
                        :is-open-detail="false"
                        :is-show-tooltip="false"
                        size="20px"></ItemIconWidget>
                  </ItemSlotBase>
                  <span class="text-caption text-truncate">{{ selectedItem }}</span>
                </div>
              </template>
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :title="item.name" :subtitle="item.id">
                  <template #prepend>
                    <ItemSlotBase size="28px" class="mr-2">
                      <MaterialIconWidget
                          v-if="item.entity === 'material'"
                          :id="item.id"
                          :is-open-detail="false"
                          :is-show-tooltip="false"
                          size="26px"></MaterialIconWidget>
                      <CommoditieIconWidget
                          v-else-if="item.entity === 'commodity'"
                          :id="item.id"
                          :is-open-detail="false"
                          :is-show-tooltip="false"></CommoditieIconWidget>
                      <ItemIconWidget
                          v-else
                          :id="item.id"
                          :is-open-detail="false"
                          :is-show-tooltip="false"
                          size="26px"></ItemIconWidget>
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

          <v-col cols="auto" lg="6">
            <!-- 添加或更新按钮栏 S -->
            <div class="d-flex align-center justify-end ga-2 mb-6">
              <v-btn
                  v-if="editingIndex !== null"
                  variant="text"
                  size="large"
                  @click="resetEditorForm">
                {{ t('basic.button.cancel') }}
              </v-btn>
              <v-btn
                  v-if="editingIndex !== null"
                  color="amber"
                  variant="tonal"
                  size="large"
                  prepend-icon="mdi-check"
                  @click="saveEditingItem">
                {{ t('basic.button.edit') }}
              </v-btn>
              <v-btn
                  v-else
                  color="primary"
                  variant="tonal"
                  size="large"
                  prepend-icon="mdi-plus"
                  @click="addItem">
                {{ t('basic.button.insert') }}
              </v-btn>
            </div>
            <!-- 添加或更新按钮栏 E -->
          </v-col>
        </v-row>

        <!-- 物品展示与排序列表 S -->
        <div v-if="currentItemList.length > 0" class="d-flex flex-column ga-2">
          <v-card
              v-for="(item, index) in currentItemList"
              :key="item.id + '-' + index"
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
                  <MaterialIconWidget v-if="resolveEntity(item.id) === 'material'" :id="item.id"></MaterialIconWidget>
                  <CommoditieIconWidget v-else-if="resolveEntity(item.id) === 'commodity'" :id="item.id"></CommoditieIconWidget>
                  <ItemIconWidget v-else :id="item.id"></ItemIconWidget>
                </ItemSlotBase>

                <div class="min-width-0 flex-grow-1">
                  <div class="d-flex align-center ga-2">
                    <u class="font-weight-bold text-h5 u">
                      <MaterialName v-if="resolveEntity(item.id) === 'material'" :id="item.id"></MaterialName>
                      <CommoditieName v-else-if="resolveEntity(item.id) === 'commodity'" :id="item.id"></CommoditieName>
                      <ItemName v-else :id="item.id"></ItemName>
                    </u>
                    <v-chip size="x-small" variant="tonal" color="grey">#{{ index + 1 }}</v-chip>
                  </div>
                  <div class="d-flex align-center ga-2 mt-1 ml-n1">
                    <ItemSlotBase size="30px" class="mr-1">
                      <MaterialIconWidget :id="item.currency"></MaterialIconWidget>
                    </ItemSlotBase>
                    <MaterialName :id="item.currency"></MaterialName>
                    x {{ item.worth || 0 }}
                  </div>
                </div>
              </div>

              <!-- 右侧快捷操作栏 -->
              <div class="d-flex align-center ga-1 flex-shrink-0">
                <!--                &lt;!&ndash; 上移 &ndash;&gt;-->
                <!--                <v-btn-->
                <!--                    icon="mdi-arrow-up"-->
                <!--                    size="x-small"-->
                <!--                    variant="text"-->
                <!--                    :disabled="index === 0"-->
                <!--                    :title="t('smugglersReport.editor.moveUp')"-->
                <!--                    @click="moveItem(index, -1)">-->
                <!--                </v-btn>-->

                <!--                &lt;!&ndash; 下移 &ndash;&gt;-->
                <!--                <v-btn-->
                <!--                    icon="mdi-arrow-down"-->
                <!--                    size="x-small"-->
                <!--                    variant="text"-->
                <!--                    :disabled="index === currentItemList.length - 1"-->
                <!--                    :title="t('smugglersReport.editor.moveDown')"-->
                <!--                    @click="moveItem(index, 1)">-->
                <!--                </v-btn>-->

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
                    @click="removeItem(index)">
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <EmptyView v-else></EmptyView>
        <!-- 物品展示与排序列表 E -->
      </v-card-text>
    </AffixBoxHasTitleView>
    <!-- 当前分类编辑面板 E -->
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

  .drag-over-cat {
    background-color: rgba(255, 193, 7, 0.12);
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
