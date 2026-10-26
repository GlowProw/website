<script setup lang="ts">
import {Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";

import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ModName from "@/components/snbWidget/modName.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import ItemView from "@/components/ItemView.vue";
import RankingRightClickMenu from "@/components/RankingRightClickMenu.vue";
import RankingDesignedItemsDataProcessing from "@/assets/sripts/ranking_designed_items_data_processing";
import {RankingAttr} from "@/assets/types/Ranking";
import {useNoticeStore} from "~/stores/noticeStore";

const props = withDefaults(
    defineProps<{ readonly?: boolean; visibleCategories?: string[] }>(),
    {
      readonly: false,
      visibleCategories: () => [],
    }
);

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const rankingDesignedItemsDataProcessing = new RankingDesignedItemsDataProcessing();

// 阶梯数据集合
const rankingData = ref([
  {
    label: "S",
    attr: {color: "#fe7f7e"},
    content: [] as any[],
  },
  {
    label: "A",
    attr: {color: "#ffbe81"},
    content: [] as any[],
  },
  {
    label: "B",
    attr: {color: "#ffff82"},
    content: [] as any[],
  },
  {
    label: "C",
    attr: {color: "#ffff83"},
    content: [] as any[],
  },
  {
    label: "D",
    attr: {color: "#7fff82"},
    content: [] as any[],
  },
  {
    label: "F",
    attr: {color: "#7fff81"},
    content: [] as any[],
  },
]);

const itemWidget = ref<InstanceType<typeof ItemView> | null>(null);
const isOpenItem = ref(false);
const itemInsertIndex = ref(0);
const itemCategory = ref<string | null>(null);

// 排行全局属性
const attr: Ref<RankingAttr> = ref({
  useVersion: RankingDesignedItemsDataProcessing.nowVersion,
});

// 物品类别对应类型名称映射
const categoryTypeMap: Record<string, string> = {
  item: "Item",
  material: "Material",
  cosmetic: "Cosmetic",
  ultimate: "Ultimate",
  modification: "Modification",
  ship: "Ship",
};

// 预设阶梯色板
const presetColors = [
  "#fe7f7e", "#ffbe81", "#ffff82", "#ffff83", "#7fff82", "#7fff81",
  "#7fd4ff", "#7faaff", "#b47fff", "#ff7fe9", "#ffffff", "#888888"
];

const noticeStore = useNoticeStore();

// 物品拖拽排序状态
const draggedSource = ref<{ rowIndex: number; itemIndex: number } | null>(null);
const dragOverPos = ref<{ rowIndex: number; itemIndex: number } | null>(null);

// 阶梯行拖拽排序状态
const draggedRowIndex = ref<number | null>(null);
const dragOverRowIndex = ref<number | null>(null);

/**
 * 开始拖拽阶梯行整体
 */
const onRowDragStart = (event: DragEvent, rowIndex: number) => {
  if (props.readonly) return;
  draggedRowIndex.value = rowIndex;
  draggedSource.value = null;
  dragOverPos.value = null;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/ranking-row", String(rowIndex));
  }
};

/**
 * 阶梯行拖拽悬停
 */
const onRowDragOver = (event: DragEvent, targetIndex: number) => {
  if (props.readonly) return;
  if (draggedRowIndex.value !== null) {
    event.preventDefault();
    if (draggedRowIndex.value !== targetIndex) {
      dragOverRowIndex.value = targetIndex;
    }
    return;
  }
  if (draggedSource.value) {
    event.preventDefault();
  }
};

/**
 * 阶梯行拖拽离开
 */
const onRowDragLeave = (event: DragEvent, targetIndex: number) => {
  if (dragOverRowIndex.value === targetIndex) {
    dragOverRowIndex.value = null;
  }
};

/**
 * 阶梯行放下重排或物品放入行尾空白处
 */
