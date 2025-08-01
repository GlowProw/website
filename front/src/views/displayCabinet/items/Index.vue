<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {computed, onMounted, ref} from "vue";
import {Items} from "glow-prow-data/src/entity/Items.ts";
import {useI18n} from "vue-i18n";
import Loading from "@/components/Loading.vue";
import {useRoute} from "vue-router";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";

const items: Items = Items,
    route = useRoute(),
    {t} = useI18n()

let itemsData: any = ref([]),
    exceedingItemsCount = ref(0),
    itemsFilter = ref({
      type: 'index',
      keyValue: '',
      inputWidgetKeyValue: '',
      page: 1,
      limit: 50
    });

/**
 * 处理数据
 */
const onProcessedData = computed(() => {
      let originalData = Object.values(itemsData.value),
          resultData = [],
          searchValue = itemsFilter.value.keyValue

      if (!searchValue)
        return itemsData;

      if (searchValue) {
        const filteredData = originalData.filter(i =>
            i.id.indexOf(searchValue) >= 0 ||
            t(`snb.items.${i.id}.name`).indexOf(searchValue) >= 0
        );

        resultData = filteredData.slice(0, maximumSearchCount);
        exceedingItemsCount.value = Math.max(filteredData.length - maximumSearchCount, 0);
      }

      return resultData;
    }),
    maximumSearchCount = 30,
    isSearching = computed(() => itemsFilter.value.keyValue)

onMounted(() => {
  onFirstLoad()
})

const onFirstLoad = () => {
  const data = Object.values(items);
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

</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('home.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.items.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container>
    <v-row>
      <v-col cols="12" lg="6" xl="6">
        <h1 class="btn-flavor ships-title">{{ t('displayCabinet.items.title') }}</h1>
        <div class="w-75 mt-2">
          {{ t('displayCabinet.items.description') }}
        </div>
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <v-row>
          <v-col>
            <v-text-field :placeholder="t('basic.button.search')" hide-details
                          variant="solo-filled"
                          density="comfortable"
                          clearable
                          @keydown.enter="onSearchItem"
                          @click:clear="onSearchItem"
                          v-model="itemsFilter.inputWidgetKeyValue">
              <template v-slot:append-inner>
                <v-btn @click="onSearchItem">{{ t('basic.button.search') }}</v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>

  <template v-if="!isSearching">
    <v-infinite-scroll
        height="100vh"
        :items="itemsData"
        @load="onLoad">
      <v-container>
        <v-row class="item-list">
          <div v-for="(i,index) in itemsData" :key="index">
            <template v-if="route.query.debug">
              {{ i.id }}
            </template>

            <ItemSlotBase size="99px">
              <ItemIconWidget :id="i.id"></ItemIconWidget>
            </ItemSlotBase>
          </div>
        </v-row>
      </v-container>
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
    </v-infinite-scroll>
  </template>
  <template v-else>
    <v-container>
      <template v-if="exceedingItemsCount > 0" >
        <v-alert class="w-100 mb-5" type="warning" variant="tonal">
          {{ t('displayCabinet.ships.searchCountOverflowTip', {maximumSearchCount,exceedingItemsCount}) }}
        </v-alert>
      </template>

      <v-row class="item-list">
        <div v-for="(i,index) in onProcessedData" :key="index">
          <template v-if="route.query.debug">
            {{ i.id }}
          </template>

          <ItemSlotBase size="99px">
            <ItemIconWidget :id="i.id"></ItemIconWidget>
          </ItemSlotBase>
        </div>

        <v-card border class="w-100" v-if="onProcessedData.length <= 0">
          <EmptyView></EmptyView>
        </v-card>
      </v-row>
    </v-container>
  </template>
</template>

<style scoped lang="less">
.item-list {
  > div {
    margin: 10px;
  }
}
</style>
