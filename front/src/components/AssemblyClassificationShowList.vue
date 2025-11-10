<script setup lang="ts">
import {Cosmetic, Cosmetics, Item, Items, Material, Materials, Modification, Modifications, Ships, Ultimate, Ultimates} from "glow-prow-data";
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {storageCollect} from "@/assets/sripts/index";
import {StorageCollectType} from "@/assets/sripts/storage_collect";

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

type AvailableDataStructure = Ship | Item | Material | Cosmetic | Ultimate | Modification

const props = withDefaults(
        defineProps<{
          tags: string[];
          sortBy?: "id" | "rarity" | "tier";
          loadDataType?: "ship" | "item" | "material" | "cosmetic" | "ultimate" | "modification",
          filterType?: string;
          modelValue: any
        }>(),
        {
          tags: [],
          sortBy: "rarity",
          loadDataType: "item",
          filterType: "",
          modelValue: "",
        }
    ),
    {asString, sanitizeString} = useI18nUtils(),
    {t} = useI18n(),
    resultData = ref<GroupedData[]>([]),
    emit = defineEmits(['update:modelValue', 'clickSelectItem'])

let // 搜索相关状态
    searchQuery = ref(''),
    sortBy = ref(''),
    filterType = ref(''),

    // 加载源数据
    rawData = computed(() => {
      switch (props.loadDataType) {
        case "ship":
          return Ships;
        case "item":
          return Items;
        case "material":
          return Materials
        case "cosmetic":
          return Cosmetics
        case "ultimate":
          return Ultimates
        case "modification":
          return Modifications
      }
    }),

    // 计算属性：处理筛选、排序和搜索
    processedData = computed(() => {
      let filtered = props.tags.length > 0 ?
          Object.values(rawData.value).filter(
              (i) => props.tags.indexOf(i?.type) >= 0
          ) :
          Object.values(rawData.value);

      // 类型筛选
      if (filterType.value) {
        filtered = filtered.filter((i) => i.type === filterType.value);
      }

      // 转换格式并添加name字段
      const mapped = filtered.map((i) => ({
        ...rawData.value[i.id],
        name: handleIDataName(i.id),
        rarity: i.rarity || 0,
      }));

      // 搜索过滤
      const searched = searchQuery.value
          ? mapped.filter(d => d.id.toLowerCase().includes(searchQuery.value.toLowerCase()) || d.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
          : mapped;

      // 排序
      return sortItems(searched, sortBy.value);
    }),

    // 处理后最后数据
    processedStarData = computed(() => {
      return starData.value.filter((i) => props.tags.indexOf(i.type) >= 0)
    }),

    // 最爱数据
    starData = ref([]),
    isStar = computed(() => {
      return props.loadDataType == 'item'
    });

onMounted(() => {
  sortBy.value = props.sortBy;
  filterType.value = props.filterType;

  let collects = storageCollect.gets(StorageCollectType.Item)

  if (collects.code == 0)
    starData.value = collects.data.map(i => {
      return {
        ...rawData.value[i.id],
        name: handleIDataName(i.id)
      }
    });

  updateData();
});

/**
 * 更新数据
 */
const updateData = () => {
  resultData.value = groupByType(processedData.value);
};

/**
 * 排序函数
 * @param data
 * @param sortBy
 */
function sortItems(data: any[], sortBy: string): any[] {
  switch (sortBy) {
    case "rarity":
      return [...data].sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
    case "tier":
      return [...data].sort((a, b) => b.tier - a.tier);
    case "id":
    default:
      return [...data].sort((a, b) => a.id.localeCompare(b.id));
  }
}

/**
 * 处理物品名称
 * @param id
 */
const handleIDataName = (id: string | any) => {
  const rawId = id,
      sanitizeId = sanitizeString(id).cleaned

  return asString([
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
}

/**
 * 分组函数
 * @param data
 */
function groupByType(data: AvailableDataStructure[]): GroupedData[] {
  const typeMap = new Map<string, AvailableDataStructure[]>();

  data.forEach((d) => {
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
 * 首大写
 * @param str
 */
const capitalizeFLetter = (str: string) => {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
};

/**
 * 单击事件
 * @param data
 */
const onClickEvent = (data: AvailableDataStructure) => {
  if (props.modelValue && props.modelValue.id == data.id)
    return;

  emit('update:modelValue', data)
  emit('clickSelectItem', data)
}

/**
 * 收藏物品
 * @param data
 */
const onStarItem = (data: AvailableDataStructure) => {
  let index = starData.value.findIndex(i => i.id == data.id)

  if (index >= 0) {
    storageCollect.delete(data.id, StorageCollectType.Item)
    starData.value.splice(index, 1)
    return;
  }

  storageCollect.updata(
      {collectTime: new Date().getTime()},
      StorageCollectType.Item,
      data.id
  )

  starData.value.push({
    ...rawData.value[data.id],
    name: handleIDataName(data.id)
  })
}

/**
 * 是否收藏品
 * @param id
 */
const isCollect = (id: string | any) => {
  if (!starData.value || starData.value.length < 0)
    return false;
  return starData.value.findLast(i => i.id == id)
}

defineExpose({
  updateData,
})
</script>

<template>
  <keep-alive>
    <div class="w-100">
      <!-- 选择头 S -->
      <v-row class="mb-1 pl-8 pr-8">
        <v-col cols="6">
          <v-text-field
              variant="underlined"
              v-model="searchQuery"
              hide-details
              clearable
              @click:clear="updateData"
              @keydown.enter="updateData">
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
              :label="t('assembly.workshop.filter.byTitle', {key: t(`assembly.workshop.filter.by${capitalizeFLetter(sortBy)}`)})"
              hide-details
              @update:modelValue="updateData"
          ></v-select>
        </v-col>
      </v-row>
      <!-- 选择头 E -->

      <v-divider thickness="1" color="#000" class="mb-n1"></v-divider>

      <div class="bg-shades-black background-flavor w-100 overflow-y-auto overflow-x-hidden" style="max-height: 70vh">
        <!-- 我的最爱 S -->
        <div class="w-100 pb-3" v-if="isStar && starData.length > 0">
          <div class="text-center title-long-flavor text-amber font-weight-bold bg-black pl-4 lr-4 pt-2 pb-2 ml-n2 mr-n2 mb-4">
            我的最爱 ({{ processedStarData.length || 0 }})
          </div>

          <v-row class="pl-8 pr-8" v-if="processedStarData.length > 0">
            <v-col v-for="(j,jIndex) in processedStarData" :key="jIndex" cols="auto">
              <div @click="onClickEvent(j)" class="item">
                <template v-if="loadDataType == 'item'">
                  <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                    <ItemIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></ItemIconWidget>
                  </ItemSlotBase>
                  <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                    <div class="singe-line">
                      <ItemName :data="j"/>
                    </div>
                  </div>
                </template>
                <template v-else-if="loadDataType == 'material'">
                  <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                    <MaterialIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></MaterialIconWidget>
                  </ItemSlotBase>
                  <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                    <div class="singe-line">
                      <MaterialName :id="j.id"/>
                    </div>
                  </div>
                </template>
                <template v-else-if="loadDataType == 'cosmetic'">
                  <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                    <CosmeticIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></CosmeticIconWidget>
                  </ItemSlotBase>
                  <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                    <div class="singe-line">
                      <CosmeticName :id="j.id"/>
                    </div>
                  </div>
                </template>
              </div>

              <div class="text-center mt-1">
                <div class="d-flex justify-center">
                  <ItemDamageTypeWidget :data="j" size="mini"></ItemDamageTypeWidget>
                </div>
                <v-btn class="text-amber" density="compact" variant="text" icon @click="onStarItem(j)">
                  <v-icon :icon="`mdi-${isCollect(j.id) ? 'star' : 'star-outline'}`" size="15"></v-icon>
                </v-btn>
              </div>
            </v-col>
          </v-row>
          <div v-else>
            <EmptyView></EmptyView>
          </div>
        </div>
        <!-- 我的最爱 E -->

        <!-- 可选物品 S -->
        <div>
          <!-- 物品展示 -->
          <div v-if="resultData.length > 0">
            <div v-for="(i, index) in resultData"
                 :key="index"
                 :class="{
                   'mb-8': i.model
                 }">
              <div class="cursor-pointer text-center title-long-flavor text-amber font-weight-bold bg-black pl-4 lr-4 pt-4 pb-4 ml-n2 mr-n2"
                   :class="{'mb-4': i.model}"
                   @click="i.model = !i.model">
                {{ t(`codex.types.${i.type}`) }} ({{ i.child.length || 0 }})
                <v-icon class="ml-3">{{ !i.model ? 'mdi-triangle-small-down' : 'mdi-triangle-small-up' }}</v-icon>
              </div>

              <v-row class="pl-8 pr-8" v-if="i.model">
                <v-col cols="auto" v-for="(j, jIndex) in i.child" :key="jIndex" :title="j.name">
                  <div @click="onClickEvent(j)" class="item">
                    <template v-if="loadDataType == 'ship'">
                      <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                        <ShipIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false" :is-show-open-detail="false" :is-click-open-detail="false"></ShipIconWidget>
                      </ItemSlotBase>
                      <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                        <div class="singe-line">
                          <ShipName :data="j"/>
                        </div>
                      </div>
                    </template>

                    <template v-if="loadDataType == 'item'">
                      <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                        <ItemIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></ItemIconWidget>
                      </ItemSlotBase>
                      <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                        <div class="singe-line">
                          <ItemName :data="j"/>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="loadDataType == 'material'">
                      <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                        <MaterialIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></MaterialIconWidget>
                      </ItemSlotBase>
                      <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                        <div class="singe-line">
                          <MaterialName :id="j.id"/>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="loadDataType == 'cosmetic'">
                      <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                        <CosmeticIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></CosmeticIconWidget>
                      </ItemSlotBase>
                      <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                        <div class="singe-line">
                          <CosmeticName :id="j.id"/>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="loadDataType == 'ultimate'">
                      <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                        <UltimateIconWidget :id="j.id" :is-show-tooltip="false" :is-click-open-detail="false"></UltimateIconWidget>
                      </ItemSlotBase>
                      <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                        <div class="singe-line">
                          <UltimateName :id="j.id"/>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="loadDataType == 'modification'">
                      <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                        <ModIconWidget :id="j.id" :is-show-tooltip="false" :is-click-open-detail="false"></ModIconWidget>
                      </ItemSlotBase>
                      <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                        <div class="singe-line">
                          <ModName :id="j.id" :grade="j.grade"/>
                        </div>
                      </div>
                    </template>
                  </div>

                  <div class="text-center mt-1" v-if="isStar">
                    <div class="d-flex justify-center">
                      <ItemDamageTypeWidget :data="j" size="mini"></ItemDamageTypeWidget>
                    </div>
                    <v-btn class="text-amber" density="compact" variant="text" icon @click="onStarItem(j)" v-if="isStar">
                      <v-icon :icon="`mdi-${isCollect(j.id) ? 'star' : 'star-outline'}`" size="15"></v-icon>
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </div>
          </div>

          <!-- 无结果提示 S -->
          <div v-else class="pt-5 pb-5 text-center w-100">
            <v-icon size="64" color="grey">mdi-magnify-close</v-icon>
            <div class="mt-4">
              <EmptyView></EmptyView>
            </div>
          </div>
          <!-- 无结果提示 E -->
        </div>
        <!-- 可选物品 E -->
      </div>
    </div>
  </keep-alive>
</template>

<style scoped lang="less">
.item {
  cursor: pointer;
}
</style>
