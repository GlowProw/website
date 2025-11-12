<script setup lang="ts">
import {Cosmetics, Items, MapLocations, Materials, Modifications, Sets, Ships, TreasureMaps} from "glow-prow-data";
import {Commodities} from "glow-prow-data/src/entity/Commodities";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import {computed, onMounted, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {number, rarity} from "@/assets/sripts/index";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import ShipName from "@/components/snbWidget/shipName.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import ModName from "@/components/snbWidget/modName.vue";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";
import MapLocationNameWidget from "@/components/snbWidget/mapLocationNameWidget.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";
import SetName from "@/components/snbWidget/setName.vue";

type LoadDataType = 'ship' | 'item' | 'commoditie' | 'material' | 'ultimate' | 'cosmetic' | 'modification' | 'set' | 'treasureMaps' | 'mapLocation'
type SortField = 'dateAdded' | 'lastUpdated'
type SortOrder = 'asc' | 'desc'

const
    props = withDefaults(defineProps<{ loadDataType: LoadDataType[] }>(), {
      loadDataType: ['item']
    }),

    // 数据 手稿
    ships = Ships,
    items = Items,
    commodities = Commodities,
    materials = Materials,
    ultimates = Ultimates,
    cosmetics = Cosmetics,
    modifications = Modifications,
    sets = Sets,

    // 数据 地图
    treasureMaps = TreasureMaps,
    mapLocation = MapLocations,

    // 稀有度
    rarityColorConfig = rarity.color,

    route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    {mobile, sm, md, lg} = useDisplay(),
    {asString, sanitizeString} = useI18nUtils()

let data: any = ref([]),
    exceedingItemsCount = ref(0),
    // 筛选
    filterData = ref({
      keyValue: '',
      sets: [],
      setTags: [],
      types: [],
      typeTags: [],
      categorys: [],
      categoryTags: [],
      rarities: [],
      rarityTags: [],
      tiers: [],
      tierTags: [],
      seasons: [],
      seasonTags: [],
      inputWidgetKeyValue: '',
      page: 1,
      limit: 50,
      sortField: 'dateAdded' as SortField,
      sortOrder: 'desc' as SortOrder
    }),
    // 类型 筛选器可选选项
    typeFilterAvailableOptions = computed(() => [
      ...filterData.value.typeTags.map(tag => ({
        value: tag,
        text: asString([`codex.types.${tag}`], {backRawKey: true, variable: tag})
      }))
    ]),
    // 类别 筛选器可选选项
    categoryFilterAvailableOptions = computed(() => [
      ...filterData.value.categoryTags.map(tag => ({
        value: tag,
        text: asString([`codex.categorys.${tag}`, `map.types.${tag}.name`], {backRawKey: true, variable: tag})
      }))
    ]),
    // 稀有度筛选器可选选项
    rarityFilterAvailableOptions = computed(() => [
      ...filterData.value.rarityTags.map(rarity => ({
        value: rarity,
        text: asString([`codex.rarity.${rarity}`], {backRawKey: true, variable: rarity})
      }))
    ]),
    // tier筛选器可选选项
    tierFilterAvailableOptions = computed(() => [
      ...filterData.value.tierTags.map(tier => ({
        value: tier.toString(),
        text: asString([`codex.tier`], {
          backRawKey: true, variable: {
            num: number.intToRoman(tier)
          }
        })
      }))
    ]),
    // 赛季筛选器可选选项
    seasonFilterAvailableOptions = computed(() => [
      ...filterData.value.seasonTags.map(season => ({
        value: season,
        text: asString([`snb.seasons.${season}`], {backRawKey: false, variable: season})
      }))
    ]),
    // set筛选器可选选项
    setFilterAvailableOptions = computed(() => [
      ...filterData.value.setTags.map(set => ({
        value: set,
        text: asString([`snb.sets.${set}`], {backRawKey: false, variable: set})
      }))
    ]),
    // 检查是否有活跃的筛选条件
    hasActiveFilters = computed(() => {
      return filterData.value.types.length > 0 ||
          filterData.value.categorys.length > 0 ||
          filterData.value.rarities.length > 0 ||
          filterData.value.tiers.length > 0 ||
          filterData.value.seasons.length > 0 ||
          filterData.value.sets.length > 0 ||
          filterData.value.sortField !== 'dateAdded' ||
          filterData.value.sortOrder !== 'desc' ||
          filterData.value.keyValue !== '' ||
          filterData.value.inputWidgetKeyValue !== '';
    }),
    size = computed(() => {
      let s = 120
      if (mobile.value) {
        s = 99
      }
      return s;
    })

/**
 * 处理数据
 */
const onProcessedData = computed(() => {
      let d = originalData.value;
      let searchValue = filterData.value.keyValue.toLowerCase();
      let filterItemTypes = filterData.value.types;
      let filterItemCategorys = filterData.value.categorys;
      let filterRarities = filterData.value.rarities;
      let filterTiers = filterData.value.tiers;
      let filterSeasons = filterData.value.seasons;
      let filterSets = filterData.value.sets;

      const filteredData = d.filter(i => {
        // 检查关键词匹配
        const nameMatch = asString([
          i.id,

          `snb.ships.${i.id}.name`,
          `snb.ships.${sanitizeString(i.id).cleaned}.name`,

          `snb.items.${i.id}.name`,
          `snb.items.${sanitizeString(i.id).cleaned}.name`,

          `snb.commodities.${i.id}.name`,
          `snb.commodities.${sanitizeString(i.id).cleaned}.name`,

          `snb.materials.${i.id}.name`,
          `snb.materials.${sanitizeString(i.id).cleaned}.name`,

          `snb.ultimates.${i.id}.name`,
          `snb.ultimates.${sanitizeString(i.id).cleaned}.name`,

          `snb.cosmetics.${i.id}.name`,
          `snb.cosmetics.${sanitizeString(i.id).cleaned}.name`,

          `snb.modifications.${i.id}.name`,
          `snb.modifications.${sanitizeString(i.id).cleaned}.name`,

          `snb.sets.${i.id}`,
        ], {
          backRawKey: true
        }).toLowerCase().indexOf(searchValue) >= 0;

        const idMatch = i.id.toLowerCase().indexOf(searchValue) >= 0;

        // 检查类型、类别、稀有度和tier匹配
        const typeMatch = filterItemTypes.length === 0 || filterItemTypes.includes(i.type)
        const categoryMatch = filterItemCategorys.length === 0 || filterItemCategorys.includes(i.category);
        const rarityMatch = filterRarities.length === 0 || filterRarities.includes(i.rarity);
        const tierMatch = filterTiers.length === 0 || (i.tier && filterTiers.includes(i.tier.toString()));
        const setMatch = filterSets.length === 0 || (i.set && filterSets.includes(i.set.id));

        // 检查赛季匹配
        const seasonMatch = filterSeasons.length === 0 ||
            (i.bySeason && filterSeasons.includes(i.bySeason.id)) ||
            (i.seasons && i.seasons.some((s: string) => filterSeasons.includes(s)));

        // 返回同时满足关键词、类型、稀有度、tier和赛季条件的项目
        return (nameMatch || idMatch) && typeMatch && categoryMatch && rarityMatch && tierMatch && seasonMatch && setMatch;
      });

      // 排序
      const sortedData = filteredData.sort((a, b) => {
        const field = filterData.value.sortField;
        const order = filterData.value.sortOrder;

        let aValue = a[field];
        let bValue = b[field];

        // 处理日期排序
        if (field === 'dateAdded' || field === 'lastUpdated') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }

        // 处理空值
        if (!aValue && !bValue) return 0;
        if (!aValue) return order === 'asc' ? -1 : 1;
        if (!bValue) return order === 'asc' ? 1 : -1;

        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });

      if (isSearching.value)
        exceedingItemsCount.value = Math.max(sortedData.length - maximumSearchCount, 0);
      return isSearching.value ? sortedData.slice(0, maximumSearchCount) : sortedData;
    }),
    maximumSearchCount = route.query.debug ? 10000 : 100,
    originalData = computed(() => {
      let d = []
      props.loadDataType.forEach(type => {
        switch (type) {
            // 手稿
          case "ship":
            d = d.concat(Object.values(ships));
            break;
          case "item":
            d = d.concat(Object.values(items));
            break;
          case "commoditie":
            d = d.concat(Object.values(commodities));
            break;
          case "material":
            d = d.concat(Object.values(materials));
            break;
          case "cosmetic":
            d = d.concat(Object.values(cosmetics));
            break;
          case "ultimate":
            d = d.concat(Object.values(ultimates));
            break;
          case "modification":
            d = d.concat(Object.values(modifications));
            break;
          case "set":
            d = d.concat(Object.values(sets));
            break;
            // 地图
          case "treasureMaps":
            d = d.concat(Object.values(treasureMaps));
            break;
          case "mapLocation":
            d = d.concat(Object.values(mapLocation));
            break;
        }
      })
      return Object.values(d)
    }),
    isSearching = computed(() => !!(filterData.value.keyValue)),
    isType = computed(() => filterData.value.types.length > 0),
    isCategory = computed(() => filterData.value.categorys.length > 0),
    isRarity = computed(() => filterData.value.rarities.length > 0),
    isTier = computed(() => filterData.value.tiers.length > 0),
    isSeason = computed(() => filterData.value.seasons.length > 0),
    isSet = computed(() => filterData.value.sets.length > 0),

    isFilterSet = computed(() => props.loadDataType == 'cosmetic'),

    // 否应该显示无限滚动
    isShouldShowInfiniteScroll = computed(() => !isSearching.value && !isType.value && !isCategory.value && !isRarity.value && !isTier.value && !isSeason.value && !isSet.value)

