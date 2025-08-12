<script setup lang="ts">
import {Items} from "glow-prow-data";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {computed, onMounted, ref} from "vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18nUtil";
import {number, storageCollect} from "@/assets/sripts/index";
import EmptyView from "@/components/EmptyView.vue";
import {StorageCollectType} from "@/assets/sripts/storage_collect";

interface Item {
  id: string;
  tier: number;
  label: string;
  type: string;
  rarity?: number;
  name: string;
}

interface GroupedItem {
  type: string;
  child: Item[];
}

const props = withDefaults(
        defineProps<{
          tags: string[];
          sortBy?: "id" | "rarity" | "tier";
          filterType?: string;
          modelValue: any
        }>(),
        {
          tags: [],
          sortBy: "rarity",
          filterType: "",
          modelValue: "",
        }
    ),
    {asString, sanitizeString} = useI18nUtils(),
    {t} = useI18n(),
    items = Items,
    resultItems = ref<GroupedItem[]>([]),
    emit = defineEmits(['update:modelValue', 'clickSelectItem'])

let // 搜索相关状态
    searchQuery = ref(''),
    sortBy = ref(''),
    filterType = ref(''),

    // 计算属性：处理筛选、排序和搜索
    processedItems = computed(() => {
      let filtered = props.tags.length > 0 ? Object.values(items).filter(
          (i) => props.tags.indexOf(i.type) >= 0
      ) : Object.values(items);

      // 类型筛选
      if (filterType.value) {
        filtered = filtered.filter((i) => i.type === filterType.value);
      }

      // 转换格式并添加name字段
      const mapped = filtered.map((i) => ({
        id: i.id,
        name: handleItemName(i.id),
        tier: i.tier,
        type: i.type,
        rarity: i.rarity || 0,
      }));

      // 搜索过滤
      const searched = searchQuery.value
          ? mapped.filter(item => item.id.toLowerCase().includes(searchQuery.value.toLowerCase()) || item.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
          : mapped;

      // 排序
      return sortItems(searched, sortBy.value);
    }),
    processedStarItems = computed(() => {
      return starItem.value.filter((i) => props.tags.indexOf(i.type) >= 0)
    }),

    starItem = ref([]);

onMounted(() => {
  sortBy.value = props.sortBy;
  filterType.value = props.filterType;
  let itemCollect = storageCollect.gets(StorageCollectType.Item)
  if (itemCollect.code == 0)
    starItem.value = itemCollect.data.map(i => {
      return {
        ...items[i.id],
        name: handleItemName(i.id)
      }
    });
  updateData();
});

/**
 * 更新数据
 */
const updateData = () => {
  resultItems.value = groupByType(processedItems.value);
};

/**
 * 排序函数
 * @param items
 * @param sortBy
 */
function sortItems(items: Item[], sortBy: string): Item[] {
  switch (sortBy) {
    case "rarity":
      return [...items].sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
    case "tier":
      return [...items].sort((a, b) => b.tier - a.tier);
    case "id":
    default:
      return [...items].sort((a, b) => a.id.localeCompare(b.id));
  }
}

/**
 * 处理物品名称
 */
const handleItemName = (id) => {
  return asString([`snb.items.${id}.name`, `snb.items.${sanitizeString(id).cleaned}.name`]);
}

/**
 * 分组函数
 * @param items
 */
function groupByType(items: Item[]): GroupedItem[] {
  const typeMap = new Map<string, Item[]>();

  items.forEach((item) => {
    if (!typeMap.has(item.type)) {
      typeMap.set(item.type, []);
    }
    typeMap.get(item.type)?.push(item);
  });

  return Array.from(typeMap.entries()).map(([type, child]) => ({
    type,
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
const onClickEvent = (data: Item) => {
  if (props.modelValue && props.modelValue.id == data.id)
    return;

  emit('update:modelValue', data)
  emit('clickSelectItem', data)
}

/**
 * 收藏物品
 */
const onStarItem = (data: Item) => {
  let index = starItem.value.findIndex(i => i.id == data.id)

  if (index >= 0) {
    storageCollect.delete(data.id, StorageCollectType.Item)
    starItem.value.splice(index, 1)
    return;
  }

  storageCollect.updata(
      {collectTime: new Date().getTime()},
      StorageCollectType.Item,
      data.id
  )
  starItem.value.push({
    ...items[data.id],
    name: handleItemName(data.id)
  })
}

const isCollect = (id) => {
  if (!starItem.value || starItem.value.length < 0)
    return false;
  return starItem.value.findLast(i => i.id == id)
}

defineExpose({
  updateData,
})
</script>

<template>
  <keep-alive>
    <div>
      <v-row class="mb-1 pl-8 pr-8">
        <v-col cols="6">
          <v-text-field
              variant="underlined"
              v-model="searchQuery"
              hide-details
              prepend-inner-icon="mdi-magnify"
              clearable
              @update:modelValue="updateData"
          ></v-text-field>
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
              text: t(`displayCabinet.type.${tag}`)
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
      <v-divider thickness="1" color="#000" class="mb-n1"></v-divider>

      <div class="bg-shades-black background-flavor w-100 overflow-y-auto overflow-x-hidden" style="max-height: 50vh">
        <div class="w-100 pb-3" v-if="starItem.length > 0">
          <div class="text-center title-long-flavor text-amber font-weight-bold bg-black pl-4 lr-4 pt-2 pb-2 ml-n2 mr-n2 mb-4">
            我的最爱 ({{processedStarItems.length || 0}})
          </div>

          <v-row class="pl-8 pr-8" v-if="processedStarItems.length > 0">
            <v-col v-for="(j,jIndex) in processedStarItems" :key="jIndex" cols="auto">
              <div @click="onClickEvent(j)" class="item">
                <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                  <ItemIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></ItemIconWidget>
                </ItemSlotBase>
                <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                  <div class="singe-line">
                    {{ j.name }}
                  </div>
                  <span>{{ number.intToRoman(j.tier || 1) }}</span>
                </div>
              </div>

              <div class="text-center mt-1">
                <v-btn class="text-amber" density="compact" variant="text" icon @click="onStarItem(j)">
                  <v-icon :icon="`mdi-${isCollect(j.id) ? 'star' : 'star-outline'}`" size="12"></v-icon>
                </v-btn>
              </div>
            </v-col>
          </v-row>
          <div v-else>
            <EmptyView></EmptyView>
          </div>
        </div>

        <div>
          <!-- 物品展示 -->
          <div v-if="resultItems.length > 0">
            <div v-for="(i, index) in resultItems" :key="index" class="mb-8">
              <div class="text-center title-long-flavor text-amber font-weight-bold bg-black pl-4 lr-4 pt-2 pb-2 ml-n2 mr-n2 mb-4">
                {{ t(`displayCabinet.type.${i.type}`) }} ({{ i.child.length || 0 }})
              </div>

              <v-row class="pl-8 pr-8">
                <v-col cols="auto" v-for="(j, jIndex) in i.child" :key="jIndex" :title="j.name">
                  <div @click="onClickEvent(j)" class="item">
                    <ItemSlotBase size="90px" :class="[ modelValue && modelValue.id == j.id ? 'bg-amber' : '']">
                      <ItemIconWidget :id="j.id" :is-show-tooltip="false" :is-open-detail="false"></ItemIconWidget>
                    </ItemSlotBase>
                    <div class="text-center d-flex justify-center" style="width: 90px" :class="[modelValue && modelValue.id == j.id ? 'text-amber' : '']">
                      <div class="singe-line">
                        {{ j.name }}
                      </div>
                      <span>{{ number.intToRoman(j.tier || 1) }}</span>
                    </div>
                  </div>

                  <div class="text-center mt-1">
                    <v-btn class="text-amber" density="compact" variant="text" icon @click="onStarItem(j)">
                      <v-icon :icon="`mdi-${isCollect(j.id) ? 'star' : 'star-outline'}`" size="12"></v-icon>
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
      </div>
    </div>
  </keep-alive>
</template>

<style scoped lang="less">
.item {
  cursor: pointer;
}
</style>
