<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {Commodities, Items, Materials} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";

const {t} = useI18n();
const {mobile} = useDisplay();
const {asString} = useI18nUtils();
const {item: readItemName, material: readMaterialName, commoditie: readCommodityName} = useI18nReadName();

const props = withDefaults(defineProps<{
  data: any;
  activeCategory?: string;
  readonly?: boolean;
  categories?: string[];
}>(), {
  data: () => ({}),
  activeCategory: 'weekly',
  readonly: false,
  categories: undefined
});

const emit = defineEmits<{
  'update:activeCategory': [value: string];
}>();

// 当前激活的分类标识
const currentTab = ref(props.activeCategory || 'weekly');

// 监听外部传入的激活分类变化
watch(() => props.activeCategory, (val) => {
  if (val && val !== currentTab.value) {
    currentTab.value = val;
  }
});

// 监听内部激活分类变化并向外抛出事件
watch(currentTab, (val) => {
  emit('update:activeCategory', val);
});

// 分类元数据（标题映射）
const categoryMeta = computed<Record<string, string>>(() => ({
  weekly: t('smugglersReport.weekly'),
  inSeason: t('smugglersReport.inSeason'),
  common: t('smugglersReport.common'),
  abyssal: t('smugglersReport.abyssal')
}));

// 已知分类顺序
const knownCategoryKeys = ['weekly', 'inSeason', 'abyssal', 'common'];

/**
 * 计算有序的分类 key 列表
 * 优先使用 data.categoryOrder，否则按已知顺序过滤非空分类
 */
const resolveOrderedKeys = (): string[] => {
  if (Array.isArray(props.data?.categoryOrder) && props.data.categoryOrder.length > 0) {
    return props.data.categoryOrder.filter((k: string) => knownCategoryKeys.includes(k));
  }
  return knownCategoryKeys.filter(key => {
    const list = props.data?.[key];
    return Array.isArray(list) && list.length > 0;
  });
};

// 计算当前可展示的分类标签列表
const availableTabs = computed(() => {
  if (props.categories && props.categories.length > 0) {
    return props.categories.map(k => ({
      key: k,
      title: categoryMeta.value[k] || k
    }));
  }

  let orderedKeys = resolveOrderedKeys();
  if (orderedKeys.length === 0) {
    orderedKeys = ['weekly'];
  }

  return orderedKeys.map(k => ({
    key: k,
    title: categoryMeta.value[k] || k
  }));
});

// 确保当前选中的分类存在于可用列表中
watch(availableTabs, (tabs) => {
  if (!tabs.some(tabItem => tabItem.key === currentTab.value)) {
    currentTab.value = tabs[0]?.key || 'weekly';
  }
}, {immediate: true});

// 筛选面板展开状态
const menuModel = ref(false);

// 筛选条件集合
const filterData = ref({
  keyValue: '',
  inputWidgetKeyValue: '',
  types: [] as string[],
  rarities: [] as string[],
  currencies: [] as string[]
});

// 稀有度配色
const rarityColorConfig = rarity.color;

/**
 * 判定标识所属的实体类型
 * @param id 实体标识
 * @returns 实体类型标识
 */
const resolveEntity = (id: string): 'item' | 'material' | 'commodity' => {
  if (id && id in Items) return 'item';
  if (id && id in Materials) return 'material';
  if (id && id in Commodities) return 'commodity';
  return 'item';
};

/**
 * 读取标识的本地化名称
 * @param id 实体标识
 * @returns 名称文本
 */
const readEntityName = (id: string): string => {
  const entity = resolveEntity(id);
  const reader = entity === 'material' ? readMaterialName : (entity === 'commodity' ? readCommodityName : readItemName);
  return reader(id).name() || '';
};

// 当前分类的原始物品列表
const currentRawList = computed<any[]>(() => {
  const list = props.data?.[currentTab.value];
  return Array.isArray(list) ? list : [];
});

// 类型筛选器可选选项
const typeFilterAvailableOptions = computed(() => {
  const tags = [...new Set(currentRawList.value.map((i: any) => resolveEntity(i?.id)))];
  return tags.map(tag => ({
    value: tag,
    text: t(`smugglersReport.filter.types.${tag}`)
  }));
});

