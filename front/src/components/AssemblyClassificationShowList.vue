<script setup lang="ts">
import { Cosmetic, Cosmetics, Item, Items, Material, Materials, Modification, Modifications, Ships, Ultimate, Ultimates } from "glow-prow-data";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useI18nUtils } from "@/assets/sripts/i18n_util";
import { storageCollect } from "@/assets/sripts/index";
import { StorageCollectType } from "@/assets/sripts/storage_collect";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";

import EmptyView from "@/components/EmptyView.vue";
import ItemDamageTypeWidget from "@/components/snbWidget/itemDamageTypeWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ModName from "@/components/snbWidget/modName.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";

interface GroupedData {
  type: string;
  model: boolean;
  child: AvailableDataStructure[];
}

type AvailableDataStructure = Ship | Item | Material | Cosmetic | Ultimate | Modification;

const props = withDefaults(
    defineProps<{
      tags: string[];
      sortBy?: "id" | "rarity" | "tier";
      loadDataType?: "ship" | "item" | "material" | "cosmetic" | "ultimate" | "modification";
      filterType?: string;
      modelValue: any;
      autoExpandFirst?: boolean; // 新增：是否自动展开第一个分类
    }>(),
    {
      tags: [],
      sortBy: "rarity",
      loadDataType: "item",
      filterType: "",
      modelValue: "",
      autoExpandFirst: true, // 默认展开第一个分类
    }
);

const { asString, sanitizeString } = useI18nUtils();
const { t } = useI18n();
const resultData = ref<GroupedData[]>([]);
const emit = defineEmits(['update:modelValue', 'clickSelectItem']);

// 搜索相关状态
const searchQuery = ref('');
const sortBy = ref('');
const filterType = ref('');

// 加载状态
const isLoading = ref(false);

// 加载源数据
const rawData = computed(() => {
  switch (props.loadDataType) {
    case "ship":
      return Ships;
    case "item":
      return Items;
    case "material":
      return Materials;
    case "cosmetic":
      return Cosmetics;
    case "ultimate":
      return Ultimates;
    case "modification":
      return Modifications;
    default:
      return {};
  }
});

// 缓存名称映射
const nameCache = new Map();

/**
 * 处理物品名称（带缓存）
 */
const handleIDataName = (id: string) => {
  if (nameCache.has(id)) {
    return nameCache.get(id);
  }

  const rawId = id;
  const sanitizeId = sanitizeString(id).cleaned;

  const name = asString([
    `snb.items.${rawId}.name`,
    `snb.items.${sanitizeId}.name`,
    `snb.materials.${rawId}.name`,
    `snb.materials.${sanitizeId}.name`,
    `snb.cosmetics.${rawId}.name`,
    `snb.cosmetics.${sanitizeId}.name`,
    `snb.ultimates.${rawId}.name`,
    `snb.ultimates.${sanitizeId}.name`,
    `snb.modifications.${rawId}.name`,
    `snb.modifications.${sanitizeId}.name`
  ]);

  nameCache.set(id, name);
  return name;
};

// 计算属性：处理筛选、排序和搜索
const processedData = computed(() => {
  let filtered = props.tags.length > 0
      ? Object.values(rawData.value).filter(i => props.tags.includes(i?.type))
      : Object.values(rawData.value);

  // 类型筛选
  if (filterType.value) {
    filtered = filtered.filter(i => i.type === filterType.value);
  }

  // 转换格式并添加name字段
  const mapped = filtered.map(i => ({
    ...rawData.value[i.id],
    name: handleIDataName(i.id),
    rarity: i.rarity || 0,
  }));

  // 搜索过滤
  const searched = searchQuery.value
      ? mapped.filter(d =>
          d.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          d.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
      : mapped;

  // 排序
  return sortItems(searched, sortBy.value);
});

const starData = ref<AvailableDataStructure[]>([]);
const isStar = computed(() => props.loadDataType === 'item');

const processedStarData = computed(() => {
  return starData.value.filter(i => props.tags.includes(i.type));
});

let updateTimeout: number;

watch([searchQuery, filterType, sortBy], () => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(updateData, 300);
});

onMounted(() => {
  sortBy.value = props.sortBy;
  filterType.value = props.filterType;
  loadStarData();
  updateData();
});

/**
 * 加载收藏数据
 */
const loadStarData = () => {
  const collects = storageCollect.gets(StorageCollectType.Item);
  if (collects.code === 0) {
    starData.value = collects.data.map(i => ({
      ...rawData.value[i.id],
      name: handleIDataName(i.id)
    }));
  }
};

/**
 * 更新数据（防抖处理）
 */
