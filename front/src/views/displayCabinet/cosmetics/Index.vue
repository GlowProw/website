<script setup lang="ts">

import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {Cosmetics} from "glow-prow-data";

import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";

const cosmetics = Cosmetics,
    route = useRoute(),
    {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()

let cosmeticsData: any = ref([]),
    exceedingItemsCount = ref(0),
    cosmeticsDataFilter = ref({
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
      let originalData = Object.values(cosmetics);
      let searchValue = cosmeticsDataFilter.value.keyValue.toLowerCase();
      let filterItemType = cosmeticsDataFilter.value.type;

      const filteredData = originalData.filter(i => {
        // 检查关键词匹配
        const nameMatch = asString([
          i.id,
          `snb.cosmetics.${i.id}.name`,
          `snb.cosmetics.${sanitizeString(i.id).cleaned}.name`
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
    isSearching = computed(() => !!(cosmeticsDataFilter.value.keyValue)),
    isType = computed(() => !!cosmeticsDataFilter.value.type)

onMounted(() => {
  onFirstLoad()
})

const onFirstLoad = () => {
  const data = Object.values(cosmetics);
  cosmeticsDataFilter.value.tags = [...new Set(data.map(item => item.type))]
  cosmeticsData.value.push(...data.slice(
      0,
      cosmeticsDataFilter.value.limit
  ))
}

const onLoad = ({done}) => {
  const data = Object.values(cosmetics);
  const startIndex = (cosmeticsDataFilter.value.page - 1) * cosmeticsDataFilter.value.limit; // 修正起点
  const endIndex = startIndex + cosmeticsDataFilter.value.limit;

  cosmeticsData.value.push(...data.slice(startIndex, endIndex));
  cosmeticsDataFilter.value.page++;

  if (cosmeticsData.value.length >= data.length) {
    done('empty');
  } else {
    done('ok');
  }
}

/**
 * 检索
 */
const onSearchItem = () => {
  cosmeticsDataFilter.value.keyValue = cosmeticsDataFilter.value.inputWidgetKeyValue;
}

const onFilterItemType = (value) => {
  cosmeticsDataFilter.value.type = value;
}
</script>

<template>
  <v-container class="pa-5">
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
                      v-model="cosmeticsDataFilter.inputWidgetKeyValue">
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
                  ...cosmeticsDataFilter.tags.map(tag => ({
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

    <v-infinite-scroll @load="onLoad">
      <template v-if="!isSearching && !isType">
        <v-row class="cosmetic-list ga-4" no-gutters>
          <v-card v-for="(i,index) in cosmeticsData" :key="index" width="99" variant="text">
            <ItemSlotBase size="99px">
              <CosmeticIconWidget :id="i.id"></CosmeticIconWidget>
            </ItemSlotBase>
            <div class="text-center singe-line w-100">
              <CosmeticName :id="i.id"></CosmeticName>
            </div>
          </v-card>
        </v-row>
      </template>
      <template v-else>
        <v-row class="cosmetic-list ga-4" no-gutters>
          <v-card v-for="(i,index) in onProcessedData" :key="index" width="99" variant="text">
            <ItemSlotBase size="99px">
              <CosmeticIconWidget :id="i.id"></CosmeticIconWidget>
            </ItemSlotBase>
            <div class="text-center singe-line w-100">
              <CosmeticName :id="i.id"></CosmeticName>
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
      <template v-if="onProcessedData.length <= 0">
        <v-card border class="w-100 mt-1">
          <EmptyView></EmptyView>
        </v-card>
      </template>
    </v-infinite-scroll>
  </v-container>
</template>

<style scoped lang="less">
.cosmetic-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