// 稀有度筛选器可选选项
const rarityFilterAvailableOptions = computed(() => {
  const tags = [...new Set(currentRawList.value.map((i: any) => {
    const dict = resolveEntity(i?.id) === 'material' ? Materials : (resolveEntity(i?.id) === 'commodity' ? Commodities : Items);
    return (dict as any)[i?.id]?.rarity || 'none';
  }))];
  return tags.map(tag => ({
    value: tag,
    text: asString([`codex.raritys.${tag}`], {backRawKey: true, variable: tag})
  }));
});

// 货币筛选器可选选项
const currencyFilterAvailableOptions = computed(() => {
  const tags = [...new Set(currentRawList.value.map((i: any) => i?.currency).filter(Boolean))];
  return tags.map(tag => ({
    value: tag,
    text: readMaterialName(tag).name() || tag
  }));
});

// 检查是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return filterData.value.types.length > 0 ||
      filterData.value.rarities.length > 0 ||
      filterData.value.currencies.length > 0 ||
      filterData.value.keyValue !== '';
});

/**
 * 确认搜索关键词
 */
const onSearchItem = () => {
  filterData.value.keyValue = filterData.value.inputWidgetKeyValue;
};

/**
 * 重置全部筛选条件
 */
const onResetFilters = () => {
  filterData.value.types = [];
  filterData.value.rarities = [];
  filterData.value.currencies = [];
  filterData.value.keyValue = '';
  filterData.value.inputWidgetKeyValue = '';
};

// 应用筛选条件后的当前分类物品列表
const filteredRawList = computed<any[]>(() => {
  if (!hasActiveFilters.value) return currentRawList.value;

  const searchValue = filterData.value.keyValue.trim().toLowerCase();

  return currentRawList.value.filter((i: any) => {
    if (!i || !i.id) return false;

    if (filterData.value.types.length > 0 && !filterData.value.types.includes(resolveEntity(i.id))) {
      return false;
    }

    if (filterData.value.rarities.length > 0) {
      const dict = resolveEntity(i.id) === 'material' ? Materials : (resolveEntity(i.id) === 'commodity' ? Commodities : Items);
      const itemRarity = (dict as any)[i.id]?.rarity || 'none';
      if (!filterData.value.rarities.includes(itemRarity)) return false;
    }

    if (filterData.value.currencies.length > 0 && !filterData.value.currencies.includes(i.currency)) {
      return false;
    }

    if (searchValue) {
      const name = readEntityName(i.id).toLowerCase();
      if (!name.includes(searchValue) && !i.id.toLowerCase().includes(searchValue)) return false;
    }

    return true;
  });
});

/**
 * 转换并填充指定分类的物品数据为固定30格网格
 * @param rawList 原始物品列表
 * @param isPadEmpty 是否用空槽位补齐至30格
 * @returns 填充后的展示数据数组
 */
const formatItemList = (rawList: any[] = [], isPadEmpty: boolean = true) => {
  const list = (rawList || []).map((i: any) => {
    if (!i) return null;
    const {id, ...o} = i;
    const key = String(id);
    const d: any = {...o};
    if (key in Items) d.data = (Items as any)[key];
    if (key in Materials) d.data = (Materials as any)[key];
    if (key in Commodities) d.data = (Commodities as any)[key];
    return d;
  });

  if (!isPadEmpty) return list;

  const supplementLength = Math.max(0, 30 - list.length);
  const supplementData: any[] = Array.from({length: supplementLength}, () => null);
  return list.concat(supplementData);
};

// 当前选中分类的物品展示网格数据（非 readonly 模式使用）
const currentDisplayItems = computed(() => {
  // 筛选激活时仅展示命中项，不再补齐空槽位
  if (hasActiveFilters.value) {
    return formatItemList(filteredRawList.value, false);
  }
  return formatItemList(currentRawList.value);
});

// readonly 模式下按分类面板聚合展示数据
const readonlyPanels = computed(() => {
  let orderedKeys = resolveOrderedKeys();
  if (orderedKeys.length === 0) {
    orderedKeys = ['weekly'];
  }

  return orderedKeys
      .map(key => {
        const rawList = props.data?.[key];
        const list = Array.isArray(rawList) ? rawList : [];
        return {
          key,
          title: categoryMeta.value[key] || key,
          items: formatItemList(list)
        };
      })
      // 过滤掉完全没有任何有效物品的空面板
      .filter(panel => panel.items.some((i: any) => i && i.data));
});

