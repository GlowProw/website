<script setup lang="ts">
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {computed, onMounted, ref} from "vue";
import {Items} from "glow-prow-data/src/entity/Items.ts";
import {useI18n} from "vue-i18n";
import Loading from "@/components/Loading.vue";
import {useRoute} from "vue-router";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ItemName from "@/components/snbWidget/itemName.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";

const items = Items,
    route = useRoute(),
    {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()

let itemsData: any = ref([]),
    exceedingItemsCount = ref(0),
    itemsFilter = ref({
      type: '',
      keyValue: '',
      tags: [],
      inputWidgetKeyValue: '',
      page: 1,
      limit: 50
    });

/**
 * 处理数据
 */
const onProcessedData = computed(() => {
      let originalData = Object.values(items);
      let searchValue = itemsFilter.value.keyValue.toLowerCase();
      let filterItemType = itemsFilter.value.type;

      const filteredData = originalData.filter(i => {
        // 检查关键词匹配
        const nameMatch = asString([
          i.id,
          `snb.items.${i.id}.name`,
          `snb.items.${sanitizeString(i.id).cleaned}.name`
        ]).toLowerCase().indexOf(searchValue) >= 0;
        const idMatch = i.id.toLowerCase().indexOf(searchValue) >= 0;

        // 检查类型匹配
        const typeMatch = filterItemType ? i.type === filterItemType : true;

        // 返回同时满足关键词和类型条件的项目
        return (nameMatch || idMatch) && typeMatch;
      });

      if (isSearching.value)
        exceedingItemsCount.value = Math.max(filteredData.length - maximumSearchCount, 0);
      return isSearching.value ? filteredData.slice(0, maximumSearchCount) : filteredData;
    }),
    maximumSearchCount = route.query.debug ? 10000 : 50,
    isSearching = computed(() => !!(itemsFilter.value.keyValue)),
    isType = computed(() => !!itemsFilter.value.type)

onMounted(() => {
  onFirstLoad()
})

const onFirstLoad = () => {
  const data = Object.values(items);
  itemsFilter.value.tags = [...new Set(data.map(item => item.type))]
  itemsData.value.push(...data.slice(
      0,
      itemsFilter.value.limit
  ))
}

const onLoad = ({done}) => {
  const data = Object.values(items);
  const startIndex = (itemsFilter.value.page - 1) * itemsFilter.value.limit; // 修正起点
  const endIndex = startIndex + itemsFilter.value.limit;

  itemsData.value.push(...data.slice(startIndex, endIndex));
  itemsFilter.value.page++;

  if (itemsData.value.length >= data.length) {
    done('empty');
  } else {
    done('ok');
  }
}

/**
 * 检索
 */
const onSearchItem = () => {
  itemsFilter.value.keyValue = itemsFilter.value.inputWidgetKeyValue;
}

const onFilterItemType = (value) => {
  itemsFilter.value.type = value;
}
</script>

<template>
  <v-container class="pa-5 pb-0">
    <v-row align="center">
      <v-col cols="auto">
        <v-icon>mdi-filter</v-icon>
      </v-col>
      <v-col>
        <v-text-field :placeholder="t('basic.button.search')" hide-details
                      variant="filled"
                      density="comfortable"
                      clearable
                      @keydown.enter="onSearchItem"
                      @click:clear="onSearchItem"
                      v-model="itemsFilter.inputWidgetKeyValue">
          <template v-slot:append-inner>
            <v-btn @click="onSearchItem" icon variant="text" density="comfortable">
              <v-icon icon="mdi-magnify"></v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-select
            width="200"
            variant="filled"
            @update:model-value="onFilterItemType"
            item-value="value"
            item-title="text"
            density="comfortable"
            :items="[
                  { value: '', text: t('assembly.workshop.filter.all') },
                  ...itemsFilter.tags.map(tag => ({
                    value: tag,
                    text: t(`displayCabinet.type.${tag}`)
                  }))
                ]"
            :label="t('assembly.workshop.filter.byType')"
            hide-details
            clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-divider class="mt-3"></v-divider>

    <template v-if="exceedingItemsCount > 0">
      <v-alert class="w-100 mb-5" type="warning" variant="tonal">
        {{ t('displayCabinet.ships.searchCountOverflowTip', {maximumSearchCount, exceedingItemsCount}) }}
      </v-alert>
    </template>

    <v-infinite-scroll
        height="100vh"
        @load="onLoad">
      <template v-if="!isSearching && !isType">
        <v-row class="item-list ga-4" no-gutters>
          <v-card v-for="(i,index) in itemsData" :key="index" width="99" variant="text">
            <ItemSlotBase size="99px">
              <ItemIconWidget :id="i.id"></ItemIconWidget>
            </ItemSlotBase>
            <div class="text-center singe-line w-100">
              <ItemNameRarity :id="i.id">
                <ItemName :data="i"></ItemName>
              </ItemNameRarity>
            </div>
          </v-card>
        </v-row>
      </template>
      <template v-else>
        <v-row class="item-list ga-4" no-gutters>
          <v-card v-for="(i,index) in onProcessedData" :key="index" width="99" variant="text">
            <ItemSlotBase size="99px">
              <ItemIconWidget :id="i.id"></ItemIconWidget>
            </ItemSlotBase>
            <div class="text-center singe-line w-100">
              <ItemNameRarity :id="i.id">
                <ItemName :data="i"></ItemName>
              </ItemNameRarity>
            </div>
          </v-card>
        </v-row>
      </template>
      <template v-slot:empty></template>
      <template v-slot:loading>
        <v-btn density="comfortable" icon>
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
      <template  v-if="onProcessedData.length <= 0">
        <v-card border class="w-100">
          <EmptyView></EmptyView>
        </v-card>
      </template>
    </v-infinite-scroll>
  </v-container>
</template>

<style scoped lang="less">
.item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