const updateData = () => {
  isLoading.value = true;

  // 使用 requestAnimationFrame 避免阻塞主线程
  requestAnimationFrame(() => {
    const grouped = groupByType(processedData.value);

    // 自动展开第一个分类
    if (props.autoExpandFirst && grouped.length > 0) {
      grouped[0].model = true;
    }

    resultData.value = grouped;
    isLoading.value = false;
  });
};

/**
 * 排序函数
 */
function sortItems(data: any[], sortBy: string): any[] {
  const sorted = [...data];

  switch (sortBy) {
    case "rarity":
      return sorted.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
    case "tier":
      return sorted.sort((a, b) => (b.tier || 0) - (a.tier || 0));
    case "id":
    default:
      return sorted.sort((a, b) => a.id.localeCompare(b.id));
  }
}

/**
 * 分组函数
 */
function groupByType(data: AvailableDataStructure[]): GroupedData[] {
  const typeMap = new Map<string, AvailableDataStructure[]>();

  data.forEach(d => {
    if (!typeMap.has(d.type)) {
      typeMap.set(d.type, []);
    }
    typeMap.get(d.type)?.push(d);
  });

  return Array.from(typeMap.entries()).map(([type, child]) => ({
    type,
    model: false,
    child,
  }));
}

/**
 * 首字母大写
 */
const capitalizeFLetter = (str: string) => {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
};

/**
 * 单击事件
 */
const onClickEvent = (data: AvailableDataStructure) => {
  if (props.modelValue && props.modelValue.id === data.id) return;

  emit('update:modelValue', data);
  emit('clickSelectItem', data);
};

/**
 * 收藏物品
 */
const onStarItem = (data: AvailableDataStructure) => {
  const index = starData.value.findIndex(i => i.id === data.id);

  if (index >= 0) {
    storageCollect.delete(data.id, StorageCollectType.Item);
    starData.value.splice(index, 1);
  } else {
    storageCollect.updata(
        { collectTime: Date.now() },
        StorageCollectType.Item,
        data.id
    );
    starData.value.push({
      ...rawData.value[data.id],
      name: handleIDataName(data.id)
    });
  }
};

/**
 * 是否收藏品
 */
const isCollect = (id: string) => {
  return starData.value.some(i => i.id === id);
};

/**
 * 切换分类展开状态
 */
const toggleCategory = (category: GroupedData) => {
  category.model = !category.model;
};

defineExpose({
  updateData,
});
</script>