defineOptions({
  name: 'SmugglersReportShowItemWidget'
});
</script>

<template>
  <div class="smugglers-report-show-widget">
    <!-- 非 readonly：tabs + 筛选菜单 -->
    <template v-if="!readonly">
      <v-row class="align-center" no-gutters>
        <v-col>
          <v-tabs
              v-model="currentTab"
              height="50"
              color="var(--main-color)"
              :show-arrows="true">
            <v-tab
                v-for="tab in availableTabs"
                :key="tab.key"
                :value="tab.key"
                active-color="primary"
                class="text-h6">
              {{ tab.title }}
            </v-tab>
          </v-tabs>
        </v-col>
        <v-col cols="auto">
          <v-menu v-model="menuModel"
                  open-on-click
                  :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="cursor-pointer d-flex">
                <v-icon>{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                <v-icon>mdi-dots-vertical</v-icon>
              </div>
            </template>

            <v-card border :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 480">
              <v-card-title class="py-10 text-center bg-black mb-4">
                <v-icon size="80">{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
              </v-card-title>
              <div class="pa-5">
                <v-row>
                  <v-col cols="12">
                    <v-text-field :placeholder="t('basic.button.search')" hide-details
                                  variant="filled"
                                  density="comfortable"
                                  clearable
                                  @keydown.enter="onSearchItem"
                                  @click:clear="onSearchItem"
                                  v-model="filterData.inputWidgetKeyValue">
                      <template v-slot:append-inner>
                        <v-btn @click="onSearchItem" icon variant="text" density="comfortable">
                          <v-icon icon="mdi-magnify"></v-icon>
                        </v-btn>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <div class="mb-2">{{ t('smugglersReport.filter.byType') }} ({{ typeFilterAvailableOptions.length || 0 }})</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="filterData.types"
                        :disabled="typeFilterAvailableOptions.length == 0"
                        :placeholder="t('smugglersReport.filter.byType')"
                        :counter="3"
                        :eager="false"
                        :glow="false"
                        :items="typeFilterAvailableOptions"
                        hide-details
                        multiple
                        chips
                        clearable
                    ></v-select>
                  </v-col>

                  <v-col cols="6">
                    <div class="mb-2">{{ t('smugglersReport.filter.byRarity') }} ({{ rarityFilterAvailableOptions.length || 0 }})</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="filterData.rarities"
                        :disabled="rarityFilterAvailableOptions.length == 0"
                        :placeholder="t('smugglersReport.filter.byRarity')"
                        :counter="3"
                        :eager="false"
                        :glow="false"
                        :items="rarityFilterAvailableOptions"
                        hide-details
                        multiple
                        chips
                        clearable>
                      <template v-slot:item="{ item, props }">
                        <v-list-item
                            v-bind="props"
                            :style="`color: ${rarityColorConfig[item.value]}`">
                          <template v-slot:prepend>
                            <v-checkbox
                                class="pa-0 ma-0"
                                density="compact"
                                hide-spin-buttons
                                hide-details
                                :model-value="filterData.rarities.includes(item.value)"
                                @click.stop
                            ></v-checkbox>
                          </template>
                        </v-list-item>
                      </template>

                      <template v-slot:selection="{ item, index }">
                        <v-chip
                            v-if="index < 2"
                            :style="`color: ${rarityColorConfig[item.value]}; border-color: ${rarityColorConfig[item.value]}`"
                            variant="outlined"
                            size="small">
                          {{ item.text }}
                        </v-chip>
                        <span
                            v-if="index === 2"
                            class="text-grey text-caption">
                          +{{ filterData.rarities.length - 2 }} more
                        </span>
                      </template>

                      <template v-slot:chip="{ item }">
                        <v-chip
                            :style="`color: ${rarityColorConfig[item.value]}; border-color: ${rarityColorConfig[item.value]}`"
                            variant="tonal"
                            size="small">
                          {{ item.text }}
                        </v-chip>
                      </template>
                    </v-select>
                  </v-col>

                  <v-col cols="6">
                    <div class="mb-2">{{ t('smugglersReport.filter.byCurrency') }} ({{ currencyFilterAvailableOptions.length || 0 }})</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="filterData.currencies"
                        :disabled="currencyFilterAvailableOptions.length == 0"
                        :placeholder="t('smugglersReport.filter.byCurrency')"
                        :counter="3"
                        :eager="false"
                        :glow="false"
                        :items="currencyFilterAvailableOptions"
                        hide-details
                        multiple
                        chips
                        clearable
                    ></v-select>
                  </v-col>
                </v-row>

                <v-card-actions class="mx-n4 mt-4 px-4">
                  <v-row>
                    <v-spacer></v-spacer>
                    <v-col cols="auto" class="text-right d-flex ga-2">
                      <v-btn @click="menuModel = false">
                        {{ t('basic.button.cancel') }}
                      </v-btn>
                      <v-btn
                          @click="onResetFilters"
                          variant="outlined"
                          color="error"
                          :disabled="!hasActiveFilters"
                          prepend-icon="mdi-refresh">
                        {{ t('basic.button.reset') }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-actions>
              </div>
            </v-card>
          </v-menu>
        </v-col>
      </v-row>
      <v-divider thickness="2" class="mb-5"></v-divider>
    </template>

    <!-- readonly：按分类面板遍历整个 data -->
    <template v-if="readonly">
      <v-row>
        <v-col
            v-for="panel in readonlyPanels"
            :key="panel.key"
            class="mb-6">
          <div v-if="panel.title" class="text-h6 text-amber mb-3">{{ panel.title }}</div>
          <v-divider thickness="2" class="mb-5"></v-divider>
          <v-row class="justify-start">
            <v-col
                cols="auto"
                v-for="(i, index) in panel.items"
                :key="index">
              <div class="d-flex flex-column align-center">
                <ItemSlotBase size="99px" class="d-flex justify-center align-center">
                  <template v-if="i && i.data">
                    <MaterialIconWidget v-if="i.data._typeStringName == 'Material'" :id="i.data.id"></MaterialIconWidget>
                    <CommoditieIconWidget v-else-if="i.data._typeStringName == 'Commodity'" :id="i.data.id"></CommoditieIconWidget>
                    <ItemIconWidget v-else :id="i.data.id"></ItemIconWidget>
                  </template>

                  <template v-else>
                    <v-icon class="opacity-20" size="30">mdi-help</v-icon>
                  </template>
                </ItemSlotBase>
                <div v-if="i && i.data"
                     class="text-center text-truncate mt-1"
                     style="width: 99px">
                  <MaterialName v-if="i.data._typeStringName == 'Material'" :id="i.data.id"></MaterialName>
                  <CommoditieName v-else-if="i.data._typeStringName == 'Commodity'" :id="i.data.id"></CommoditieName>
                  <ItemName v-else :id="i.data.id"></ItemName>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </template>

    <!-- 非 readonly：保持原有单面板网格逻辑 -->
    <v-row class="justify-start" v-else>
      <v-col
          cols="auto"
          v-for="(i, index) in currentDisplayItems"
          :key="index">
        <div class="d-flex flex-column align-center">
          <ItemSlotBase size="99px" class="d-flex justify-center align-center">
            <template v-if="i && i.data">
              <MaterialIconWidget v-if="i.data._typeStringName == 'Material'" :id="i.data.id"></MaterialIconWidget>
              <CommoditieIconWidget v-else-if="i.data._typeStringName == 'Commodity'" :id="i.data.id"></CommoditieIconWidget>
              <ItemIconWidget v-else :id="i.data.id"></ItemIconWidget>
            </template>

            <template v-else>
              <v-icon class="opacity-20" size="30">mdi-help</v-icon>
            </template>
          </ItemSlotBase>
          <div v-if="i && i.data"
               class="text-center text-truncate mt-1"
               style="width: 99px">
            <MaterialName v-if="i.data._typeStringName == 'Material'" :id="i.data.id"></MaterialName>
            <CommoditieName v-else-if="i.data._typeStringName == 'Commodity'" :id="i.data.id"></CommoditieName>
            <ItemName v-else :id="i.data.id"></ItemName>
          </div>
        </div>
        <div class="d-flex ga-2 align-center justify-center text-caption">
          <ItemSlotBase size="18px" class="rounded-lg mx-n1">
            <MaterialIconWidget :id="i.currency"></MaterialIconWidget>
          </ItemSlotBase> <u class="u">{{ i.worth || 0 }}</u>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.smugglers-report-show-widget {
  width: 100%;
}
</style>
