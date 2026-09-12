<script setup lang="ts">
import {computed, onMounted, onUnmounted, Ref, ref, useSlots, watch} from "vue";
import {useSearchWorkerService} from "@/assets/sripts/search_worker_service";

import {Commodity, Cosmetic, Item, Material, Modification, Ultimate, Set as SnbSet, Mastery} from "glow-prow-data";

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
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";
import SetName from "@/components/snbWidget/setName.vue";
import MasteryIconWidget from "@/components/snbWidget/masteryIconWidget.vue";
import MasteryName from "@/components/snbWidget/masteryName.vue";
import {useRoute, useRouter} from "vue-router";

import {advanced_search} from '@/assets/sripts/advanced_search';
import {AdvancedQueryParser} from '@/assets/sripts/advanced_query_parser';
import {storage, storage_account} from "@/assets/sripts/index";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {ERROR_CODES, logError} from "@/assets/sripts/error_logger";

const {t, messages, locale} = useI18n(),
    os = useOS(),
    slots = useSlots(),
    router = useRouter(),
    route = useRoute(),
    {sanitizeString, asString} = useI18nUtils(),
    emit = defineEmits(['close']),
    {
      initWorker,
      performSearch: workerPerformSearch,
      isLoading,
      progress,
      searchResult
    } = useSearchWorkerService(),

    // 结果类型标签页
    selectedType = ref('all'),
    allTypes = ['item', 'ship', 'commoditie', 'material', 'modification', 'cosmetic', 'ultimate', 'mapLocation', 'set', 'mastery'],

    // 搜索配置项
    searchConfig = ref({
      limit: 100,
      enabledTypes: [...allTypes]
    }),

    // 搜索新窗口打开设置
    searchOpenNewWindow = ref(true)

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
  // 检查是否处于加载中状态
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
  getConfig()
  initHotkey()

  // 初始化 Worker 线程
  initWorker(messages.value[locale.value], locale.value)?.then(() => {
    // 若存在查询内容，则执行初始搜索
    if (searchQuery.value) {
      performSearch(searchQuery.value);
    }
  });
})

onUnmounted(() => {
  // Worker 为单例模式，组件卸载时无需终止
})

