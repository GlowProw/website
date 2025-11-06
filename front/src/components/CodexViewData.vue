<script setup lang="ts">
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {computed, onMounted, ref} from "vue";
import {Items} from "glow-prow-data/src/entity/Items.ts";
import {useI18n} from "vue-i18n";
import Loading from "@/components/Loading.vue";
import {useRoute, useRouter} from "vue-router";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ItemName from "@/components/snbWidget/itemName.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import {useDisplay} from "vuetify/framework";
import {Commodities, Cosmetics, Materials, Modifications, Ships} from "glow-prow-data";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import ModName from "@/components/snbWidget/modName.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";

type LoadDataType = 'ship' | 'item' | 'commoditie' | 'material' | 'ultimate' | 'cosmetic' | 'modification'

const
    props = withDefaults(defineProps<{ loadDataType: LoadDataType }>(), {
      loadDataType: 'item'
    }),
    ships = Ships,
    items = Items,
    commodities = Commodities,
    materials = Materials,
    ultimates = Ultimates,
    cosmetics = Cosmetics,
    modifications = Modifications,
    route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    {mobile} = useDisplay(),
    {asString, sanitizeString} = useI18nUtils()

let data: any = ref([]),
    exceedingItemsCount = ref(0),
    // 筛选
    filterData = ref({
      types: [],
      keyValue: '',
      tags: [],
      inputWidgetKeyValue: '',
      page: 1,
      limit: 50
    }),
    // 类型筛选器可选选项
    typeFilterAvailableOptions = computed(() => [
      ...filterData.value.tags.map(tag => ({
        value: tag,
        text: t(`codex.type.${tag}`)
      }))
    ])

/**
 * 处理数据
 */
const onProcessedData = computed(() => {
      let d = originalData.value;
      let searchValue = filterData.value.keyValue.toLowerCase();
      let filterItemTypes = filterData.value.types;

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

        ]).toLowerCase().indexOf(searchValue) >= 0;
        const idMatch = i.id.toLowerCase().indexOf(searchValue) >= 0;

        // 检查类型匹配
        const typeMatch = filterItemTypes.length === 0 || filterItemTypes.includes(i.type) || filterItemTypes.includes(i.category);

        // 返回同时满足关键词和类型条件的项目
        return (nameMatch || idMatch) && typeMatch;
      });

      if (isSearching.value)
        exceedingItemsCount.value = Math.max(filteredData.length - maximumSearchCount, 0);
      return isSearching.value ? filteredData.slice(0, maximumSearchCount) : filteredData;
    }),
    maximumSearchCount = route.query.debug ? 10000 : 50,
    originalData = computed(() => {
      let d = []
      switch (props.loadDataType) {
        case "ship":
          d = ships;
          break;
        case "item":
          d = items;
          break;
        case "commoditie":
          d = commodities;
          break;
        case "material":
          d = materials;
          break;
        case "cosmetic":
          d = cosmetics;
          break;
        case "ultimate":
          d = ultimates;
          break;
        case "modification":
          d = modifications;
          break;
      }
      return Object.values(d)
    }),
    isSearching = computed(() => !!(filterData.value.keyValue)),
    isType = computed(() => filterData.value.types.length > 0),
    // 否应该显示无限滚动
    isShouldShowInfiniteScroll = computed(() => !isSearching.value && !isType.value)

onMounted(() => {
  const {type} = route.query

  if (type) {
    filterData.value.types = type.split(',')
  }

  onInitTagLoad()
})

/**
 * 初始筛选可选标签选项
 */
const onInitTagLoad = () => {
  let d = originalData.value

  filterData.value.tags = [...new Set(d.map(i => i.type || i.category))]
}

/**
 * 加载数据
 * @param done
 */