// 监听路由变化，同步query到筛选条件
watch(() => route.query, (newQuery) => {
  if (newQuery.key) {
    filterData.value.inputWidgetKeyValue = newQuery.key;
    filterData.value.keyValue = newQuery.key;
  }
  if (newQuery.type) {
    filterData.value.types = Array.isArray(newQuery.type) ? newQuery.type : newQuery.type.split(',');
  }
  if (newQuery.category) {
    filterData.value.categorys = Array.isArray(newQuery.category) ? newQuery.category : newQuery.category.split(',');
  }
  if (newQuery.rarity) {
    filterData.value.rarities = Array.isArray(newQuery.rarity) ? newQuery.rarity : newQuery.rarity.split(',');
  }
  if (newQuery.tier) {
    filterData.value.tiers = Array.isArray(newQuery.tier) ? newQuery.tier : newQuery.tier.split(',');
  }
  if (newQuery.season) {
    filterData.value.seasons = Array.isArray(newQuery.season) ? newQuery.season : newQuery.season.split(',');
  }
  if (newQuery.set) {
    filterData.value.sets = Array.isArray(newQuery.set) ? newQuery.set : newQuery.set.split(',');
  }
  if (newQuery.sortField) {
    filterData.value.sortField = newQuery.sortField as SortField;
  }
  if (newQuery.sortOrder) {
    filterData.value.sortOrder = newQuery.sortOrder as SortOrder;
  }
}, {immediate: true});

