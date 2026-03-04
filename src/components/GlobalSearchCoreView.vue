<script lang="ts">
export default {
  name: "GlobalSearchCoreView"
}
</script>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, Ref, ref, useSlots, watch} from "vue";
import {useSearchWorkerService} from "@/assets/sripts/search_worker_service";

import {Commodity, Cosmetic, Cosmetics, Item, Items, MapLocations, Material, Materials, Modification, Modifications, Ships, Ultimate} from "glow-prow-data";

import {useI18n} from "vue-i18n";
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
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const {t, messages, locale} = useI18n(),
    os = useOS(),
    slots = useSlots(),
    router = useRouter(),
    route = useRoute(),
    {sanitizeString, asString} = useI18nUtils(),
    {commoditie} = useI18nReadName(),
    emit = defineEmits(['close']),
    {
        initWorker,
        performSearch: workerPerformSearch,
        isLoading,
        progress,
        searchResult
    } = useSearchWorkerService()

let searchValue = ref(''), // 展示搜索值
    searchQuery = ref(''), // 实际搜索的值
    searchSettingConfig = ref<any>({}),
    fieldIndices = ref<any>({}),

    isShowHotKet = computed(() => route.name != 'Search' && searchSettingConfig.value.searchHotkey),

    // 扁平化所有数据
    allItems: Ref<any[]> = ref([]),
    hotkey = computed(() => {
      let key: string[] = []
      if (os.isDesktop() && os.detectOS() == 'MacOS')
        key = ['fn', 's']
      else if (os.isDesktop() && os.detectOS() == 'Windows')
        key = ['ctrl', 's']
      return key;
    })

// 添加防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null;

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

watch(() => searchQuery.value, (value) => {
  if (!value) {
    searchResult.value = {};
    return;
  }
  performSearch(value);
})


// 监听 searchValue 实现防抖
watch(() => searchValue.value, (value) => {
  // Check if loading
  if (isLoading.value) return;

  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }

  // 如果输入为空，立即清空搜索结果
  if (!value) {
    searchQuery.value = '';
    return;
  }

  // 设置新的定时器，1秒后执行搜索
  searchTimer = setTimeout(() => {
    searchQuery.value = value;
  }, 1000);
})

// 处理回车搜索
const handleEnter = () => {
  if (isLoading.value) return;
  // 清除定时器
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  // 立即执行搜索
  searchQuery.value = searchValue.value;
};

onMounted(() => {
  // Initialize worker
  initWorker(messages.value[locale.value], locale.value)?.then(() => {
    // Perform initial search if there is a query
    if (searchQuery.value) {
      performSearch(searchQuery.value);
    }
  });

  getConfig()
  initHotkey()
})

onUnmounted(() => {
  // No need to terminate worker here as it's a singleton
})

const performSearch = (query: string) => {
  try {
    const parsed = AdvancedQueryParser.parse(query);
    workerPerformSearch(query, parsed);
    
    if (searchSettingConfig.value.searchIsLogs) {
        addToHistory(query)
    }

  } catch (e) {
    console.error(e);
  }
};


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
    useHotkey(key, () => {
    })
}


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
  // 应用历史记录时立即执行搜索
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  searchQuery.value = query;
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
            :disabled="isLoading"
            @keyup.enter="handleEnter">
          <template v-slot:prepend-inner>
            <v-icon icon="mdi-magnify"/>
          </template>
        </v-text-field>
        <v-progress-linear
            v-if="isLoading"
            :model-value="progress * 100"
            color="var(--main-color)"
            height="2"
            class="mt-n3 mb-3"
        ></v-progress-linear>
      </v-col>
      <!-- 搜索输入框 E -->

      <!-- 查询条件展示 S -->
      <div v-if="hasConditions && parsedQuery.conditions.length > 0" class="conditions-container mb-3">
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
          <AffixBoxHasTitleView>
            <v-list class="elevation-1">
              <v-list-item
                  v-for="(i, index) in items"
                  :key="i.id || index"
                  @click="onPage(i, String(type))"
                  three-line>
                <v-list-item-title class="font-weight-medium d-flex align-center">
                  <ItemSlotBase size="30px" :padding="0" class="mr-2">
                    <template v-if="String(type)=='item'">
                      <ItemIconWidget :id="i.id"></ItemIconWidget>
                    </template>
                    <template v-if="String(type)=='ship'">
                      <ShipIconWidget :id="i.id"></ShipIconWidget>
                    </template>
                    <template v-if="String(type)=='commoditie'">
                      <CommoditieIconWidget :id="i.id"></CommoditieIconWidget>
                    </template>
                    <template v-else-if="String(type)=='material'">
                      <MaterialIconWidget :id="i.id"></MaterialIconWidget>
                    </template>
                    <template v-else-if="String(type)=='modification'">
                      <ModIconWidget :id="i.id"></ModIconWidget>
                    </template>
                    <template v-else-if="String(type)=='cosmetic'">
                      <CosmeticIconWidget :id="i.id"></CosmeticIconWidget>
                    </template>
                    <template v-else-if="String(type)=='ultimate'">
                      <UltimateIconWidget :id="i.id"></UltimateIconWidget>
                    </template>
                    <template v-else-if="String(type)=='mapLocation'">
                      <MapLocationIconWidget :id="i.id"></MapLocationIconWidget>
                    </template>
                  </ItemSlotBase>

                  <template v-if="String(type)=='item'">
                    <ItemName :id="i.id"></ItemName>
                  </template>
                  <template v-if="String(type)=='ship'">
                    <ShipName :id="i.id"></ShipName>
                  </template>
                  <template v-if="String(type)=='commoditie'">
                    <CommoditieName :id="i.id"></CommoditieName>
                  </template>
                  <template v-else-if="String(type)=='material'">
                    <MaterialName :id="i.id"></MaterialName>
                  </template>
                  <template v-else-if="String(type)=='modification'">
                    <ModName :id="i.id" :grade="i.grade"></ModName>
                  </template>
                  <template v-else-if="String(type)=='cosmetic'">
                    <CosmeticName :id="i.id"></CosmeticName>
                  </template>
                  <template v-else-if="String(type)=='ultimate'">
                    <UltimateName :id="i.id"></UltimateName>
                  </template>
                  <template v-else-if="String(type)=='mapLocation'">
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

            <template v-slot:title>
              {{ t(`codex.${type}s.title`) }} ({{ items.length }})


              <v-divider class="my-5"></v-divider>

              <v-btn icon density="compact" :to="`/codex/${type}s?key=${searchValue}`" variant="text" @click="onCloseModel">
                {{ t('codex.more') }}
              </v-btn>
            </template>
          </AffixBoxHasTitleView>
        </div>
        <!-- 按类型循环显示 E -->
      </v-col>

      <v-col cols="12" v-else-if="searchQuery" class="text-center text-grey py-8">
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
            <li>模糊检索: <u>id=id1</u> · <u>id>=id1</u> · <u>id&lt;=id1</u> · <u>id&lt; id1 </u> · <u>id>id1</u></li>
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