const onRowDrop = (event: DragEvent, targetIndex: number) => {
  // 如果是阶梯行拖拽
  if (draggedRowIndex.value !== null) {
    event.preventDefault();
    event.stopPropagation();
    const sourceIndex = draggedRowIndex.value;
    if (sourceIndex !== targetIndex && sourceIndex >= 0 && sourceIndex < rankingData.value.length) {
      const [movedRow] = rankingData.value.splice(sourceIndex, 1);
      rankingData.value.splice(targetIndex, 0, movedRow);
    }
    draggedRowIndex.value = null;
    dragOverRowIndex.value = null;
    return;
  }

  // 否则是物品放入行尾空白处
  onDropRow(event, targetIndex);
};

/**
 * 拖拽结束重置所有拖拽状态
 */
const onRowDragEnd = () => {
  draggedRowIndex.value = null;
  dragOverRowIndex.value = null;
  draggedSource.value = null;
  dragOverPos.value = null;
};

/**
 * 开始拖拽物品
 *
 * @param event 拖拽事件对象
 * @param rowIndex 源阶梯行
 * @param itemIndex 源物品索引
 */
const onDragStart = (event: DragEvent, rowIndex: number, itemIndex: number) => {
  if (props.readonly) return;
  draggedRowIndex.value = null;
  draggedSource.value = {rowIndex, itemIndex};
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify({rowIndex, itemIndex}));
  }
};

/**
 * 拖拽悬停在目标物品上方
 *
 * @param event 拖拽事件对象
 * @param rowIndex 目标阶梯行
 * @param itemIndex 目标物品索引
 */
const onDragOverItem = (event: DragEvent, rowIndex: number, itemIndex: number) => {
  if (props.readonly || !draggedSource.value) return;
  event.preventDefault();
  dragOverPos.value = {rowIndex, itemIndex};
};

/**
 * 拖拽离开物品
 */
const onDragLeaveItem = () => {
  dragOverPos.value = null;
};

/**
 * 放置在目标物品位置（调换或插入）
 *
 * @param event 拖拽事件对象
 * @param targetRowIndex 目标行
 * @param targetItemIndex 目标索引
 */
const onDropItem = (event: DragEvent, targetRowIndex: number, targetItemIndex: number) => {
  if (props.readonly || !draggedSource.value) return;
  event.preventDefault();
  event.stopPropagation();

  const source = draggedSource.value;
  const sourceList = rankingData.value[source.rowIndex]?.content;
  const targetList = rankingData.value[targetRowIndex]?.content;

  if (sourceList && targetList) {
    // 跨行移动时检查目标行容量（每层最多 100 件物品）
    if (source.rowIndex !== targetRowIndex && targetList.length >= 100) {
      noticeStore.warning(t("rankingDesignedItems.verify.tierItemMaxExceeded") || "单层阶梯物品数量不能超过 100 个");
      draggedSource.value = null;
      dragOverPos.value = null;
      return;
    }

    const [movedItem] = sourceList.splice(source.itemIndex, 1);
    if (movedItem) {
      targetList.splice(targetItemIndex, 0, movedItem);
    }
  }

  draggedSource.value = null;
  dragOverPos.value = null;
};

/**
 * 拖拽放入阶梯空白区域（直接追加至行尾）
 *
 * @param event 拖拽事件对象
 * @param targetRowIndex 目标行
 */
const onDropRow = (event: DragEvent, targetRowIndex: number) => {
  if (props.readonly || !draggedSource.value) return;
  event.preventDefault();

  const source = draggedSource.value;
  if (source.rowIndex === targetRowIndex && dragOverPos.value) return;

  const sourceList = rankingData.value[source.rowIndex]?.content;
  const targetList = rankingData.value[targetRowIndex]?.content;

  if (sourceList && targetList) {
    // 跨行移动时检查目标行容量（每层最多 100 件物品）
    if (source.rowIndex !== targetRowIndex && targetList.length >= 100) {
      noticeStore.warning(t("rankingDesignedItems.verify.tierItemMaxExceeded") || "单层阶梯物品数量不能超过 100 个");
      draggedSource.value = null;
      dragOverPos.value = null;
      return;
    }

    const [movedItem] = sourceList.splice(source.itemIndex, 1);
    if (movedItem) {
      targetList.push(movedItem);
    }
  }

  draggedSource.value = null;
  dragOverPos.value = null;
};