onMounted(() => {
  onInitTypeLoad()
  onInitCategoryLoad()
  onInitRarityLoad()
  onInitTierLoad()
  onInitSeasonLoad()
  onInitSetLoad()
})

/**
 * 初始筛选可选 类型 标签选项
 */
const onInitTypeLoad = () => {
  let d = originalData.value
  filterData.value.typeTags = [...new Set(d.map(i => i.type || 'none'))]
}

/**
 * 初始筛选可选 类别 标签选项
 */
const onInitCategoryLoad = () => {
  let d = originalData.value
  filterData.value.categoryTags = [...new Set(d.map(i => i.category || 'none'))]
}

/**
 * 初始筛选可选 稀有度 标签选项
 */
const onInitRarityLoad = () => {
  let d = originalData.value
  filterData.value.rarityTags = [...new Set(d.map(i => i.rarity || 'none'))]
}

/**
 * 初始筛选可选 tier 标签选项
 */
const onInitTierLoad = () => {
  let d = originalData.value
  filterData.value.tierTags = [...new Set(d.map(i => i.tier || 'none').filter(tier => tier !== 'none'))]
}

/**
 * 初始筛选可选赛季选项
 */
const onInitSeasonLoad = () => {
  let d = originalData.value
  const allSeasons = new Set<string>();

  d.forEach(i => {
    if (i.bySeason) {
      allSeasons.add(i.bySeason.id);
    }
  });

  filterData.value.seasonTags = [...allSeasons].sort();
}

/**
 * 初始筛选可选Set选项
 */
