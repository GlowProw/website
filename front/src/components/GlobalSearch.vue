<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import FlexSearch from "flexsearch";
import {Cosmetic, Cosmetics, Items, Material, Materials, Modification, Modifications, Ultimate, Ultimates} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import ItemName from "@/components/snbWidget/itemName.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ModName from "@/components/snbWidget/modName.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const searchIndex = ref(null);
const model = ref(false);
const searchValue = ref('');
const searchResult = ref<Record<string, any[]>>({});
const {t} = useI18n(),
    {sanitizeString, asString} = useI18nUtils()

// 扁平化所有数据
const allItems = ref([]);

onMounted(() => {
  searchIndex.value = new FlexSearch.Index({
    tokenize: "forward",
    charset: "latin:advanced",
    preset: "default",
    cache: true
  });

  const dataSources = [];

  // 测试数据
  const testData = [
    {id: "test_1", name: "test item", description: "这是一个测试项目", sourceType: "test"},
  ]
      .concat(Object.values(Items).map(i => {
        return {
          ...i,
          name: asString([
            `snb.items.${i.id}.name`,
            `snb.items.${sanitizeString(i.id).cleaned}.name`
          ]),
          sourceType: 'item'
        }
      }))
      .concat(Object.values(Materials).map(i => {
        return {
          ...i,
          name: t(`snb.materials.${i.id}.name`),
          sourceType: 'material'
        }
      }))
      .concat(Object.values(Modifications).map(i => {
        return {
          ...i,
          name: t(`snb.modifications.${i.id}.name`),
          sourceType: 'modification'
        }
      }))
      .concat(Object.values(Cosmetics).map(i => {
        return {
          ...i,
          name: t(`snb.cosmetics.${i.id}.name`),
          sourceType: 'cosmetic'
        }
      }))
      .concat(Object.values(Ultimates).map(i => {
        return {
          ...i,
          name: t(`snb.ultimates.${i.id}.name`),
          sourceType: 'ultimate'
        }
      }));

  testData.forEach((item, index) => {
    if (item && item.name) {
      const itemId = item.id || `item_${index}`;
      const contentToIndex = `${item.name} ${item.description || ''}`.trim().toLowerCase();

      // 添加到索引
      searchIndex.value.add(itemId, contentToIndex);

      // 存储完整数据
      allItems.value.push({
        id: itemId,
        ...item
      });
    }
  });

  dataSources.forEach(source => {
    if (source.data && Array.isArray(source.data)) {
      source.data.forEach((item, index) => {
        if (item && item.name) {
          const itemId = `${source.type}_${index}`;
          const contentToIndex = `${item.name} ${item.description || ''}`.trim().toLowerCase();

          // 添加到索引
          searchIndex.value.add(itemId, contentToIndex);

          // 存储完整数据
          allItems.value.push({
            id: itemId,
            ...item,
            sourceType: source.type
          });
        }
      });
    }
  });
});

// 按类型分组并限制每个类型的数量
const groupResultsByType = (results: any[], limitPerType: number = 20) => {
  const grouped: Record<string, any[]> = {};

  results.forEach(item => {
    const type = item.sourceType || 'unknown';
    if (!grouped[type]) {
      grouped[type] = [];
    }

    // 只添加前limitPerType个
    if (grouped[type].length < limitPerType) {
      grouped[type].push(item);
    }
  });

  return grouped;
};

// 监听搜索输入
watch(searchValue, (value) => {
  if (!value.trim()) {
    searchResult.value = {};
    return;
  }

  try {
    // 执行搜索
    const resultIds = searchIndex.value.search(value, {
      limit: 100,
      suggest: true
    });

    // 映射回完整数据
    const matchedItems = resultIds
        .map(resultId => {
          // 根据ID找到对应的完整数据
          return allItems.value.find(item => item.id === resultId);
        })
        .filter(item => item !== undefined && item !== null);

    // 按类型分组并限制每个类型最多20条
    searchResult.value = groupResultsByType(matchedItems, 20);

  } catch (error) {
    console.error('搜索错误:', error);
    searchResult.value = {};
  }
});

/**
 * 获取前往地址
 * @param data
 * @param type
 */
const toPage = (data: Item | Material | Modification | Cosmetic | Ultimate | any, type: string) => {
  switch (type) {
    case "item":
      return `/display-cabinet/item/${data.id}`
    case "material":
      return `/display-cabinet/material/${data.id}`
    case "modification":
      return `/display-cabinet/mod/${data.id}`
    case "cosmetic":
      return `/display-cabinet/cosmetic/${data.id}`
    case "ultimate":
      return `/display-cabinet/ultimate/${data.id}`
    default:
      return ''
  }
}
</script>

<template>
  <span @click="model = true" class="mx-2">
    <slot></slot>
  </span>

  <v-dialog max-width="1024" v-model="model" style="backdrop-filter: blur(20px)">
    <template v-slot:default>
      <v-card elevation="0" class="bg-transparent">
        <v-card-title>全局搜索</v-card-title>
        <v-card-text>
          <v-text-field
              v-model="searchValue"
              label="输入搜索内容..."
              clearable
              @input="searchValue = $event.target.value"
              @keydown.enter="searchValue = $event.target.value"
          ></v-text-field>

          <div v-if="Object.keys(searchResult).length > 0">
            <!-- 按类型循环显示 -->
            <div v-for="(items, type) in searchResult" :key="type" class="mb-6">
              <v-subheader class="text-h6 primary--text">
                {{ t(`displayCabinet.${type}s.title`) }} ({{ items.length }})
              </v-subheader>

              <v-list class="elevation-1">
                <v-list-item
                    v-for="(i, index) in items"
                    :key="i.id || index"
                    :to="toPage(i, type)"
                    @click="model.value = false"
                    three-line>
                  <v-list-item-content>
                    <v-list-item-title class="font-weight-medium">
                      <template v-if="type=='item'">
                        <ItemName :id="i.id"></ItemName>
                      </template>
                      <template v-else-if="type=='material'">
                        <MaterialName :id="i.id"></MaterialName>
                      </template>
                      <template v-else-if="type=='modification'">
                        <ModName :id="i.id"></ModName>
                      </template>
                      <template v-else-if="type=='cosmetic'">
                        <CosmeticName :id="i.id"></CosmeticName>
                      </template>
                      <template v-else-if="type=='ultimate'">
                        <UltimateName :id="i.id"></UltimateName>
                      </template>
                    </v-list-item-title>

                    <!-- 显示需求材料 -->
                    <div v-if="i.required && Object.keys(i.required).length > 0" class="text-caption mt-1">
                      <strong>需求材料:</strong>
                      <span v-for="(amount, material) in i.required" :key="material" class="ml-2">
                        {{ material }}: {{ amount }}
                      </span>
                    </div>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </div>
          </div>

          <div v-else-if="searchValue" class="text-center text-grey py-8">
            未找到匹配的结果
          </div>

          <div v-else class="text-center text-grey py-8">
            输入关键词开始搜索
          </div>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped lang="less">
</style>