/**
 * 拖拽结束重置状态
 */
const onDragEnd = () => {
  draggedSource.value = null;
  dragOverPos.value = null;
};

/**
 * 展开物品选择器面板
 *
 * @param tags 类型标签
 * @param index 排序阶梯下标
 * @param category 物品大类
 */
const openInsertDataPanel = (tags: any[] = [], index: number, category: string) => {
  if (itemWidget.value) {
    itemInsertIndex.value = index;
    itemCategory.value = category;
    isOpenItem.value = false;

    itemWidget.value.openPanel(tags, category as any);
  }
};

/**
 * 回调插入数据
 *
 * @param id 数据标识
 */
const onInsertData = (id: string) => {
  isOpenItem.value = false;
  if (!id) return;

  const targetRow = rankingData.value[itemInsertIndex.value];
  if (!targetRow) return;

  // 单层阶梯最大 100 个物品
  if (targetRow.content.length >= 100) {
    noticeStore.warning(t("rankingDesignedItems.verify.tierItemMaxExceeded") || "单层阶梯物品数量不能超过 100 个");
    return;
  }

  const rawCat = String(itemCategory.value || "item").toLowerCase();
  const typeString = categoryTypeMap[rawCat] || "Item";

  targetRow.content.push({
    category: itemCategory.value || "item",
    _typeStringName: typeString,
    id,
  });
};

/**
 * 移除阶梯中的指定物品
 *
 * @param rowIndex 阶梯行索引
 * @param itemIndex 物品索引
 */
const onRemoveItem = (rowIndex: number, itemIndex: number) => {
  if (props.readonly) return;
  rankingData.value[rowIndex]?.content?.splice(itemIndex, 1);
};

/**
 * 移动阶梯行顺序
 *
 * @param index 阶梯行当前下标
 * @param direction 移动方向（-1 为上移，1 为下移）
 */
const moveRow = (index: number, direction: number) => {
  if (props.readonly) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= rankingData.value.length) return;

  const [row] = rankingData.value.splice(index, 1);
  rankingData.value.splice(targetIndex, 0, row);
};

/**
 * 清空指定阶梯行的所有物品
 *
 * @param index 阶梯行下标
 */
const clearRow = (index: number) => {
  if (props.readonly) return;
  rankingData.value[index].content = [];
};

/**
 * 删除指定的阶梯行
 *
 * @param index 待删除阶梯下标
 */
const deleteRow = (index: number) => {
  if (props.readonly || rankingData.value.length <= 1) return;
  rankingData.value.splice(index, 1);
};

/**
 * 新增一行阶梯（最大 20 层）
 */
const addRow = () => {
  if (props.readonly) return;
  if (rankingData.value.length >= 20) {
    noticeStore.warning(t("rankingDesignedItems.verify.tierMaxExceeded") || "阶梯层数不能超过 20 层");
    return;
  }

  const nextColor = presetColors[rankingData.value.length % presetColors.length];
  rankingData.value.push({
    label: `Tier ${rankingData.value.length + 1}`,
    attr: {color: nextColor},
    content: [],
  });
};

/**
 * 设置轮盘属性
 *
 * @param attrData
 */
const setSetting = (attrData: any) => {
  return {onLoad};
};

/**
 * 加载数据
 *
 * @param data 原始或序列化的阶梯数据
 */
const onLoad = (data: any) => {
  if (!data) return;
  const d = rankingDesignedItemsDataProcessing.import(data, attr.value.useVersion);
  if (!d || JSON.stringify(d) === "{}") return;

  const rawList = Array.isArray(d)
      ? d
      : Array.isArray(d.ranking)
          ? d.ranking
          : Array.isArray(d.data)
              ? d.data
              : null;

  if (Array.isArray(rawList)) {
    rankingData.value = rawList.map((row: any) => ({
      label: row.label || "Tier",
      attr: {
        color: row.attr?.color || "#f5a623",
      },
      content: Array.isArray(row.content)
          ? row.content.map((item: any) => {
            const cat = String(item.category || item._typeStringName || "item").toLowerCase();
            return {
              ...item,
              category: item.category || cat,
              _typeStringName: item._typeStringName || categoryTypeMap[cat] || "Item",
            };
          })
          : [],
    }));
  }
};

