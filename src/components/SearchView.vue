<script setup lang="ts">
import {computed, onMounted, Ref, ref, useSlots, watch} from "vue";
import FlexSearch from "flexsearch";

import {Commodity, Cosmetic, Cosmetics, Items, MapLocations, Material, Materials, Modification, Modifications, Ships, Ultimate} from "glow-prow-data";

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
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import MapLocationNameWidget from "@/components/snbWidget/mapLocationNameWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import {useRoute, useRouter} from "vue-router";

import {advanced_search} from '@/assets/sripts/advanced_search';
import {AdvancedQueryParser} from '@/assets/sripts/advanced_query_parser';
import {storage, storage_account} from "@/assets/sripts/index";
import {Commodities} from "glow-prow-data/src/entity/Commodities";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";

const {t} = useI18n(),
    os = useOS(),
    slots = useSlots(),
    router = useRouter(),
    route = useRoute(),
    {sanitizeString, asString} = useI18nUtils(),
    emit = defineEmits(['close'])

let searchIndex: Ref<any | null> = ref(null),
    searchValue = ref(''),
    searchResult = ref<Record<string, any[]>>({}),
    searchSettingConfig = ref({}),

    isShowHotKet = computed(() => route.name != 'Search' && searchSettingConfig.value.searchHotkey),

    // 扁平化所有数据
    allItems = ref([]),
    hotkey = computed(() => {
      let key: string[] = []
      if (os.isDesktop() && os.detectOS() == 'MacOS')
        key = ['fn', 's']
      else if (os.isDesktop() && os.detectOS() == 'Windows')
        key = ['ctrl', 's']
      return key;
    })

const {
  searchKey,
  parsedQuery,
  searchHistory,
  addCondition,
  removeCondition,
  clearSearch,
  addToHistory,
  hasConditions,
  hasKeywords,
  isEmpty
} = advanced_search()

watch(() => searchValue.value, (value) => {
  if (!value) {
    searchResult.value = {};
    return;
  }

  try {
    // 解析高级查询
    const parsed = AdvancedQueryParser.parse(value)

    let matchedItems = [];

    if (parsed.conditions.length > 0) {
      // 使用高级查询匹配（混合严格和模糊匹配）
      matchedItems = allItems.value.filter(item =>
          matchesAdvancedQuery(item, parsed))

    } else {
      // 纯关键词搜索，使用模糊匹配
      const resultIds = searchIndex.value.search(value, {
        limit: 100,
        suggest: true
      })

      matchedItems = resultIds
          .map(resultId => allItems.value.find(item => item.id === resultId))
          .filter(item => item !== undefined && item !== null)
    }

    // 按类型分组并限制每个类型最多20条
    searchResult.value = groupResultsByType(matchedItems, 20)

    // 添加到搜索历史
    if (matchedItems.length > 0 && searchSettingConfig.value.searchIsLogs) {
      addToHistory(value)
    }

  } catch (error) {
    console.error('搜索错误:', error)
    searchResult.value = {};
  }
})