const onInitSetLoad = () => {
  let d = originalData.value
  const allSet = new Set<string>();

  d.forEach(i => {
    if (i.set) {
      allSet.add(i.set.id);
    }
  });

  filterData.value.setTags = [...allSet].sort();
}

/**
 * 更新URL查询参数
 */
const updateQueryParams = () => {
  const query: any = {};
  if (filterData.value.keyValue != '') {
    query.key = filterData.value.keyValue;
  }
  if (filterData.value.types.length > 0) {
    query.type = filterData.value.types.join(',');
  }
  if (filterData.value.categorys.length > 0) {
    query.category = filterData.value.categorys.join(',');
  }
  if (filterData.value.rarities.length > 0) {
    query.rarity = filterData.value.rarities.join(',');
  }
  if (filterData.value.tiers.length > 0) {
    query.tier = filterData.value.tiers.join(',');
  }
  if (filterData.value.seasons.length > 0) {
    query.season = filterData.value.seasons.join(',');
  }
  if (filterData.value.sets.length > 0) {
    query.set = filterData.value.sets.join(',');
  }
  if (filterData.value.sortField !== 'dateAdded') {
    query.sortField = filterData.value.sortField;
  }
  if (filterData.value.sortOrder !== 'desc') {
    query.sortOrder = filterData.value.sortOrder;
  }

  router.replace({
    query: Object.keys(query).length > 0 ? query : undefined
  });
}

/**
 * 重置所有筛选条件
 */
const resetAllFilters = () => {
  filterData.value.types = [];
  filterData.value.categorys = [];
  filterData.value.rarities = [];
  filterData.value.tiers = [];
  filterData.value.seasons = [];
  filterData.value.sets = [];
  filterData.value.sortField = 'dateAdded';
  filterData.value.sortOrder = 'desc';
  filterData.value.keyValue = '';
  filterData.value.inputWidgetKeyValue = '';

  // 重置分页数据
  data.value = [];
  filterData.value.page = 1;

  // 更新URL
  updateQueryParams();
}

/**
 * 加载数据
 * @param done
 */
const onLoad = ({done}) => {
  // 如果正在搜索或筛选类型、类别、稀有度、tier或赛季，直接返回空
  if (isSearching.value || isType.value || isCategory.value || isRarity.value || isTier.value || isSeason.value || isSet.value) {
    done('empty')
    return
  }

  const allData = originalData.value;
  const startIndex = (filterData.value.page - 1) * filterData.value.limit;
  const endIndex = startIndex + filterData.value.limit;

  // 确保不会超出数组范围
  if (startIndex >= allData.length) {
    done('empty');
    return;
  }

  const newData = allData.slice(startIndex, endIndex);
  data.value.push(...newData);
  filterData.value.page++;

  if (data.value.length >= allData.length) {
    done('empty');
  } else {
    done('ok');
  }
}

/**
 * 检索
 */
const onSearchItem = () => {
  const query: any = {};
  filterData.value.keyValue = filterData.value.inputWidgetKeyValue;

  if (filterData.value.keyValue != '') {
    query.key = filterData.value.keyValue;
  }

  // 搜索时重置分页数据
  if (filterData.value.keyValue) {
    data.value = []
  }

  router.replace({
    query: Object.keys(query).length > 0 ? query : undefined
  });
}

/**
 * 过滤物品 类型
 */
const onFilterItemType = (value) => {
  filterData.value.types = value;
  updateQueryParams();
  // 类型筛选时重置分页数据
  if (value.length > 0) {
    data.value = []
  }
}

/**
 * 过滤物品 类别
 */
const onFilterCategory = (value) => {
  filterData.value.categorys = value;
  updateQueryParams();
  // 类别筛选时重置分页数据
  if (value.length > 0) {
    data.value = []
  }
}

/**
 * 过滤物品 稀有度
 */
const onFilterRarity = (value) => {
  filterData.value.rarities = value;
  updateQueryParams();
  // 稀有度筛选时重置分页数据
  if (value.length > 0) {
    data.value = []
  }
}

/**
 * 过滤物品 tier
 */
const onFilterTier = (value) => {
  filterData.value.tiers = value;
  updateQueryParams();
  // tier筛选时重置分页数据
  if (value.length > 0) {
    data.value = []
  }
}