/**
 * 导出数据
 */
const onExport = () => {
  return rankingData.value;
};

defineExpose({
  setSetting,
  onLoad,
  onExport,
});
</script>

<template>
  <v-card border class="bg-shades-black">
    <div
        v-for="(i, index) in rankingData"
        :key="index"
        class="item-row"
        :class="{
        'row-dragging': draggedRowIndex === index,
        'row-drag-over': dragOverRowIndex === index,
      }"
        @dragover="onRowDragOver($event, index)"
        @dragleave="onRowDragLeave($event, index)"
        @drop="onRowDrop($event, index)"
    >
      <v-row no-gutters align="stretch">
        <!-- 左侧阶梯标签与定制栏 -->
        <v-col
            cols="auto"
            class="tier-header-col px-2 py-4 d-flex flex-column justify-center align-center position-relative"
            :style="`background-color:color-mix(in srgb, hsl(from ${i.attr.color} h s l) 15%, #000)`"
        >
          <!-- 非只读模式：可直接输入编辑标题与上下拖拽 -->
          <template v-if="!readonly">
            <!-- 阶梯整体上下拖拽手柄 -->
            <div class="d-flex">
              <div
                  class="tier-drag-handle d-flex align-center justify-center"
                  draggable="true"
                  @dragstart="onRowDragStart($event, index)"
                  @dragend="onRowDragEnd">
                <v-icon icon="mdi-drag-vertical" color="grey-lighten-1"></v-icon>
              </div>

              <input
                  v-model="i.label"
                  class="tier-label-input bg-transparent text-h5 font-weight-black text-center"
                  maxlength="16"
                  :placeholder="`T${index + 1}`"
                  title="点击编辑阶梯标题"
              />
            </div>
          </template>

          <!-- 只读展示模式 -->
          <template v-else>
            <div
                class="tier-label-text text-h5 font-weight-black text-center text-truncate"
                :style="{ color: i.attr.color }">
              {{ i.label }}
            </div>
          </template>
        </v-col>

        <v-divider vertical></v-divider>

        <!-- 右侧物品卡槽展示与拖拽排序区 -->
        <v-col class="pl-3">
          <v-row no-gutters align="center">
            <v-col
                v-for="(j, jIndex) in i.content"
                :key="jIndex"
                cols="auto"
                class="my-2 ml-3 position-relative item-card-box"
                :class="{
                'drag-source': draggedSource?.rowIndex === index && draggedSource?.itemIndex === jIndex,
                'drag-over': dragOverPos?.rowIndex === index && dragOverPos?.itemIndex === jIndex,
              }"
                :draggable="!readonly"
                @dragstart="onDragStart($event, index, jIndex)"
                @dragover.prevent="onDragOverItem($event, index, jIndex)"
                @dragleave="onDragLeaveItem"
                @drop="onDropItem($event, index, jIndex)"
                @dragend="onDragEnd"
            >
              <!-- 物品类型渲染 -->
              <template v-if="j._typeStringName === 'Item' || String(j.category).toLowerCase() === 'item'">
                <v-card elevation="0" class="bg-transparent" width="90">
                  <ItemSlotBase size="90px">
                    <ItemIconWidget :id="j.id" :is-open-detail="false"></ItemIconWidget>
                  </ItemSlotBase>
                  <div class="text-center mt-1 text-truncate" style="max-width: 90px;">
                    <ItemNameRarity :id="j.id">
                      <ItemName :id="j.id"></ItemName>
                    </ItemNameRarity>
                  </div>
                </v-card>
              </template>

              <!-- 材料类型渲染 -->
              <template v-else-if="j._typeStringName === 'Material' || String(j.category).toLowerCase() === 'material'">
                <v-card elevation="0" class="bg-transparent" width="90">
                  <ItemSlotBase size="90px">
                    <MaterialIconWidget :id="j.id" :is-open-detail="false"></MaterialIconWidget>
                  </ItemSlotBase>
                  <div class="text-center mt-1 text-truncate" style="max-width: 90px;">
                    <MaterialName :id="j.id"></MaterialName>
                  </div>
                </v-card>
              </template>

              <!-- 装饰品类型渲染 -->
              <template v-else-if="j._typeStringName === 'Cosmetic' || String(j.category).toLowerCase() === 'cosmetic'">
                <v-card elevation="0" class="bg-transparent" width="90">
                  <ItemSlotBase size="90px">
                    <CosmeticIconWidget :id="j.id" :is-open-detail="false"></CosmeticIconWidget>
                  </ItemSlotBase>
                  <div class="text-center mt-1 text-truncate" style="max-width: 90px;">
                    <CosmeticName :id="j.id"></CosmeticName>
                  </div>
                </v-card>
              </template>

              <!-- 绝招终极技能渲染 -->
              <template v-else-if="j._typeStringName === 'Ultimate' || String(j.category).toLowerCase() === 'ultimate'">
                <v-card elevation="0" class="bg-transparent" width="90">
                  <ItemSlotBase size="90px">
                    <UltimateIconWidget :id="j.id" :is-open-detail="false"></UltimateIconWidget>
                  </ItemSlotBase>
                  <div class="text-center mt-1 text-truncate" style="max-width: 90px;">
                    <UltimateName :id="j.id"></UltimateName>
                  </div>
                </v-card>
              </template>

              <!-- 模组类型渲染 -->
              <template v-else-if="j._typeStringName === 'Modification' || String(j.category).toLowerCase() === 'modification'">
                <v-card elevation="0" class="bg-transparent" width="90">
                  <ItemSlotBase size="90px">
                    <ModIconWidget :id="j.id" :is-open-detail="false"></ModIconWidget>
                  </ItemSlotBase>
                  <div class="text-center mt-1 text-truncate" style="max-width: 90px;">
                    <ModName :id="j.id" :grade="j.grade"></ModName>
                  </div>
                </v-card>
              </template>

              <!-- 兜底通用物品渲染 -->
              <template v-else>
                <v-card elevation="0" class="bg-transparent" width="90">
                  <ItemSlotBase size="90px">
                    <ItemIconWidget :id="j.id" :is-open-detail="false"></ItemIconWidget>
                  </ItemSlotBase>
                  <div class="text-center mt-1 text-truncate" style="max-width: 90px;">
                    <ItemNameRarity :id="j.id">
                      <ItemName :id="j.id"></ItemName>
                    </ItemNameRarity>
                  </div>
                </v-card>
              </template>

              <!-- 工坊编辑删除按钮 -->
              <v-btn
                  v-if="!readonly"
                  icon="mdi-close"
                  size="x-small"
                  color="error"
                  variant="flat"
                  class="item-delete-btn"
                  @click.stop="onRemoveItem(index, jIndex)"
              ></v-btn>
            </v-col>

            <!-- 添加新物品按钮 -->
            <v-col v-if="!readonly" cols="auto" class="my-2 ml-3">
              <FullItemRightClickMenu></FullItemRightClickMenu>
              <RankingRightClickMenu
                  :visible-categories="visibleCategories"
                  @clickMenuItem="(data) => openInsertDataPanel(data.tags, index, data.category)">
                <v-card
                    width="99px"
                    height="99px"
                    class="d-flex flex-column justify-center align-center cursor-pointer add-slot-card">
                  <v-icon size="32" color="amber">mdi-plus</v-icon>
                  <span class="text-caption text-medium-emphasis mt-1">添加物品</span>
                </v-card>
              </RankingRightClickMenu>
            </v-col>
          </v-row>

          <v-divider opacity=".1" v-if="index < rankingData.length - 1"></v-divider>
        </v-col>

        <v-divider vertical></v-divider>
        <v-col cols="auto" class="px-2 d-flex flex-column ga-2 justify-center align-center">
          <!-- 调色盘菜单 -->
          <v-menu location="bottom start" :close-on-content-click="true">
            <template #activator="{ props: menuProps }">
              <div
                  v-bind="menuProps"
                  class="color-indicator cursor-pointer"
                  :style="{ backgroundColor: i.attr.color }"
              ></div>
            </template>
            <v-card border class="bg-grey-darken-4">
              <v-color-picker v-model="i.attr.color" elevation="0"></v-color-picker>
            </v-card>
          </v-menu>

          <!-- 行操作菜单 -->
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                  v-bind="menuProps"
                  icon="mdi-cog-outline"
                  size="x-small"
                  variant="text"
                  color="grey-lighten-1"
              ></v-btn>
            </template>
            <v-list min-width="260" class="pa-1" border rounded="lg">
              <v-list-item
                  prepend-icon="mdi-arrow-up"
                  :disabled="index === 0"
                  @click="moveRow(index, -1)"
              >
                <v-list-item-title>上移阶梯</v-list-item-title>
              </v-list-item>
              <v-list-item
                  prepend-icon="mdi-arrow-down"
                  :disabled="index === rankingData.length - 1"
                  @click="moveRow(index, 1)"
              >
                <v-list-item-title>下移阶梯</v-list-item-title>
              </v-list-item>
              <v-list-item
                  prepend-icon="mdi-broom"
                  :disabled="!i.content.length"
                  @click="clearRow(index)"
              >
                <v-list-item-title>清空本行物品</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1"></v-divider>
              <v-list-item
                  prepend-icon="mdi-delete-outline"
                  :disabled="rankingData.length <= 1"
                  class="text-error"
                  @click="deleteRow(index)"
              >
                <v-list-item-title>删除此阶梯</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-col>
      </v-row>
    </div>

    <!-- 非只读模式：底部新增阶梯栏 -->
    <div v-if="!readonly" class="pa-3 text-center bg-grey-darken-4">
      <v-btn
          variant="tonal"
          color="amber"
          prepend-icon="mdi-plus"
          class="text-none font-weight-bold"
          @click="addRow"
      >
        新增自定义评级阶梯
      </v-btn>
    </div>
  </v-card>

  <ItemView
      ref="itemWidget"
      @finish="(id) => onInsertData(id)"
      @close="() => (isOpenItem = false)"
  />