const performSearch = (query: string) => {
  try {
    const parsed = AdvancedQueryParser.parse(query);
    workerPerformSearch(query, {
      ...parsed,
      limit: searchConfig.value.limit,
      types: searchConfig.value.enabledTypes
    });

    if (searchSettingConfig.value.searchIsLogs) {
      addToHistory(query)
    }

  } catch (e) {
    logError(ERROR_CODES.GP_JS_UNCAUGHT, (e as Error)?.message || String(e), (e as Error)?.stack, 'GlobalSearchCoreView', e);
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

  // 加载搜索配置
  const savedConfig = storage_account.getConfigurationItem('search', 'filter.config')
  if (savedConfig) {
    searchConfig.value = Object.assign(searchConfig.value, savedConfig)
    if (searchConfig.value.enabledTypes) {
      if (!searchConfig.value.enabledTypes.includes('set')) {
        searchConfig.value.enabledTypes.push('set');
      }
      if (!searchConfig.value.enabledTypes.includes('mastery')) {
        searchConfig.value.enabledTypes.push('mastery');
      }
    }
  }

  searchOpenNewWindow.value = storage_account.getConfigurationItem('search', 'open.newWindow', {defaultValue: true})

  searchSettingConfig.value = {
    headerSearchSwitch,
    searchIsLogs,
    searchHotkey,
    searchHint
  }
}

/**
 * 保存搜索配置
 */
const saveConfig = () => {
  storage_account.updateConfiguration('search', 'filter.config', searchConfig.value)
  storage_account.updateConfiguration('search', 'open.newWindow', searchOpenNewWindow.value)
  performSearch(searchValue.value)
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
 * 各搜索类型 -> 列表路由 path 映射
 * 注意：路由定义中 commoditie 列表是 commodities，mapLocation 列表是 mapLocations
 */
const typeToListPath: Record<string, string> = {
  item: '/codex/items',
  ship: '/codex/ships',
  commoditie: '/codex/commodities',
  commodity: '/codex/commodities',
  material: '/codex/materials',
  modification: '/codex/modifications',
  cosmetic: '/codex/cosmetics',
  ultimate: '/codex/ultimates',
  mapLocation: '/codex/mapLocations',
  treasureMap: '/codex/treasureMaps',
  set: '/codex/sets',
  sets: '/codex/sets',
  mastery: '/codex/masterys',
  masterys: '/codex/masterys',
  npc: '/codex/npcs',
}

/**
 * 各搜索类型 -> i18n title key 映射
 */
const typeToI18nKey: Record<string, string> = {
  item: 'codex.items.title',
  ship: 'codex.ships.title',
  commoditie: 'codex.commodities.title',
  commodity: 'codex.commodities.title',
  material: 'codex.materials.title',
  modification: 'codex.modifications.title',
  cosmetic: 'codex.cosmetics.title',
  ultimate: 'codex.ultimates.title',
  mapLocation: 'codex.mapLocations.title',
  treasureMap: 'codex.treasureMaps.title',
  set: 'codex.sets.title',
  sets: 'codex.sets.title',
  mastery: 'codex.masterys.title',
  masterys: 'codex.masterys.title',
  npc: 'codex.npcs.title',
}

/**
 * 获取前往地址
 * @param data
 * @param type
 */
const toPage = (data: Item | Commodity | Material | Modification | Cosmetic | Ultimate | SnbSet | Mastery | any, type: string) => {
  switch (type) {
    case "item":
      return `/codex/item/${data.id}`
    case "ship":
      return `/codex/ship/${data.id}`
    case "material":
      return `/codex/material/${data.id}`
    case "modification":
      return `/codex/modification/${data.id}`
    case "commodity":
    case "commoditie":
      return `/codex/commoditie/${data.id}`
    case "ultimate":
      return `/codex/ultimate/${data.id}`
    case "cosmetic":
      return `/codex/cosmetic/${data.id}`
    case "mapLocation":
      return `/codex/mapLocation/${data.id}`
    case "set":
    case "sets":
      return `/codex/set/${data.id}`
    case "mastery":
    case "masterys":
      return `/codex/mastery/${data.id}`
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
  const path = toPage(item, type)
  if (!path) return
  if (searchOpenNewWindow.value) {
    window.open(path, '_blank')
  } else {
    router.push(path)
    onCloseModel()
  }
}

defineExpose({
  onPage,
  onCloseModel
})

defineOptions({
  name: 'GlobalSearchCoreView'
})
</script>

<template>
  <v-card elevation="0" class="bg-transparent">
    <v-row class="mb-0" no-gutters align="center">
      <v-col cols="auto" class="font-weight-bold text-h5">
        <v-icon>mdi-magnify</v-icon>
        <span class="ml-3 opacity-80">{{ t('search.title') }}</span>
      </v-col>

      <v-col cols="auto" class="d-flex ga-2 align-center ml-5"
             v-if="os.isDesktop() && isShowHotKet">
        <template v-for="(i, index) in hotkey" :key="index">
          <v-chip variant="tonal" density="comfortable">{{ i }}</v-chip>
          <template v-if="index == 0">
            <v-icon>mdi-plus</v-icon>
          </template>
        </template>
      </v-col>

      <v-spacer></v-spacer>

      <!-- 搜索筛选配置 S -->
      <v-col cols="auto" class="ml-10">
        <v-menu open-on-click :close-on-content-click="false" location="bottom end">
          <template v-slot:activator="{ props }">
            <div v-bind="props">
              <v-icon>mdi-filter</v-icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </div>
          </template>

          <v-card border min-width="300" max-width="600" class="pa-4 overflow-x-hidden">
            <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
              <v-icon size="80">mdi-filter</v-icon>
            </v-card-title>

            <div class="text-subtitle-1 mb-2">{{ t('search.configTitle') }}</div>

            <div class="text-caption text-grey mb-1">{{ t('search.scope') }}</div>
            <v-row no-gutters>
              <v-col cols="6" v-for="type in allTypes" :key="type">
                <v-checkbox
                    v-model="searchConfig.enabledTypes"
                    :label="t(typeToI18nKey[type] || `codex.${type}s.title`)"
                    :value="type"
                    density="compact"
                    hide-details
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-divider class="my-3"></v-divider>

            <div class="text-caption text-grey mb-1">
              {{ t('search.limitPerType') }}: {{ searchConfig.limit === 0 ? t('search.infinite') : searchConfig.limit }}
            </div>
            <v-slider
                v-model="searchConfig.limit"
                :min="0"
                :max="100"
                :step="5"
                color="var(--main-color)"
                thumb-label
                density="compact"
                hide-details
            ></v-slider>

            <v-divider class="my-3"></v-divider>

            <div class="text-caption text-grey mb-1">{{ t('search.openMode') }}</div>
            <v-select
                v-model="searchOpenNewWindow"
                :items="[
                  { title: t('search.openNewWindow'), value: true },
                  { title: t('search.openCurrentWindow'), value: false }
                ]"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-2"
            ></v-select>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="var(--main-color)" class="mt-4" @click="saveConfig">
                {{ t('basic.button.submit') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-col>
      <!-- 搜索筛选配置 E -->

      <v-col cols="auto" v-if="slots.close">
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

      <!-- 搜索历史 S -->
      <v-col cols="12" md="6" lg="6" v-if="searchSettingConfig.searchIsLogs && searchHistory.length && !searchValue" class="search-history mb-4">
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

      <!-- 查询条件展示 S -->
      <v-col cols="6" v-if="hasConditions && parsedQuery.conditions.length > 0" class="conditions-container">
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
      </v-col>
      <!-- 查询条件展示 E -->

      <v-col cols="6" class="mb-4" v-else-if="!searchValue && searchSettingConfig.searchHint">
        <div class="history-header text-grey">
          <span class="text-caption text-medium-emphasis">
            <v-icon>mdi-lightbulb-on-10</v-icon>
            {{ t('search.useTip') }}
          </span>
        </div>

        <div class="mt-3">
          <p>{{ t('search.tips.advanced', {example: 'name:item_name id:id1 category:ship type:ships'}) }}</p>

          <ul class="mt-5 text-caption text-grey ml-4">
            <li>{{ t('search.tips.fuzzy') }}: <u>id=id1</u> · <u>id>=id1</u> · <u>id&lt;=id1</u> · <u>id&lt; id1 </u> · <u>id>id1</u></li>
            <li>{{ t('search.tips.exactId') }}: <u>id:id1</u></li>
            <li>{{ t('search.tips.category') }}: <u>category:ship,ships</u> {{ t('search.tips.categoryOnly') }}</li>
          </ul>

          <ul class="mt-2 text-caption text-grey ml-4">
            <li>{{ t('search.tips.fields') }}: <u>name</u> · <u>id</u> · <u>category</u> · <u>type</u> · <u>description</u></li>
            <li>{{ t('search.tips.combinedFields') }}</li>
          </ul>
        </div>
      </v-col>

      <!-------------------------------->

      <!-- 搜索结果 Tabs S -->
      <v-col cols="12" class="mb-0 pb-0">
        <v-tabs
            v-if="Object.keys(searchResult).length > 0"
            v-model="selectedType"
            color="var(--main-color)"
            align-tabs="start"
            class="ml-15"
            density="comfortable">
          <v-tab value="all">{{ t('search.all') }} ({{ Object.values(searchResult).flat().length }})</v-tab>
          <template v-for="(items, type) in searchResult" :key="type">
            <v-tab :value="type" v-if="items.length > 0">
              {{ t(typeToI18nKey[String(type)] || `codex.${type}s.title`) }} ({{ items.length }})
            </v-tab>
          </template>
        </v-tabs>
      </v-col>
      <!-- 搜索结果 Tabs E -->

      <!-- 搜索结果 S -->
      <v-col cols="12"
             v-if="Object.keys(searchResult).length > 0"
             class="search-results-container">
        <!-- 按类型循环显示 S -->
        <template v-for="(items, type) in searchResult" :key="type">
          <template v-if="selectedType === 'all' || selectedType === String(type)">
            <AffixBoxHasTitleView class="mb-6">
              <v-list class="elevation-1">
                <v-list-item
                    v-for="(i, index) in items"
                    :key="i.id || index"
                    @click="onPage(i, String(type))"
                    three-line>
                  <template v-slot:prepend>
                    <ItemSlotBase size="50px" :padding="0" class="mr-2">
                      <template v-if="String(type)=='item'">
                        <ItemIconWidget :id="i.id"></ItemIconWidget>
                      </template>
                      <template v-if="String(type)=='ship'">
                        <ShipIconWidget :id="i.id"></ShipIconWidget>
                      </template>
                      <template v-if="String(type)=='commodity' || String(type)=='commoditie'">
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
                      <template v-else-if="String(type)=='set' || String(type)=='sets'">
                        <SetIconWidget :id="i.id"></SetIconWidget>
                      </template>
                      <template v-else-if="String(type)=='mastery' || String(type)=='masterys'">
                        <MasteryIconWidget :id="i.id"></MasteryIconWidget>
                      </template>
                    </ItemSlotBase>
                  </template>
                  <v-list-item-title class="font-weight-medium d-flex align-center">
                    <template v-if="String(type)=='item'">
                      <ItemName :id="i.id"></ItemName>
                    </template>
                    <template v-if="String(type)=='ship'">
                      <ShipName :id="i.id"></ShipName>
                    </template>
                    <template v-if="String(type)=='commodity' || String(type)=='commoditie'">
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
                      <MapLocationName :id="i.id"></MapLocationName>
                    </template>
                    <template v-else-if="String(type)=='set' || String(type)=='sets'">
                      <SetName :id="i.id"></SetName>
                    </template>
                    <template v-else-if="String(type)=='mastery' || String(type)=='masterys'">
                      <MasteryName :id="i.id"></MasteryName>
                    </template>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ i.key ? `${i.key} · ${i.id}` : i.id }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-icon icon="mdi-arrow-right"></v-icon>
                  </template>
                </v-list-item>
              </v-list>

              <template v-slot:title>
                {{ t(typeToI18nKey[String(type)] || `codex.${type}s.title`) }} ({{ items.length }})

                <v-divider class="my-5"></v-divider>

                <v-btn icon density="compact" :to="`${typeToListPath[String(type)] || `/codex/${type}s`}?key=${searchValue}`" variant="text" @click="onCloseModel">
                  {{ t('codex.more') }}
                </v-btn>
              </template>
            </AffixBoxHasTitleView>
          </template>
        </template>
        <!-- 按类型循环显示 E -->
      </v-col>

      <v-col cols="12" v-else-if="searchQuery" class="text-center text-grey py-8">
        {{ t('search.noResults') }}
      </v-col>
      <!-- 搜索结果 E -->
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

.search-results-container {
  overflow-y: auto;
}
</style>