const onLoad = ({done}) => {
  // 如果正在搜索或筛选类型，直接返回空
  if (isSearching.value || isType.value) {
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
  filterData.value.keyValue = filterData.value.inputWidgetKeyValue;
  // 搜索时重置分页数据
  if (filterData.value.keyValue) {
    data.value = []
  }
}

/**
 * 过滤物品类型
 */
const onFilterItemType = (value) => {
  filterData.value.types = value;
  // 类型筛选时重置分页数据
  if (value.length > 0) {
    data.value = []
  }
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
              <v-icon>mdi-filter</v-icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </div>
          </template>

          <v-card border class="pa-5" :min-width="mobile ? '100%' : 300" :width="mobile ? '100%' : 400">
            <v-row>
              <v-col cols="12">
                <div class="mb-2">{{ t('assembly.workshop.filter.byType') }}</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterItemType"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.types"
                    :placeholder="t('assembly.workshop.filter.byType')"
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
            </v-row>
          </v-card>
        </v-menu>
      </v-col>
    </v-row>

    <v-divider class="my-3"></v-divider>

    <template v-if="exceedingItemsCount > 0">
      <v-alert class="w-100 mb-5" type="warning" variant="tonal">
        {{ t('codex.ships.searchCountOverflowTip', {maximumSearchCount, exceedingItemsCount}) }}
      </v-alert>
    </template>

    <template v-if="isShouldShowInfiniteScroll">
      <v-infinite-scroll @load="onLoad">
        <v-row class="list ga-4" no-gutters>
          <v-card v-for="(i,index) in data" :key="index" width="120" variant="text">
            <ItemSlotBase size="120px">
              <ShipIconWidget :id="i.id" v-if="loadDataType == 'ship'"></ShipIconWidget>
              <ItemIconWidget :id="i.id" v-if="loadDataType == 'item'"></ItemIconWidget>
              <CommoditieIconWidget :id="i.id" v-if="loadDataType == 'commoditie'"></CommoditieIconWidget>
              <MaterialIconWidget :id="i.id" v-if="loadDataType == 'material'"></MaterialIconWidget>
              <CosmeticIconWidget :id="i.id" v-if="loadDataType == 'cosmetic'"></CosmeticIconWidget>
              <UltimateIconWidget :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateIconWidget>
              <ModIconWidget :id="i.id" v-if="loadDataType == 'modification'"></ModIconWidget>
            </ItemSlotBase>
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
              <UltimateName :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateName>
              <ModName :id="i.id" v-if="loadDataType == 'modification'" :grade="i.grade"></ModName>
            </div>
          </v-card>
        </v-row>
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
    </template>
    <template v-else>
      <!-- 搜索或筛选时的显示 S -->
      <v-row class="list ga-4" no-gutters>
        <v-card v-for="(i,index) in onProcessedData" :key="index" width="120" variant="text">
          <ItemSlotBase size="120px">
            <ShipIconWidget :id="i.id" v-if="loadDataType == 'ship'"></ShipIconWidget>
            <ItemIconWidget :id="i.id" v-if="loadDataType == 'item'"></ItemIconWidget>
            <CommoditieIconWidget :id="i.id" v-if="loadDataType == 'commoditie'"></CommoditieIconWidget>
            <MaterialIconWidget :id="i.id" v-if="loadDataType == 'material'"></MaterialIconWidget>
            <CosmeticIconWidget :id="i.id" v-if="loadDataType == 'cosmetic'"></CosmeticIconWidget>
            <UltimateIconWidget :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateIconWidget>
            <ModIconWidget :id="i.id" v-if="loadDataType == 'modification'"></ModIconWidget>
          </ItemSlotBase>
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
            <UltimateName :id="i.id" v-if="loadDataType == 'ultimate'"></UltimateName>
            <ModName :id="i.id" v-if="loadDataType == 'modification'" :grade="i.grade"></ModName>
          </div>
        </v-card>
      </v-row>
      <!-- 搜索或筛选时的显示 E -->
    </template>

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
  grid-auto-columns: minmax(120px, 120px);
}
</style>