/**
 * 过滤赛季
 */
const onFilterSeason = (value) => {
  filterData.value.seasons = value;
  updateQueryParams();
  // 赛季筛选时重置分页数据
  if (value.length > 0) {
    data.value = []
  }
}

/**
 * 过滤Set
 */
const onFilterSet = (value) => {
  filterData.value.sets = value;
  updateQueryParams();
  // set筛选时重置分页数据
  if (value.length > 0) {
    data.value = []
  }
}

/**
 * 排序
 */
const onSort = (field: SortField, order: SortOrder) => {
  filterData.value.sortField = field;
  filterData.value.sortOrder = order;
  updateQueryParams();
}
</script>

<template>
  <div>
    <v-row align="center">
      <v-col>
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
      <v-col cols="auto">
        <v-menu open-on-click :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <div v-bind="props">
              <v-icon>{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </div>
          </template>

          <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
            <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
              <v-icon size="80">{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
            </v-card-title>

            <v-row>
              <v-col cols="12">
                <div class="mb-2">{{ t('codex.filter.byType') }} ({{ typeFilterAvailableOptions.length || 0 }})</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterItemType"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.types"
                    :disabled="typeFilterAvailableOptions.length == 0"
                    :placeholder="t('codex.filter.byType')"
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

              <v-col cols="12">
                <div class="mb-2">{{ t('codex.filter.byCategory') }} ({{ categoryFilterAvailableOptions.length || 0 }})</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterCategory"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.categorys"
                    :disabled="categoryFilterAvailableOptions.length == 0"
                    :placeholder="t('codex.filter.byCategory')"
                    :counter="3"
                    :eager="false"
                    :glow="false"
                    :items="categoryFilterAvailableOptions"
                    hide-details
                    multiple
                    chips
                    clearable
                ></v-select>
              </v-col>

              <v-col cols="6">
                <div class="mb-2">{{ t('codex.filter.byRarity') }} ({{ rarityFilterAvailableOptions.length || 0 }})</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterRarity"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.rarities"
                    :disabled="rarityFilterAvailableOptions.length == 0"
                    :placeholder="t('codex.filter.byRarity')"
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
                      {{ item.title }}
                    </v-chip>
                    <span
                        v-if="index === 2"
                        class="text-grey text-caption">
                      +{{ filterData.rarities.length - 2 }} more
                    </span>
                  </template>

                  <template v-slot:chip="{ item, index }">
                    <v-chip
                        :style="`color: ${rarityColorConfig[item.value]}; border-color: ${rarityColorConfig[item.value]}`"
                        variant="tonal"
                        size="small">
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>

              <v-col cols="6">
                <div class="mb-2">{{ t('codex.filter.byTier') }} ({{ tierFilterAvailableOptions.length || 0 }})</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterTier"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.tiers"
                    :disabled="tierFilterAvailableOptions.length == 0"
                    :placeholder="t('codex.filter.byTier')"
                    :counter="3"
                    :eager="false"
                    :glow="false"
                    :items="tierFilterAvailableOptions"
                    hide-details
                    multiple
                    chips
                    clearable
                ></v-select>
              </v-col>

              <v-col cols="6">
                <div class="mb-2">{{ t('codex.filter.bySeason') }} ({{ setFilterAvailableOptions.length || 0 }})</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterSeason"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.seasons"
                    :disabled="setFilterAvailableOptions.length <= 0"
                    :placeholder="t('codex.filter.bySeason')"
                    :counter="3"
                    :eager="false"
                    :glow="false"
                    :items="seasonFilterAvailableOptions"
                    hide-details
                    multiple
                    chips
                    clearable
                ></v-select>
              </v-col>

              <v-col cols="6" v-if="isFilterSet">
                <div class="mb-2">{{ t('codex.filter.bySet') }} ({{ setFilterAvailableOptions.length || 0 }})</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterSet"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.sets"
                    :disabled="setFilterAvailableOptions.length <= 0"
                    :placeholder="t('codex.filter.bySet')"
                    :counter="3"
                    :eager="true"
                    :glow="false"
                    :items="setFilterAvailableOptions"
                    hide-details
                    multiple
                    chips
                    clearable
                ></v-select>
              </v-col>

              <v-col cols="12">
                <div class="mb-2">{{ t('codex.filter.sortBy') }}</div>
                <v-row>
                  <v-col cols="6">
                    <v-select
                        variant="filled"
                        @update:model-value="onSort(filterData.sortField, filterData.sortOrder)"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="filterData.sortField"
                        :items="[
                          { value: 'dateAdded', text: t('codex.filter.dateAdded') },
                          { value: 'lastUpdated', text: t('codex.filter.lastUpdated') }
                        ]"
                        hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                        variant="filled"
                        @update:model-value="onSort(filterData.sortField, filterData.sortOrder)"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="filterData.sortOrder"
                        :items="[
                          { value: 'desc', text: t('codex.filter.descending') },
                          { value: 'asc', text: t('codex.filter.ascending') }
                        ]"
                        hide-details
                    ></v-select>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <v-card-actions class="mx-n4 mt-4 px-4">
              <v-row>
                <v-spacer></v-spacer>
                <v-col cols="auto" class="text-right">
                  <v-btn
                      @click="resetAllFilters"
                      variant="outlined"
                      color="error"
                      :disabled="!hasActiveFilters"
                      prepend-icon="mdi-refresh">
                    {{ t('basic.button.reset') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-col>
    </v-row>

    <template v-if="exceedingItemsCount > 0">
      <v-alert class="w-100 mb-5" type="warning" variant="tonal">
        {{ t('codex.ships.searchCountOverflowTip', {maximumSearchCount, exceedingItemsCount}) }}
      </v-alert>
    </template>

    <v-infinite-scroll @load="onLoad">
      <template v-if="isShouldShowInfiniteScroll">
        <v-row class="list ga-4" no-gutters>
          <v-card v-for="(i,index) in data" :key="index" :width="size" variant="text">
            <div class="position-relative">
              <ItemSlotBase :size="`${size}px`" class="position-relative">
                <ShipIconWidget :id="i.id" v-if="loadDataType == 'ship'"></ShipIconWidget>
                <ItemIconWidget :id="i.id" v-if="loadDataType == 'item'"></ItemIconWidget>
                <CommoditieIconWidget :id="i.id" v-if="loadDataType == 'commoditie'"></CommoditieIconWidget>
                <MaterialIconWidget :id="i.id" v-if="loadDataType == 'material'"></MaterialIconWidget>
                <CosmeticIconWidget :id="i.id" v-if="loadDataType == 'cosmetic'"></CosmeticIconWidget>
                <SetIconWidget :id="i.id" v-if="loadDataType == 'set'"></SetIconWidget>
                <UltimateIconWidget :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateIconWidget>
                <ModIconWidget :id="i.id" v-if="loadDataType == 'modification'"></ModIconWidget>

                <TreasureMapIconWidget :id="i.id" v-if="loadDataType == 'treasureMaps'"></TreasureMapIconWidget>
                <MapLocationIconWidget :id="i.id" v-if="loadDataType == 'mapLocation'"></MapLocationIconWidget>
              </ItemSlotBase>

              <div v-if="i.set && i.set.id && isFilterSet" class="position-absolute subordinate-data">
                <ItemSlotBase size="40px" :padding="0">
                  <SetIconWidget :id="i.set.id"></SetIconWidget>
                </ItemSlotBase>
              </div>
            </div>
            <div class="text-center singe-line w-100">
              <ShipName :id="i.id" v-if="loadDataType == 'ship'"></ShipName>
              <ItemNameRarity :id="i.id" v-if="loadDataType == 'item'">
                <ItemName :data="i"></ItemName>
              </ItemNameRarity>
              <CommoditieName :id="i.id" v-if="loadDataType == 'commoditie'"></CommoditieName>
              <MaterialNameRarity :id="i.id" v-if="loadDataType == 'material'">
                <MaterialName :id="i.id"></MaterialName>
              </MaterialNameRarity>
              <CosmeticName :id="i.id" v-if="loadDataType == 'cosmetic'"></CosmeticName>
              <SetName :id="i.id" v-if="loadDataType == 'set'"></SetName>
              <UltimateName :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateName>
              <ModName :id="i.id" v-if="loadDataType == 'modification'" :grade="i.grade"></ModName>

              <TreasureMapName :id="i.id" v-if="loadDataType == 'treasureMaps'"></TreasureMapName>
              <MapLocationNameWidget :id="i.id" v-if="loadDataType == 'mapLocation'"></MapLocationNameWidget>
            </div>
          </v-card>
        </v-row>
      </template>
      <template v-else>
        <!-- 搜索或筛选时的显示 S -->
        <v-row class="list ga-4" no-gutters>
          <v-card v-for="(i,index) in onProcessedData" :key="index" :width="size" variant="text">
            <div class="position-relative">
              <ItemSlotBase :size="`${size}px`" class="position-relative">
                <ShipIconWidget :id="i.id" v-if="loadDataType == 'ship'"></ShipIconWidget>
                <ItemIconWidget :id="i.id" v-if="loadDataType == 'item'"></ItemIconWidget>
                <CommoditieIconWidget :id="i.id" v-if="loadDataType == 'commoditie'"></CommoditieIconWidget>
                <MaterialIconWidget :id="i.id" v-if="loadDataType == 'material'"></MaterialIconWidget>
                <CosmeticIconWidget :id="i.id" v-if="loadDataType == 'cosmetic'"></CosmeticIconWidget>
                <SetIconWidget :id="i.id" v-if="loadDataType == 'set'"></SetIconWidget>
                <UltimateIconWidget :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateIconWidget>
                <ModIconWidget :id="i.id" v-if="loadDataType == 'modification'"></ModIconWidget>

                <TreasureMapIconWidget :id="i.id" v-if="loadDataType == 'treasureMaps'"></TreasureMapIconWidget>
                <MapLocationIconWidget :id="i.id" v-if="loadDataType == 'mapLocation'"></MapLocationIconWidget>
              </ItemSlotBase>

              <div v-if="i.set && i.set.id && isFilterSet" class="position-absolute subordinate-data">
                <ItemSlotBase size="40px" :padding="0">
                  <SetIconWidget :id="i.set.id"></SetIconWidget>
                </ItemSlotBase>
              </div>
            </div>
            <div class="text-center singe-line w-100">
              <ShipName :id="i.id" v-if="loadDataType == 'ship'"></ShipName>
              <ItemNameRarity :id="i.id" v-if="loadDataType == 'item'">
                <ItemName :data="i"></ItemName>
              </ItemNameRarity>
              <CommoditieName :id="i.id" v-if="loadDataType == 'commoditie'"></CommoditieName>
              <MaterialNameRarity :id="i.id" v-if="loadDataType == 'material'">
                <MaterialName :id="i.id"></MaterialName>
              </MaterialNameRarity>
              <CosmeticName :id="i.id" v-if="loadDataType == 'cosmetic'"></CosmeticName>
              <SetName :id="i.id" v-if="loadDataType == 'set'"></SetName>
              <UltimateName :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateName>
              <ModName :id="i.id" v-if="loadDataType == 'modification'" :grade="i.grade"></ModName>

              <TreasureMapName :id="i.id" v-if="loadDataType == 'treasureMaps'"></TreasureMapName>
              <MapLocationNameWidget :id="i.id" v-if="loadDataType == 'mapLocation'"></MapLocationNameWidget>
            </div>
          </v-card>
        </v-row>
        <!-- 搜索或筛选时的显示 E -->
      </template>

      <template v-slot:empty></template>
      <template v-slot:loading>
        <v-btn density="comfortable" class="my-8" icon>
          <Loading :size="42"></Loading>
        </v-btn>
      </template>
      <template v-slot:load-more="{ props }">
        <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            v-bind="props"
        ></v-btn>
      </template>
    </v-infinite-scroll>


    <!-- 空状态显示 S -->
    <template v-if="(isShouldShowInfiniteScroll && data.length <= 0) || (!isShouldShowInfiniteScroll && onProcessedData.length <= 0)">
      <div class="w-100 mt-4">
        <EmptyView></EmptyView>
      </div>
    </template>
    <!-- 空状态显示 E -->
  </div>
</template>

<style scoped lang="less">
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;

  .subordinate-data {
    width: 40px;
    height: 40px;
    right: 5px;
    bottom: 5px;
  }
}

@media (max-width: 480px) {
  .list {
    grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
    gap: 10px;
    justify-items: center;
  }
}

@media (max-width: 390px) {
  .list {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
    justify-items: center;
  }
}
</style>