</template>

<style scoped lang="less">
.tier-header-col {
  width: 120px;
  min-width: 120px;
}

.tier-label-input {
  width: 100%;
  border: none;
  outline: none;
  transition: border-color 0.2s ease;
}

.tier-label-text {
  max-width: 100px;
}

.color-indicator {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

.color-palette-grid {
  display: grid;
  grid-template-columns: repeat(4, 26px);
  gap: 6px;
}

.palette-color-item {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    transform: scale(1.1);
  }
}

.item-card-box {
  position: relative;
  cursor: grab;
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:active {
    cursor: grabbing;
  }

  &.drag-source {
    opacity: 0.4;
    transform: scale(0.95);
  }

  &.drag-over {
    outline: 2px dashed #ffc107;
    border-radius: 6px;
  }

  &:hover .item-delete-btn {
    opacity: 1;
    pointer-events: auto;
  }
}

.item-delete-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px !important;
  height: 22px !important;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
  z-index: 5;
}

.add-slot-card {
  border-color: rgba(255, 255, 255, 0.2) !important;
  background: rgba(255, 255, 255, 0.02);

  &:hover {
    border-color: #ffc107 !important;
    background: rgba(255, 193, 7, 0.08);
  }
}

.item-row {
  transition: all 0s cubic-bezier(0.4, 0, 0.2, 1);

  &.row-dragging {
    opacity: 0.35;
    outline: 2px dashed rgba(255, 193, 7, 0.5);
  }

  &.row-drag-over {
    outline: 2px solid var(--main-color, #ffc107);
    box-shadow: 0 0 16px rgba(255, 193, 7, 0.35);
    transform: translateY(-2px);
  }
}

.tier-drag-handle {
  cursor: grab;
  transition: background 0.15s ease;

  &:active {
    cursor: grabbing;
  }
}
</style>