onMounted(() => {
  searchIndex.value = new FlexSearch.Index({
    tokenize: "forward",
    charset: "latin:advanced",
    preset: "default",
    cache: true
  })

  // 创建字段特定的索引
  const fieldIndices = {
    id: new FlexSearch.Index({preset: "default", cache: true}),
    name: new FlexSearch.Index({tokenize: "forward", preset: "default", cache: true}),
    description: new FlexSearch.Index({tokenize: "forward", preset: "default", cache: true})
  };

  const data = []
      .concat(Object.values(Items).map(i => {
        const itemData = {
          ...i,
          name: asString([
            `snb.items.${i.id}.name`,
            `snb.items.${sanitizeString(i.id).cleaned}.name`
          ]),
          sourceType: 'item',
          searchableFields: {
            name: asString([
              `snb.items.${i.id}.name`,
              `snb.items.${sanitizeString(i.id).cleaned}.name`
            ]),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))
      .concat(Object.values(Ships).map(i => {
        const itemData = {
          ...i,
          name: asString([
            `snb.ships.${i.id}.name`,
            `snb.ships.${sanitizeString(i.id).cleaned}.name`
          ]),
          sourceType: 'ship',
          searchableFields: {
            name: asString([
              `snb.ships.${i.id}.name`,
              `snb.ships.${sanitizeString(i.id).cleaned}.name`
            ]),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))
      .concat(Object.values(Commodities).map(i => {
        const itemData = {
          ...i,
          name: asString([
            `snb.commodities.${i.id}.name`,
            `snb.commodities.${sanitizeString(i.id).cleaned}.name`
          ]),
          sourceType: 'commoditie',
          searchableFields: {
            name: asString([
              `snb.commodities.${i.id}.name`,
              `snb.commodities.${sanitizeString(i.id).cleaned}.name`
            ]),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))
      .concat(Object.values(Materials).map(i => {
        const itemData = {
          ...i,
          name: t(`snb.materials.${i.id}.name`),
          sourceType: 'material',
          searchableFields: {
            name: t(`snb.materials.${i.id}.name`),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))
      .concat(Object.values(Modifications).map(i => {
        const itemData = {
          ...i,
          name: t(`snb.modifications.${i.id}.name`),
          sourceType: 'modification',
          searchableFields: {
            name: t(`snb.modifications.${i.id}.name`),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || '',
            grade: i.grade || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))
      .concat(Object.values(Cosmetics).map(i => {
        const itemData = {
          ...i,
          name: t(`snb.cosmetics.${i.id}.name`),
          sourceType: 'cosmetic',
          searchableFields: {
            name: t(`snb.cosmetics.${i.id}.name`),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))
      .concat(Object.values(Ultimates).map(i => {
        const itemData = {
          ...i,
          name: t(`snb.ultimates.${i.id}.name`),
          sourceType: 'ultimate',
          searchableFields: {
            name: t(`snb.ultimates.${i.id}.name`),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))
      .concat(Object.values(MapLocations).map(i => {
        const itemData = {
          ...i,
          name: t(`snb.mapLocations.${i.id}.name`),
          sourceType: 'mapLocation',
          searchableFields: {
            name: t(`snb.mapLocations.${i.id}.name`),
            id: i.id,
            description: i.description || '',
            category: i.category || '',
            type: i.type || ''
          }
        };

        // 索引到各个字段
        const itemId = i.id;
        searchIndex.value.add(itemId, Object.values(itemData.searchableFields).join(' ').toLowerCase())
        fieldIndices.id.add(itemId, itemData.searchableFields.id.toLowerCase())
        fieldIndices.name.add(itemId, itemData.searchableFields.name.toLowerCase())

        if (itemData.searchableFields.description) {
          fieldIndices.description.add(itemId, itemData.searchableFields.description.toLowerCase())
        }

        return itemData;
      }))

  // 存储字段索引
  allItems.value = data;
  fieldIndices.value = fieldIndices;

  getConfig()
  initHotkey()
})

/**
 * 获取搜索配置
 */
const getConfig = () => {
  const headerSearchSwitch = storage_account.getConfigurationItem('search', 'header.switch')
  const searchIsLogs = storage_account.getConfigurationItem('search', 'log.switch')
  const searchHotkey = storage_account.getConfigurationItem('search', 'hotkey.switch')
  const searchHint = storage_account.getConfigurationItem('search', 'hint.switch')

  searchSettingConfig.value = {
    headerSearchSwitch,
    searchIsLogs,
    searchHotkey,
    searchHint
  }
}

/**
 * 初始化热键
 */
const initHotkey = () => {
  if (!searchSettingConfig.value.searchHotkey)
    return;

  let key = ''

  if (os.isDesktop() && os.detectOS() == 'MacOS')
    key = hotkey.value.join('+')
  else if (os.isDesktop() && os.detectOS() == 'Windows')
    key = hotkey.value.join('+')

  if (key)
    useHotkey(key, () => {})
}

/**
 * 高级搜索匹配逻辑
 */
const matchesAdvancedQuery = (item: any, parsedQuery: any): boolean => {
  const {keywords, conditions} = parsedQuery;

  // 检查关键词匹配（模糊匹配）
  const keywordMatch = keywords.length === 0 || keywords.some(keyword => {
    const searchContent = Object.values(item.searchableFields || {})
        .filter(value => value)
        .join(' ')
        .toLowerCase()
    return searchContent.includes(keyword.toLowerCase())
  })

  // 检查条件匹配
  const conditionMatch = conditions.length === 0 || conditions.every(condition => {
    const {field, operator, value, isStrict} = condition;
    const itemValue = item.searchableFields?.[field] || item[field];

    if (!itemValue) return false;

    const itemValueStr = String(itemValue).toLowerCase()
    const conditionValues = Array.isArray(value) ? value.map(v => v.toLowerCase()) : [String(value).toLowerCase()];

    // 根据是否严格匹配使用不同的匹配策略
    if (isStrict) {
      // 严格匹配：精确比较
      return matchesStrictCondition(itemValue, itemValueStr, conditionValues, operator)
    } else {
      // 模糊匹配：包含关系
      return matchesFuzzyCondition(itemValueStr, conditionValues, operator)
    }
  })

  return keywordMatch && conditionMatch;
};

/**
 * 严格匹配条件
 */
const matchesStrictCondition = (itemValue: any, itemValueStr: string, conditionValues: string[], operator: string): boolean => {
  switch (operator) {
    case ':':
    case '=':
      // 严格匹配：完全相等或多值包含
      return conditionValues.some(conditionValue =>
          itemValueStr === conditionValue ||
          (Array.isArray(itemValue) && itemValue.includes(conditionValue)))


    case '!=':
      // 严格不相等
      return !conditionValues.some(conditionValue =>
          itemValueStr === conditionValue)


    case '>':
      return Number(itemValue) > Number(conditionValues[0])

    case '<':
      return Number(itemValue) < Number(conditionValues[0])

    case '>=':
      return Number(itemValue) >= Number(conditionValues[0])

    case '<=':
      return Number(itemValue) <= Number(conditionValues[0])

    default:
      return itemValueStr === conditionValues[0];
  }
};

/**
 * 模糊匹配条件
 */
const matchesFuzzyCondition = (itemValueStr: string, conditionValues: string[], operator: string): boolean => {
  switch (operator) {
    case ':':
    case '=':
      // 模糊匹配：包含关系
      return conditionValues.some(conditionValue =>
          itemValueStr.includes(conditionValue))


    case '!=':
      // 模糊不匹配：不包含
      return !conditionValues.some(conditionValue =>
          itemValueStr.includes(conditionValue))


    default:
      // 其他操作符使用严格匹配
      return conditionValues.some(conditionValue =>
          itemValueStr.includes(conditionValue))

  }
};

/**
 * 按类型分组并限制每个类型的数量
 * @param results
 * @param limitPerType
 */
const groupResultsByType = (results: any[], limitPerType: number = 20) => {
  const grouped: Record<string, any[]> = {};

  results.forEach(item => {
    const type = item.sourceType || 'unknown';
    if (!grouped[type]) {
      grouped[type] = [];
    }

    // 只添加前limitPerType个
    if (grouped[type].length < limitPerType) {
      grouped[type].push(item)
    }
  })

  return grouped;
};

/**
 * 获取前往地址
 * @param data
 * @param type
 */
const toPage = (data: Item | Commodity | Material | Modification | Cosmetic | Ultimate | any, type: string) => {
  switch (type) {
    case "item":
      return `/codex/item/${data.id}`
    case "commodity":
      return `/codex/commodity/${data.id}`
    case "material":
      return `/codex/material/${data.id}`
    case "modification":
      return `/codex/mod/${data.id}`
    case "cosmetic":
      return `/codex/cosmetic/${data.id}`
    case "ultimate":
      return `/codex/ultimate/${data.id}`
    case "mapLocation":
      return `/codex/mapLocation/${data.id}`
    default:
      return ''
  }
}

/**
 * 关闭
 */
const onCloseModel = () => {
  setTimeout(() => emit('close'), 1200)
}

/**
 * 应用历史记录
 */
const applyHistory = (query: string) => {
  searchValue.value = query;
};

/**
 * 清空历史记录
 */
const clearHistory = () => {
  searchHistory.value = [];
  storage.local.rem(searchKey)
  clearSearch()
};

/**
 * 打开详情页面
 * @param item
 * @param type
 */
const onPage = (item: any, type: string) => {
  router.push(toPage(item, type))
  onCloseModel()
}

defineExpose({
  onPage,
  onCloseModel
})
</script>

<template>
  <v-card elevation="0" class="bg-transparent pa-3">
    <v-row class="mb-0" no-gutters align="center">
      <v-col class="font-weight-bold text-h5">
        <v-icon>mdi-magnify</v-icon>
        <span class="ml-3 opacity-80">全局搜索</span>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="auto" class="d-flex ga-2 align-center"
             v-if="os.isDesktop() && isShowHotKet">
        <template v-for="(i, index) in hotkey" :key="index">
          <v-chip variant="tonal" density="comfortable">{{ i }}</v-chip>
          <template v-if="index == 0">
            <v-icon>mdi-plus</v-icon>
          </template>
        </template>
      </v-col>
      <v-col cols="auto" class="ml-2" v-if="slots.close">
        <slot name="close"></slot>
      </v-col>
    </v-row>

    <v-row>
      <!-- 搜索输入框 S -->
      <v-col cols="12">
        <v-text-field
            v-model="searchValue"
            variant="filled"
            class="mb-3"
            :placeholder="t('search.placeholder')"
            glow
            hide-spin-buttons
            persistent-hint
            hide-details
            clearable
            autofocus
            @keyup.enter="searchValue = $event.target.value">
          <template v-slot:prepend-inner>
            <v-icon icon="mdi-magnify"/>
          </template>
        </v-text-field>
      </v-col>
      <!-- 搜索输入框 E -->

      <!-- 查询条件展示 S -->
      <div v-if="asConditions && parsedQuery.conditions.length > 0" class="conditions-container mb-3">
        <div class="conditions-header">
          <span class="text-caption text-medium-emphasis">
            {{ t('search.conditions') }}
          </span>
        </div>

        <div class="conditions-list">
          <v-chip
              v-for="(condition, index) in parsedQuery.conditions"
              :key="index"
              variant="outlined"
              size="small"
              closable
              @click:close="removeCondition(index)"
              class="condition-chip">
            <span class="field">{{ condition.field }}</span>
            <span class="operator">{{ condition.operator }}</span>
            <span class="value">
              {{ Array.isArray(condition.value) ? condition.value.join(', ') : condition.value }}
            </span>
          </v-chip>
        </div>
      </div>
      <!-- 查询条件展示 E -->

      <!-- 搜索历史 S -->
      <v-col cols="6" v-if="searchSettingConfig.searchIsLogs && searchHistory.length && !searchValue" class="search-history mb-4">
        <div class="history-header">
          <span class="text-caption text-medium-emphasis">
            {{ t('search.recentSearches') }}
          </span>
          <v-btn
              variant="text"
              size="small"
              @click="clearHistory">
            {{ t('basic.button.reset') }}
          </v-btn>
        </div>

        <div class="history-list">
          <v-chip
              v-for="(historyItem, index) in searchHistory"
              :key="index"
              variant="flat"
              size="small"
              @click="applyHistory(historyItem)"
              class="ma-1">
            {{ historyItem }}
          </v-chip>
        </div>
      </v-col>
      <!-- 搜索历史 E -->

      <!-- 搜索结果 S -->
      <v-col cols="12" v-if="Object.keys(searchResult).length > 0">
        <!-- 按类型循环显示 S -->
        <div v-for="(items, type) in searchResult" :key="type" class="mb-6">
          <div class="d-block text-h6 primary--text mb-3 w-100">
            <v-row align="center">
              <v-col class="text-h6">
                {{ t(`codex.${type}s.title`) }} ({{ items.length }})
              </v-col>
              <v-col cols="auto">
                <v-btn icon :to="`/codex/${type}s?key=${searchValue}`" variant="text" @click="onCloseModel">
                  {{ t('codex.more') }}
                </v-btn>
              </v-col>
            </v-row>
          </div>

          <v-list class="elevation-1">
            <v-list-item
                v-for="(i, index) in items"
                :key="i.id || index"
                @click="onPage(i, type)"
                three-line>
              <v-list-item-title class="font-weight-medium d-flex align-center">
                <ItemSlotBase size="30px" :padding="0" class="mr-2">
                  <template v-if="type=='item'">
                    <ItemIconWidget :id="i.id"></ItemIconWidget>
                  </template>
                  <template v-if="type=='ship'">
                    <ShipIconWidget :id="i.id"></ShipIconWidget>
                  </template>
                  <template v-if="type=='commoditie'">
                    <CommoditieIconWidget :id="i.id"></CommoditieIconWidget>
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
                  <template v-else-if="type=='mapLocation'">
                    <MapLocationIconWidget :id="i.id"></MapLocationIconWidget>
                  </template>
                </ItemSlotBase>

                <template v-if="type=='item'">
                  <ItemName :id="i.id"></ItemName>
                </template>
                <template v-if="type=='ship'">
                  <ShipName :id="i.id"></ShipName>
                </template>
                <template v-if="type=='commoditie'">
                  <CommoditieName :id="i.id"></CommoditieName>
                </template>
                <template v-else-if="type=='material'">
                  <MaterialName :id="i.id"></MaterialName>
                </template>
                <template v-else-if="type=='modification'">
                  <ModName :id="i.id" :grade="i.grade"></ModName>
                </template>
                <template v-else-if="type=='cosmetic'">
                  <CosmeticName :id="i.id"></CosmeticName>
                </template>
                <template v-else-if="type=='ultimate'">
                  <UltimateName :id="i.id"></UltimateName>
                </template>
                <template v-else-if="type=='mapLocation'">
                  <MapLocationNameWidget :id="i.id"></MapLocationNameWidget>
                </template>
              </v-list-item-title>

              <!-- 显示需求材料 -->
              <div v-if="i.required && Object.keys(i.required).length > 0" class="text-caption mt-1">
                <strong>需求材料:</strong>
                <span v-for="(amount, material) in i.required" :key="material" class="ml-2">
                  {{ material }}: {{ amount }}
                </span>
              </div>

              <template v-slot:append>
                <v-icon icon="mdi-arrow-right"></v-icon>
              </template>
            </v-list-item>
          </v-list>
        </div>
        <!-- 按类型循环显示 E -->
      </v-col>

      <v-col cols="12" v-else-if="searchValue" class="text-center text-grey py-8">
        未找到匹配的结果
      </v-col>
      <!-- 搜索结果 E -->

      <v-col cols="6" class="mb-4" v-else-if="!searchValue && searchSettingConfig.searchHint">
        <div class="history-header text-grey">
          <span class="text-caption text-medium-emphasis">
            <v-icon>mdi-lightbulb-on-10</v-icon>
            {{ t('search.useTip') }}
          </span>
        </div>

        <div class="mt-3">
          <p>支持高级查询如：name:item_name id:id1 category:ship type:ships</p>

          <ul class="mt-5 text-caption text-grey ml-4">
            <li>模糊检索: <u>id=id1</u> · <u>id>=id1</u> · <u>id<=id1</u> · <u>id< id1 </u> · <u>id>id1</u></li>
            <li>精准id检索: <u>id:id1</u></li>
            <li>category单一和组合: <u>category:ship,ships</u> (仅限category)</li>
          </ul>

          <ul class="mt-2 text-caption text-grey ml-4">
            <li>字段: <u>name</u> · <u>id</u> · <u>category</u> · <u>type</u> · <u>description</u></li>
            <li>支持同时使用以上字段查询</li>
          </ul>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped lang="less">
.conditions-container {
  padding: 12px;
  border-radius: 6px;
}

.conditions-header {
  margin-bottom: 8px;
}

.conditions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.condition-chip {
  .field {
    font-weight: 600;
  }

  .operator {
    margin: 0 4px;
    color: #666;
  }

  .value {
    color: #2e7d32;
  }
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.history-list {
  margin-top: 8px;
}
</style>
