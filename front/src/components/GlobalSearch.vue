<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import FlexSearch from "flexsearch";

import {Cosmetic, Cosmetics, Items, Material, Materials, Modification, Modifications, Ultimate, Ultimates} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useHotkey} from "vuetify";
import {useOS} from "@/assets/sripts/os";

import ItemName from "@/components/snbWidget/itemName.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ModName from "@/components/snbWidget/modName.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";


const {t} = useI18n(),
    os = useOS(),
    {sanitizeString, asString} = useI18nUtils()

let searchIndex = ref(null),
    model = ref(false),
    searchValue = ref(''),
    searchResult = ref<Record<string, any[]>>({}),

    // 扁平化所有数据
    allItems = ref([]),
    hotkey = computed(() => {
      let key = ''
      if (os.isDesktop() && os.detectOS() == 'MacOS')
        key = ['fn', 's']
      else if (os.isDesktop() && os.detectOS() == 'MacOS')
        key = ['clat', 's']
      return key;
    })

onMounted(() => {
  searchIndex.value = new FlexSearch.Index({
    tokenize: "forward",
    charset: "latin:advanced",
    preset: "default",
    cache: true
  });

  // 测试数据
  const data = []
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

  data.forEach((item, index) => {
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

  initHotkey()
});

/**
 * 初始化热键
 */
const initHotkey = () => {
  let key = ''

  if (os.isDesktop() && os.detectOS() == 'MacOS')
    key = hotkey.value.join('+')
  else if (os.isDesktop() && os.detectOS() == 'MacOS')
    key = hotkey.value.join('+')

  if (key)
    useHotkey(key, () => {
      model.value = !model.value
    })
}

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
  <v-btn icon density="comfortable" @click="model = true" class="mx-2" :disabled="model">
    <slot></slot>
  </v-btn>

  <v-dialog max-width="1024"
            z-index="10"
            content-class="pt-8"
            v-model="model" style="backdrop-filter: blur(20px)">
    <template v-slot:default>
      <v-card elevation="0" class="bg-transparent pa-3">
        <v-row class="mb-3" no-gutters align="center">
          <v-col class="font-weight-bold">
            <v-icon>mdi-magnify</v-icon>
            <span class="opacity-80">全局搜索</span>
          </v-col>
          <v-spacer></v-spacer>
          <div class="d-flex ga-2 align-center"
               v-if="os.isDesktop()">
            <template v-for="(i, index) in hotkey" :key="index">
              <v-chip border>{{ i }}</v-chip>
              <template v-if="index == 0">
                <v-icon>mdi-plus</v-icon>
              </template>
            </template>
          </div>
        </v-row>

        <div>
          <v-text-field
              v-model="searchValue"
              variant="outlined"
              class="mb-5"
              :counter="10"
              glow
              hide-spin-buttons
              persistent-hint
              hide-details
              style="backdrop-filter: blur(20px)"
              clearable
              @input="searchValue = $event.target.value"
              @keydown.enter="searchValue = $event.target.value"
          ></v-text-field>

          <div v-if="Object.keys(searchResult).length > 0">
            <!-- 按类型循环显示 -->
            <div v-for="(items, type) in searchResult" :key="type" class="mb-6">
              <v-subheader class="d-block text-h6 primary--text mb-3 w-100">
                <v-row align="center">
                  <v-col class="text-h6">
                    {{ t(`displayCabinet.${type}s.title`) }} ({{ items.length }})
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon :to="`/display-cabinet/${type}s`" variant="text" @click="model = !model">
                      {{ t('displayCabinet.more') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-subheader>

              <v-list class="elevation-1">
                <v-list-item
                    v-for="(i, index) in items"
                    :key="i.id || index"
                    :to="toPage(i, type)"
                    @click="model.value = false"
                    three-line>
                  <v-list-item-content>
                    <v-list-item-title class="font-weight-medium d-flex align-center">
                      <ItemSlotBase size="30px" :padding="0" class="mr-2">
                        <template v-if="type=='item'">
                          <ItemIconWidget :id="i.id"></ItemIconWidget>
                        </template>
                        <template v-else-if="type=='material'">
                          <MaterialIconWidget :id="i.id"></MaterialIconWidget>
                        </template>
                        <template v-else-if="type=='modification'">
                          <ModIconWidget :id="i.id"></ModIconWidget>
                        </template>
                        <template v-else-if="type=='cosmetic'">
                          <CosmeticIconWidget :id="i.id"></CosmeticIconWidget>
                        </template>
                        <template v-else-if="type=='ultimate'">
                          <UltimateIconWidget :id="i.id"></UltimateIconWidget>
                        </template>
                      </ItemSlotBase>


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

                  <template v-slot:append>
                    <v-icon icon="mdi-arrow-right"></v-icon>
                  </template>
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
        </div>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped lang="less">
</style>