<template>
  <div class="w-100">
    <!-- 选择头 S -->
    <v-row class="mb-1 pl-8 pr-8">
      <v-col cols="6">
        <v-text-field
            variant="underlined"
            v-model="searchQuery"
            hide-details
            clearable
            :loading="isLoading"
            @keydown.enter="updateData"
        >
          <template v-slot:append-inner>
            <v-icon @click="updateData">mdi-magnify</v-icon>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="3">
        <v-select
            variant="underlined"
            v-model="filterType"
            item-value="value"
            item-title="text"
            :items="[
            { value: '', text: t('assembly.workshop.filter.all') },
            ...props.tags.map(tag => ({
              value: tag,
              text: t(`codex.types.${tag}`)
            }))
          ]"
            :label="t('assembly.workshop.filter.byType')"
            @update:modelValue="updateData"
            hide-details
            clearable
        ></v-select>
      </v-col>
      <v-col cols="3">
        <v-select
            variant="underlined"
            v-model="sortBy"
            item-value="value"
            item-title="text"
            :items="[
            { value: 'id', text: t('assembly.workshop.filter.byId') },
            { value: 'rarity', text: t('assembly.workshop.filter.byRarity') },
            { value: 'tier', text: t('assembly.workshop.filter.byTier') }
          ]"
            :label="t('assembly.workshop.filter.byTitle', { key: t(`assembly.workshop.filter.by${capitalizeFLetter(sortBy)}`) })"
            hide-details
            @update:modelValue="updateData"
        ></v-select>
      </v-col>
    </v-row>
    <!-- 选择头 E -->

    <v-divider thickness="1" color="#000" class="mb-n1"></v-divider>

    <div class="bg-shades-black background-flavor w-100 overflow-y-auto overflow-x-hidden" style="max-height: 70vh">
      <!-- 我的最爱 S -->
      <div class="w-100 pb-3" v-if="isStar && processedStarData.length > 0">
        <div class="text-center title-long-flavor text-amber font-weight-bold bg-black pl-4 lr-4 pt-2 pb-2 ml-n2 mr-n2 mb-4">
          {{ t('assembly.workshop.myFavorites') }} ({{ processedStarData.length }})
        </div>

        <v-row class="pl-8 pr-8">
          <v-col v-for="(j, jIndex) in processedStarData" :key="`star-${j.id}`" cols="auto">
            <div @click="onClickEvent(j)" class="item">
              <ItemSlotBase
                  size="90px"
                  :class="[modelValue && modelValue.id === j.id ? 'bg-amber' : '']"
              >
                <ItemIconWidget
                    :id="j.id"
                    :is-show-tooltip="false"
                    :is-open-detail="false"
                ></ItemIconWidget>
              </ItemSlotBase>
              <div
                  class="text-center d-flex justify-center"
                  style="width: 90px"
                  :class="[modelValue && modelValue.id === j.id ? 'text-amber' : '']"
              >
                <div class="singe-line">
                  <ItemName :data="j"/>
                </div>
              </div>
            </div>

            <div class="text-center mt-1">
              <div class="d-flex justify-center">
                <ItemDamageTypeWidget :data="j" sizeType="mini"></ItemDamageTypeWidget>
              </div>
              <v-btn
                  class="text-amber"
                  density="compact"
                  variant="text"
                  icon
                  @click.stop="onStarItem(j)"
              >
                <v-icon :icon="`mdi-${isCollect(j.id) ? 'star' : 'star-outline'}`" size="15"></v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </div>
      <!-- 我的最爱 E -->

      <!-- 可选物品 S -->
      <div>
        <!-- 物品展示 -->
        <div v-if="resultData.length > 0">
          <div
              v-for="(category, index) in resultData"
              :key="category.type"
              :class="{ 'mb-8': category.model }"
          >
            <div
                class="cursor-pointer text-center title-long-flavor text-amber font-weight-bold bg-black pl-4 lr-4 pt-4 pb-4 ml-n2 mr-n2"
                :class="{ 'mb-4': category.model }"
                @click="toggleCategory(category)"
            >
              {{ t(`codex.types.${category.type}`) }} ({{ category.child.length }})
              <v-icon class="ml-3">
                {{ category.model ? 'mdi-triangle-small-up' : 'mdi-triangle-small-down' }}
              </v-icon>
            </div>

            <v-row class="pl-8 pr-8" v-if="category.model">
              <v-col
                  cols="auto"
                  v-for="item in category.child"
                  :key="item.id"
                  :title="item.name"
              >
                <div @click="onClickEvent(item)" class="item">
                  <!-- 根据类型渲染不同的组件 -->
                  <template v-if="loadDataType === 'ship'">
                    <ItemSlotBase
                        size="90px"
                        :class="[modelValue && modelValue.id === item.id ? 'bg-amber' : '']"
                    >
                      <ShipIconWidget
                          :id="item.id"
                          :is-show-tooltip="false"
                          :is-open-detail="false"
                          :is-show-open-detail="false"
                          :is-click-open-detail="false"
                      ></ShipIconWidget>
                    </ItemSlotBase>
                    <div
                        class="text-center d-flex justify-center"
                        style="width: 90px"
                        :class="[modelValue && modelValue.id === item.id ? 'text-amber' : '']"
                    >
                      <div class="singe-line">
                        <ShipName :data="item"/>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="loadDataType === 'item'">
                    <ItemSlotBase
                        size="90px"
                        :class="[modelValue && modelValue.id === item.id ? 'bg-amber' : '']"
                    >
                      <ItemIconWidget
                          :id="item.id"
                          :is-show-tooltip="false"
                          :is-open-detail="false"
                      ></ItemIconWidget>
                    </ItemSlotBase>
                    <div
                        class="text-center d-flex justify-center"
                        style="width: 90px"
                        :class="[modelValue && modelValue.id === item.id ? 'text-amber' : '']"
                    >
                      <div class="singe-line">
                        <ItemName :data="item"/>
                      </div>
                    </div>
                  </template>

                  <!-- 其他类型的模板... -->
                </div>

                <div class="text-center mt-1" v-if="isStar">
                  <div class="d-flex justify-center">
                    <ItemDamageTypeWidget :data="item" sizeType="mini"></ItemDamageTypeWidget>
                  </div>
                  <v-btn
                      class="text-amber"
                      density="compact"
                      variant="text"
                      icon
                      @click.stop="onStarItem(item)"
                  >
                    <v-icon :icon="`mdi-${isCollect(item.id) ? 'star' : 'star-outline'}`" size="15"></v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div v-else class="pt-5 pb-5 text-center w-100">
          <v-icon size="64" color="grey">mdi-magnify-close</v-icon>
          <div class="mt-4">
            <EmptyView></EmptyView>
          </div>
        </div>
      </div>
      <!-- 可选物品 E -->
    </div>
  </div>
</template>

<style scoped lang="less">
.item {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.singe-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}
</style>
